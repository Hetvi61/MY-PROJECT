import { NextResponse } from "next/server"

export async function GET() {
  const res = await fetch(
    `${process.env.BASE_URL}/api/jobs/runner`,
    { method: "POST" }
  )

  return NextResponse.json({ success: true })
}
