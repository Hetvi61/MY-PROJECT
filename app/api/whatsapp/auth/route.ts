import { NextResponse } from 'next/server'

// ✅ ADD THIS
import { initWhatsApp } from '@/lib/whatsapp'

export async function GET() {
  initWhatsApp()

  return NextResponse.json({ started: true })
}