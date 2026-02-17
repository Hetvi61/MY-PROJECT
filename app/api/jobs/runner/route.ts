export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ScheduledJob from '@/models/ScheduledJob'
import PastJob from '@/models/PastJob'

/* ✅ ADD THESE IMPORTS */
import {
  initWhatsApp,
  sendScheduledWhatsAppJob,
} from '@/lib/whatsapp'

/* ✅ INITIALIZE WHATSAPP ONCE */
initWhatsApp()

/* ================= CORE LOGIC ================= */
async function runJobs() {
  await connectDB()
  const now = new Date()

  const jobs = await ScheduledJob.find({
    scheduled_datetime: { $lte: now },
    job_status: 'to_do',
  })

  /* ================= DELAY MONITORING ================= */
  const MAX_DELAY_MINUTES = 10

  for (const job of jobs) {
    const delayMinutes =
      (now.getTime() - job.scheduled_datetime.getTime()) / 60000

    if (delayMinutes > MAX_DELAY_MINUTES) {
      console.warn(
        '⚠️ Job delayed',
        job._id.toString(),
        `${delayMinutes.toFixed(1)} minutes`
      )
    }
  }

  /* ================= JOB EXECUTION ================= */
  for (const job of jobs) {
    try {
      // 🔹 Mark as in progress
      await ScheduledJob.findByIdAndUpdate(job._id, {
        job_status: 'in_progress',
      })

      /* ================= WHATSAPP EXECUTION ================= */
      if (job.job_type === 'post') {
        await sendScheduledWhatsAppJob({
          phone: job.job_json?.phone,
          message: job.job_json?.message,
          mediaUrl: job.job_media_url || undefined,
        })
      }

      /* ================= MOVE TO PAST (SUCCESS) ================= */
      await PastJob.create({
        client_name: job.client_name,
        job_name: job.job_name,
        job_type: job.job_type,
        job_json: job.job_json,
        job_media_url: job.job_media_url,
        job_status: 'delivered',
        created_datetime: job.created_datetime,
        delivered_datetime: new Date(),
      })

      await ScheduledJob.findByIdAndDelete(job._id)
    } catch (err) {
      console.error('Job failed:', err)

      /* ================= MOVE TO PAST (FAILED) ================= */
      await PastJob.create({
        client_name: job.client_name,
        job_name: job.job_name,
        job_type: job.job_type,
        job_json: job.job_json,
        job_media_url: job.job_media_url,
        job_status: 'failed',
        created_datetime: job.created_datetime,
        delivered_datetime: new Date(),
      })

      await ScheduledJob.findByIdAndDelete(job._id)
    }
  }

  return jobs.length
}

/* ================= CRON / SCHEDULER ================= */
export async function POST(req: Request) {
  console.log('RUNNER HIT AT', new Date().toISOString())

  const headerSecret = req.headers.get('x-cron-secret')
  const envSecret = process.env.CRON_SECRET?.trim()

  if (!envSecret || headerSecret !== envSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const processed = await runJobs()

  return NextResponse.json({
    success: true,
    processed,
  })
}

/* ================= OPTIONAL MANUAL ================= */
export async function GET(req: Request) {
  const headerSecret = req.headers.get('x-cron-secret')
  const envSecret = process.env.CRON_SECRET?.trim()

  if (!envSecret || headerSecret !== envSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const processed = await runJobs()

  return NextResponse.json({
    success: true,
    processed,
  })
}
