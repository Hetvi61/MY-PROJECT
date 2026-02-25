export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ScheduledJob from '@/models/ScheduledJob'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    await connectDB()
    const formData = await req.formData()

    /* ================= BASIC FIELDS ================= */
    const client_name = String(formData.get('client_name') || '')
    const job_name = String(formData.get('job_name') || '')
    const job_type = String(formData.get('job_type') || 'post')
    const scheduled_input = formData.get('scheduled_datetime')

    if (!client_name || !job_name || !scheduled_input) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    /* ================= IST → UTC (+ safety buffer) ================= */
    const input = String(scheduled_input)
    const [datePart, timePart] = input.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)

    // IST → UTC
    const scheduledUTC = new Date(
      Date.UTC(year, month - 1, day, hour - 5, minute - 30)
    )

    // ✅ SAFETY BUFFER (30 seconds)
    scheduledUTC.setSeconds(scheduledUTC.getSeconds() + 30)

    /* ================= FILE UPLOAD (WHATSAPP) ================= */
    let job_media_url: string | null = null
    const file = formData.get('file') as File | null

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const uploadDir = path.join(process.cwd(), 'public/uploads/whatsapp')

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const fileName = `${Date.now()}-${file.name}`
      fs.writeFileSync(path.join(uploadDir, fileName), buffer)

      const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
      job_media_url = `${baseUrl}/uploads/whatsapp/${fileName}`
    }

    /* ================= WHATSAPP LOGIC ================= */
    let jobJson: {
      phone?: string
      message?: string
    } = {}

    if (job_type === 'whatsapp') {
      const whatsapp_number = String(formData.get('whatsapp_number') || '')
      const message_text = String(formData.get('message_text') || '')

      if (!whatsapp_number) {
        return NextResponse.json(
          { error: 'WhatsApp number is required' },
          { status: 400 }
        )
      }

      if (!message_text && !job_media_url) {
        return NextResponse.json(
          { error: 'Message or media is required for WhatsApp job' },
          { status: 400 }
        )
      }

      let phone = whatsapp_number.replace(/\D/g, '')
      if (phone.length === 10) phone = `91${phone}`

      jobJson = {
        phone,
        message: message_text || '',
      }
    }

    /* ================= CREATE JOB ================= */
    const job = await ScheduledJob.create({
      client_name,
      job_name,
      job_type,
      job_json: jobJson,
      job_media_url,
      scheduled_datetime: scheduledUTC,
      created_datetime: new Date(),
      job_status: 'to_do', // 🔑 important for retry logic
    })

    return NextResponse.json(job)
  } catch (error: any) {
    console.error('Scheduled Job POST error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to create scheduled job' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()
    const jobs = await ScheduledJob.find().sort({ scheduled_datetime: 1 })
    return NextResponse.json(jobs)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch scheduled jobs' },
      { status: 500 }
    )
  }
}