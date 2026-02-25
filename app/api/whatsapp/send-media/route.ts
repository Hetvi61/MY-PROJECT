import { NextResponse } from 'next/server'
import {
  initWhatsApp,
  sendWhatsAppMessage,
  getWhatsAppStatus,
} from '@/lib/whatsapp'
import { MessageMedia } from 'whatsapp-web.js'
import fs from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    // ✅ safe init
    initWhatsApp()

    const status = getWhatsAppStatus()
    if (!status.ready) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not connected' },
        { status: 400 }
      )
    }

    const formData = await req.formData()

    const phone = formData.get('phone') as string
    const caption = (formData.get('caption') as string) || ''
    const file = formData.get('file') as File

    if (!phone || !file) {
      return NextResponse.json(
        { success: false, error: 'Phone and file are required' },
        { status: 400 }
      )
    }

    const rawPhone = phone.replace(/\D/g, '')
    const cleanPhone =
      rawPhone.length === 10 ? `91${rawPhone}` : rawPhone

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'whatsapp'
    )

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, file.name)
    fs.writeFileSync(filePath, buffer)

    const media = MessageMedia.fromFilePath(filePath)

    await sendWhatsAppMessage(cleanPhone, media, caption)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Send media error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}