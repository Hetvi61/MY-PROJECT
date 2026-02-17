import mongoose, { Schema, models } from 'mongoose'

const PastJobSchema = new Schema(
  {
    // ✅ CLIENT NAME ONLY (NO CLIENT ID)
    client_name: {
      type: String,
      required: true,
      trim: true,
    },

    job_name: {
      type: String,
      required: true,
      trim: true,
    },

    job_type: {
      type: String,
      enum: ['post', 'video','whatsapp'],
      required: true,
    },

    // ✅ OPTIONAL, SAFE DEFAULT
    job_json: {
      type: Schema.Types.Mixed,
      default: {},          // 🔧 IMPORTANT FIX
    },

    // ✅ OPTIONAL, SAFE DEFAULT
    job_media_url: {
      type: String,
      default: null,        // 🔧 IMPORTANT FIX
    },

    job_status: {
      type: String,
      enum: ['delivered', 'failed'],
      required: true,
    },

    created_datetime: {
      type: Date,
      required: true,
    },

    delivered_datetime: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,       // 🧠 helpful for debugging
    strict: true,
  }
)

export default models.PastJob ||
  mongoose.model('PastJob', PastJobSchema)
