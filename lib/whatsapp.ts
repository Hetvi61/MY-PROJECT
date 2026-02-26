import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js"

type WhatsAppState = {
  client: Client | null
  qrCode: string | null
  isReady: boolean
  isInitializing: boolean
  sendQueue: Promise<unknown>
  queueDepth: number
}

declare global {
  var __WHATSAPP_STATE__: WhatsAppState | undefined
}

const state: WhatsAppState = global.__WHATSAPP_STATE__ ?? {
  client: null,
  qrCode: null,
  isReady: false,
  isInitializing: false,
  sendQueue: Promise.resolve(),
  queueDepth: 0,
}

global.__WHATSAPP_STATE__ = state

function runWithSendLock<T>(task: () => Promise<T>): Promise<T> {
  state.queueDepth += 1

  const run = state.sendQueue.then(task, task)

  state.sendQueue = run
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      state.queueDepth = Math.max(0, state.queueDepth - 1)
    })

  return run
}

// ================= INIT =================
export function initWhatsApp() {
  if (state.client && state.isReady) return
  if (state.isInitializing) return
  state.isInitializing = true

  if (!state.client) {
    const nextClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: "whatsapp-session",
      }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    })

    nextClient.on("qr", (qr) => {
      state.qrCode = qr
      state.isReady = false
    })

    nextClient.on("ready", () => {
      state.isReady = true
      state.qrCode = null
      state.isInitializing = false
      console.log("✅ WhatsApp READY")
    })

    nextClient.on("auth_failure", () => {
      console.log("❌ WhatsApp AUTH FAILURE")
      state.isReady = false
      state.qrCode = null
      state.isInitializing = false
    })

    nextClient.on("disconnected", () => {
      console.log("❌ WhatsApp DISCONNECTED")
      state.isReady = false
      state.qrCode = null
      state.isInitializing = false
    })

    state.client = nextClient
    nextClient.initialize()
  } else {
    state.isInitializing = false
  }
}

// ================= STATUS =================
export function getWhatsAppStatus() {
  return {
    ready: state.isReady,
    qr: state.qrCode,
    sending: state.queueDepth > 0,
    queueDepth: state.queueDepth,
  }
}

// ================= SEND MESSAGE =================
export async function sendWhatsAppMessage(
  phone: string,
  content: string | MessageMedia,
  caption?: string
) {
  return runWithSendLock(async () => {
    if (!state.client || !state.isReady) {
      throw new Error("WhatsApp not connected")
    }

    const numberId = await state.client.getNumberId(phone)
    const chatId = numberId?._serialized || `${phone}@c.us`

    if (typeof content === "string") {
      await state.client.sendMessage(chatId, content)
      return
    }

    await state.client.sendMessage(chatId, content, { caption })
  })
}

// ================= SCHEDULER WRAPPER =================
export async function sendScheduledWhatsAppJob(params: {
  phone: string
  message?: string
  mediaUrl?: string
}) {
  if (!state.client || !state.isReady) {
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
  if (state.client) {
    await state.client.destroy()
    state.client = null
    state.qrCode = null
    state.isReady = false
    state.isInitializing = false
    console.log("🔒 WhatsApp LOGGED OUT")
  }
}
