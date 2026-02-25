import { NextResponse } from "next/server"
import { getWhatsAppStatus } from "@/lib/whatsapp"

export async function GET() {
  return NextResponse.json(getWhatsAppStatus())
}