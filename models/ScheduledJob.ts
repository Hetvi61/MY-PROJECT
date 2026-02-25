import mongoose, { Schema, models } from 'mongoose'

const ScheduledJobSchema = new Schema({
  // ✅ CLIENT NAME
  client_name: {
    type: String,
    required: true,
  },

  job_name: {
    type: String,
    required: true,
  },

  // ✅ EXTENDED JOB TYPES (post, video, whatsapp)
  job_type: {
    type: String,
    enum: ['post', 'video', 'whatsapp'],
    required: true,
  },

  // ================= EXISTING FIELDS =================
  job_json: {
    type: Schema.Types.Mixed,
  },

  job_media_url: {
    type: String,
  },

  // ================= WHATSAPP FIELDS (NEW) =================
  whatsapp_number: {
    type: String, // example: 91XXXXXXXXXX
  },

  message_text: {
    type: String,
  },
  // ===================================================

  job_status: {
    type: String,
    enum: ['to_do', 'in_progress'],
    default: 'to_do',
  },

  created_datetime: {
    type: Date,
    required: true,
  },

  scheduled_datetime: {
    type: Date,
    required: true,
  },
  created_from: {
    type: String,
    enum: ["ui", "api"],
    default: "ui"
  },
})

export default models.ScheduledJob ||
  mongoose.model('ScheduledJob', ScheduledJobSchema)
