import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ScheduledJob from "@/models/ScheduledJob";
import { istToUtc } from "@/lib/time";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      job_name,
      client_name,
      job_type,
      scheduled_datetime_ist,
      whatsapp,
      media_url
    } = body;

    // 1️⃣ Basic validation
    if (!job_name || !client_name || !job_type || !scheduled_datetime_ist) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (job_type === "whatsapp") {
      if (!whatsapp?.phone || (!whatsapp?.message && !media_url)) {
        return NextResponse.json(
          { error: "WhatsApp phone and message/media required" },
          { status: 400 }
        );
      }
    }

    // 2️⃣ Convert IST → UTC
    const scheduled_datetime = istToUtc(scheduled_datetime_ist);

    // 3️⃣ Create scheduled job
    const job = await ScheduledJob.create({
      job_name,
      client_name,
      job_type,
      scheduled_datetime,
      job_status: "to_do",
      job_json: whatsapp || {},
      job_media_url: media_url || null,
      created_from: "api",
      created_datetime: new Date()   // ✅ FIX
    });

    return NextResponse.json({
      message: "Job scheduled successfully via API",
      job_id: job._id
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}