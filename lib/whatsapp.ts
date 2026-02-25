import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js"

let client: Client | null = null
let qrCode: string | null = null
let isReady = false
let isInitializing = false

// ================= INIT =================
export function initWhatsApp() {
  if (client && isReady) return
  if (isInitializing) return
  isInitializing = true

  if (!client) {
    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: "whatsapp-session",
      }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    })

    client.on("qr", (qr) => {
      qrCode = qr
      isReady = false
    })

    client.on("ready", () => {
      isReady = true
      qrCode = null
      isInitializing = false
      console.log("✅ WhatsApp READY")
    })

    client.on("auth_failure", () => {
      console.log("❌ WhatsApp AUTH FAILURE")
      isReady = false
      qrCode = null
      isInitializing = false
    })

    client.on("disconnected", () => {
      console.log("❌ WhatsApp DISCONNECTED")
      isReady = false
      qrCode = null
    })

    client.initialize()
  } else {
    isInitializing = false
  }
}

// ================= STATUS =================
export function getWhatsAppStatus() {
  return {
    ready: isReady,
    qr: qrCode,
  }
}

// ================= SEND MESSAGE =================
export async function sendWhatsAppMessage(
  phone: string,
  content: string | MessageMedia,
  caption?: string
) {
  if (!client || !isReady) {
    throw new Error("WhatsApp not connected")
  }

  const numberId = await client.getNumberId(phone)
  const chatId = numberId?._serialized || `${phone}@c.us`

  if (typeof content === "string") {
    await client.sendMessage(chatId, content)
  } else {
    await client.sendMessage(chatId, content, { caption })
  }
}

// ================= SCHEDULER WRAPPER =================
export async function sendScheduledWhatsAppJob(params: {
  phone: string
  message?: string
  mediaUrl?: string
}) {
  if (!client || !isReady) {
    throw new Error("WhatsApp not ready")
  }

  const { phone, message, mediaUrl } = params

  if (mediaUrl) {
    const media = await MessageMedia.fromUrl(mediaUrl)
    await sendWhatsAppMessage(phone, media, message)
  } else if (message) {
    await sendWhatsAppMessage(phone, message)
  }
}

// ================= LOGOUT =================
export async function logoutWhatsApp() {
  if (client) {
    await client.destroy()
    client = null
    qrCode = null
    isReady = false
    isInitializing = false
    console.log("🔒 WhatsApp LOGGED OUT")
  }
}