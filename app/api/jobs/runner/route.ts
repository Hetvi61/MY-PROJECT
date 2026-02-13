export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ScheduledJob from '@/models/ScheduledJob'
import PastJob from '@/models/PastJob'

/* ================= CORE LOGIC ================= */
async function runJobs() {
  await connectDB()
  const now = new Date()

  const jobs = await ScheduledJob.find({
    scheduled_datetime: { $lte: now },
    job_status: 'to_do',
  })

  for (const job of jobs) {
    try {
      // 🔹 Mark as in progress
      await ScheduledJob.findByIdAndUpdate(job._id, {
        job_status: 'in_progress',
      })

      // 🔹 FUTURE ACTION (WhatsApp / Email / API)
      // await sendMessage(job)

      // ✅ Success → move to past jobs
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

      // ❌ Failure → move to past jobs
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


/* ================= AUTO (GitHub Actions / Cron) ================= */
export async function POST() {
  const processed = await runJobs()

  return NextResponse.json({
    success: true,
    processed,
    auth: 'BYPASSED_FOR_TEST',
  })
}


/* ================= OPTIONAL MANUAL (ADMIN BUTTON) ================= */
/* Call this from admin panel with same secret */
export async function GET(req: Request) {
  try {
    const secret = req.headers.get('x-cron-secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const processed = await runJobs()

    return NextResponse.json({
      success: true,
      source: 'manual',
      processed,
    })
  } catch (error) {
    console.error('Runner GET error:', error)
    return NextResponse.json(
      { error: 'Runner failed' },
      { status: 500 }
    )
  }
}
