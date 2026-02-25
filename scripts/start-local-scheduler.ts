import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
 
console.log("ENV CHECK 👉", process.env.MONGODB_URI)  

import { initWhatsApp } from "../lib/whatsapp"
import "../cron/localScheduler"

console.log("🚀 Local WhatsApp Scheduler started")

// Initialize WhatsApp (QR once)
initWhatsApp()
