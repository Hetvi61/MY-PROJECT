import * as cron from "node-cron"
import { connectDB } from "@/lib/mongodb"
import ScheduledJob from "@/models/ScheduledJob"
import PastJob from "@/models/PastJob"
import {
  getWhatsAppStatus,
                
  sendScheduledWhatsAppJob,
} from "@/lib/whatsapp"

// ✅ GLOBAL FLAG (SURVIVES HMR)
declare global {
  // eslint-disable-next-line no-var
  var __SCHEDULER_STARTED__: boolean | undefined
}

export function startScheduler() {
  if (global.__SCHEDULER_STARTED__) {
    return
  }

  global.__SCHEDULER_STARTED__ = true

  console.log("⏰ Scheduler started INSIDE Next.js (singleton)")

  cron.schedule("* * * * *", async () => {
    try {
      const status = getWhatsAppStatus()

      // 🔥 FIX: AUTO-START WHATSAPP FOR SCHEDULER
      if (!status.ready) {
        
        console.log("⏳ WhatsApp not ready, trying to initialize...")
        return
      }

      await connectDB()
      const now = new Date()

      const jobs = await (ScheduledJob as any).find({
        job_type: "whatsapp",
        job_status: "to_do",
        scheduled_datetime: { $lte: now },
      })

      for (const job of jobs) {
        try {
          let phone = job.job_json?.phone || ""
          phone = phone.replace(/\D/g, "")
          if (phone.length === 10) phone = `91${phone}`

          await sendScheduledWhatsAppJob({
            phone,
            message: job.job_json?.message,
            mediaUrl: job.job_media_url || undefined,
          })

          await (PastJob as any).create({
            ...job.toObject(),
            job_status: "delivered",
            delivered_datetime: new Date(),
          })

          await (ScheduledJob as any).findByIdAndDelete(job._id)

          console.log("✅ Job sent:", job._id.toString())
        } catch (err: any) {
          await (PastJob as any).create({
            ...job.toObject(),
            job_status: "failed",
            error: err.message,
            delivered_datetime: new Date(),
          })

          await (ScheduledJob as any).findByIdAndDelete(job._id)
        }
      }
    } catch (err: any) {
      console.error("🔥 Scheduler error:", err.message)
    }
  })
}