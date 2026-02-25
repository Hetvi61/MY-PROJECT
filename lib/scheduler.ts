import * as cron from "node-cron"
import { connectDB } from "@/lib/mongodb"
import ScheduledJob from "@/models/ScheduledJob"
import PastJob from "@/models/PastJob"
import {
  getWhatsAppStatus,
  initWhatsApp,              // ✅ ADD THIS
  sendScheduledWhatsAppJob,
} from "@/lib/whatsapp"

// ✅ GLOBAL FLAG (SURVIVES HMR)
declare global {
  var __SCHEDULER_STARTED__: boolean | undefined
}

export function startScheduler() {
  if (global.__SCHEDULER_STARTED__) return
  global.__SCHEDULER_STARTED__ = true

  console.log("⏰ Scheduler started INSIDE Next.js")

  // ✅ START WHATSAPP ONCE
  initWhatsApp()

  cron.schedule("* * * * *", async () => {
    try {
      const status = getWhatsAppStatus()
      if (!status.ready) {
        console.log("⏳ WhatsApp not ready")
        return
      }

      await connectDB()
      const now = new Date()

      const jobs = await ScheduledJob.find({
        job_type: "whatsapp",
        job_status: "to_do",
        scheduled_datetime: { $lte: now },
      })

      for (const job of jobs) {
        try {
          await sendScheduledWhatsAppJob({
            phone: job.job_json.phone,
            message: job.job_json.message,
            mediaUrl: job.job_media_url || undefined,
          })

          await PastJob.create({
            ...job.toObject(),
            job_status: "delivered",
            delivered_datetime: new Date(),
          })

          await ScheduledJob.findByIdAndDelete(job._id)
          console.log("✅ Job sent:", job._id.toString())
        } catch (err: any) {
          await PastJob.create({
            ...job.toObject(),
            job_status: "failed",
            error: err.message,
            delivered_datetime: new Date(),
          })
          await ScheduledJob.findByIdAndDelete(job._id)
        }
      }
    } catch (err: any) {
      console.error("🔥 Scheduler error:", err.message)
    }
  })
}