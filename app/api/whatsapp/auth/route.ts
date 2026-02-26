import { NextResponse } from "next/server"
import { initWhatsApp, getWhatsAppStatus } from "@/lib/whatsapp"

export async function GET() {
  const status = getWhatsAppStatus()

  // 🔥 IMPORTANT FIX:
  // Only start WhatsApp if it's NOT ready and NO QR exists
  if (!status.ready && !status.qr) {
    initWhatsApp()
  }

  return NextResponse.json({ started: true })
}