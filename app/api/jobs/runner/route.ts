export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ScheduledJob from '@/models/ScheduledJob';
import PastJob from '@/models/PastJob';
import { sendScheduledWhatsAppJob } from '@/lib/whatsapp';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown error';
}

/* ================= CORE LOGIC ================= */
async function runJobs() {
  await connectDB();
  const now = new Date();

  const jobs = await ScheduledJob.find({
    scheduled_datetime: { $lte: now },
    job_status: 'to_do',
  });

  for (const job of jobs) {
    const claimedJob = await ScheduledJob.findOneAndUpdate(
      { _id: job._id, job_status: 'to_do' },
      { $set: { job_status: 'in_progress' } },
      { new: true },
    );

    if (!claimedJob) continue;

    try {
      console.log('🚀 RUNNING JOB:', claimedJob._id.toString());

      /* ================= WHATSAPP TASK ================= */
      if (claimedJob.job_type === 'whatsapp') {
        let phone = claimedJob.job_json?.phone?.toString() || '';
        phone = phone.replace(/\D/g, '');

        if (phone.length === 10) phone = `91${phone}`;

        if (
          !phone ||
          (!claimedJob.job_json?.message && !claimedJob.job_media_url)
        ) {
          throw new Error('Invalid WhatsApp payload');
        }

        // ✅ DIRECT AUTOMATIC SEND
        await sendScheduledWhatsAppJob({
          phone,
          message: claimedJob.job_json.message,
          mediaUrl: claimedJob.job_media_url || undefined,
        });
      }

      /* ================= MOVE TO PAST (SUCCESS) ================= */
      await PastJob.create({
        client_name: claimedJob.client_name,
        job_name: claimedJob.job_name,
        job_type: claimedJob.job_type,
        job_json: claimedJob.job_json,
        job_media_url: claimedJob.job_media_url,
        job_status: 'delivered',
        created_datetime: claimedJob.created_datetime,
        delivered_datetime: new Date(),
      });

      await ScheduledJob.findByIdAndDelete(claimedJob._id);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      console.error('❌ JOB FAILED:', errorMessage);

      /* ================= MOVE TO PAST (FAILED) ================= */
      await PastJob.create({
        client_name: claimedJob.client_name,
        job_name: claimedJob.job_name,
        job_type: claimedJob.job_type,
        job_json: claimedJob.job_json,
        job_media_url: claimedJob.job_media_url,
        job_status: 'failed',
        error: errorMessage,
        created_datetime: claimedJob.created_datetime,
        delivered_datetime: new Date(),
      });

      await ScheduledJob.findByIdAndDelete(claimedJob._id);
    }
  }

  return jobs.length;
}

/* ================= CRON ================= */
export async function POST(req: Request) {
  console.log('⏰ RUNNER HIT AT', new Date().toISOString());

  const headerSecret = req.headers.get('x-cron-secret');
  const envSecret = process.env.CRON_SECRET?.trim();

  if (!envSecret || headerSecret !== envSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const processed = await runJobs();
  return NextResponse.json({ success: true, processed });
}

/* ================= MANUAL ================= */
export async function GET(req: Request) {
  const headerSecret = req.headers.get('x-cron-secret');
  const envSecret = process.env.CRON_SECRET?.trim();

  if (!envSecret || headerSecret !== envSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const processed = await runJobs();
  return NextResponse.json({ success: true, processed });
}