import { NextResponse } from "next/server"
import { initWhatsApp, getWhatsAppStatus } from "@/lib/whatsapp"

export async function GET() {
  initWhatsApp()          // ✅ start WhatsApp ONLY ONCE
  return NextResponse.json(getWhatsAppStatus())
}