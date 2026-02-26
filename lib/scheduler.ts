import * as cron from 'node-cron';
import { connectDB } from '@/lib/mongodb';
import ScheduledJob from '@/models/ScheduledJob';
import PastJob from '@/models/PastJob';
import {
  getWhatsAppStatus,
  initWhatsApp, // ✅ ADD THIS
  sendScheduledWhatsAppJob,
} from '@/lib/whatsapp';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown error';
}

// ✅ GLOBAL FLAG (SURVIVES HMR)
declare global {
  var __SCHEDULER_STARTED__: boolean | undefined;
  var __SCHEDULER_RUNNING__: boolean | undefined;
}

export function startScheduler() {
  if (global.__SCHEDULER_STARTED__) return;
  global.__SCHEDULER_STARTED__ = true;

  console.log('⏰ Scheduler started INSIDE Next.js');

  // ✅ START WHATSAPP ONCE
  initWhatsApp();

  cron.schedule('* * * * *', async () => {
    if (global.__SCHEDULER_RUNNING__) {
      console.log('⏭️ Scheduler tick skipped (already running)');
      return;
    }
    global.__SCHEDULER_RUNNING__ = true;

    try {
      const status = getWhatsAppStatus();
      if (!status.ready) {
        console.log('⏳ WhatsApp not ready');
        return;
      }

      await connectDB();
      const now = new Date();

      const jobs = await ScheduledJob.find({
        job_type: 'whatsapp',
        job_status: 'to_do',
        scheduled_datetime: { $lte: now },
      });

      for (const job of jobs) {
        const claimedJob = await ScheduledJob.findOneAndUpdate(
          { _id: job._id, job_status: 'to_do' },
          { $set: { job_status: 'in_progress' } },
          { new: true },
        );

        if (!claimedJob) continue;

        try {
          await sendScheduledWhatsAppJob({
            phone: claimedJob.job_json.phone,
            message: claimedJob.job_json.message,
            mediaUrl: claimedJob.job_media_url || undefined,
          });

          await PastJob.create({
            ...claimedJob.toObject(),
            job_status: 'delivered',
            delivered_datetime: new Date(),
          });

          await ScheduledJob.findByIdAndDelete(claimedJob._id);
          console.log('✅ Job sent:', claimedJob._id.toString());
        } catch (err: unknown) {
          const errorMessage = getErrorMessage(err);
          await PastJob.create({
            ...claimedJob.toObject(),
            job_status: 'failed',
            error: errorMessage,
            delivered_datetime: new Date(),
          });
          await ScheduledJob.findByIdAndDelete(claimedJob._id);
        }
      }
    } catch (err: unknown) {
      console.error('🔥 Scheduler error:', getErrorMessage(err));
    } finally {
      global.__SCHEDULER_RUNNING__ = false;
    }
  });
}