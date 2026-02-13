import { NextResponse } from "next/server"

export async function GET() {
  const res = await fetch(
    `${process.env.BASE_URL}/api/jobs/runner`,
    {
      method: "POST",
      headers: {
        "CRON_SECRET": process.env.CRON_SECRET!,
      },
    }
  )

  return NextResponse.json({ success: true })
}
