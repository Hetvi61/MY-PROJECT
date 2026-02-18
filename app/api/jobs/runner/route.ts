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
      // 🔹 Mark job in progress
      await ScheduledJob.findByIdAndUpdate(job._id, {
        job_status: 'in_progress',
      })

      /* ================= WHATSAPP TASK ================= */
      if (job.job_type === 'whatsapp') {
        let phone = job.job_json?.phone?.toString() || ''
        phone = phone.replace(/\D/g, '')

        if (phone.length === 10) phone = `91${phone}`

        // ✅ REQUIRED by WhatsApp
        const whatsappTo = `${phone}@c.us`

        if (!phone || !job.job_json?.message) {
          throw new Error('Invalid WhatsApp payload')
        }

        const res = await fetch(process.env.WHATSAPP_WORKER_URL!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: whatsappTo,
            message: job.job_json.message,
            mediaUrl: job.job_media_url || null,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          console.error('WhatsApp worker error:', data)
          throw new Error(data?.error || 'WhatsApp worker failed')
        }
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

    } catch (err: any) {
      console.error('❌ Job failed:', err.message)

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

/* ================= CRON ================= */
export async function POST(req: Request) {
  console.log('RUNNER HIT AT', new Date().toISOString())

  const headerSecret = req.headers.get('x-cron-secret')
  const envSecret = process.env.CRON_SECRET?.trim()

  if (!envSecret || headerSecret !== envSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const processed = await runJobs()
  return NextResponse.json({ success: true, processed })
}

/* ================= MANUAL ================= */
export async function GET(req: Request) {
  const headerSecret = req.headers.get('x-cron-secret')
  const envSecret = process.env.CRON_SECRET?.trim()

  if (!envSecret || headerSecret !== envSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const processed = await runJobs()
  return NextResponse.json({ success: true, processed })
}
