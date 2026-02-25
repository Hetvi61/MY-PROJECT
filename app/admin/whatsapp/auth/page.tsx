'use client'

import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'

export default function WhatsAppAuthPage() {
  const [qr, setQr] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)

  // ✅ STEP 1: START WHATSAPP ONCE
  useEffect(() => {
    fetch('/api/whatsapp/init').catch(console.error)
  }, [])

  // ✅ STEP 2: ONLY CHECK STATUS
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status')
        const data = await res.json()
        setQr(data.qr)
        setReady(data.ready)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    loadStatus()
    const interval = setInterval(loadStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  async function logout() {
    await fetch('/api/whatsapp/logout', { method: 'POST' })
    setQr(null)
    setReady(false)
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        WhatsApp Authentication
      </h1>

      <div className="bg-white p-6 border rounded max-w-3xl">
        {ready && (
          <>
            <div className="bg-green-100 text-green-800 px-4 py-3 rounded mb-4 font-medium">
              WhatsApp Connected Successfully
            </div>

            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-semibold"
            >
              Logout WhatsApp
            </button>
          </>
        )}

        {!ready && qr && (
          <>
            <p className="mb-3 text-gray-700 font-medium">
              Scan this QR code using WhatsApp mobile app
            </p>

            <div className="inline-block bg-white border p-4 rounded mb-4">
              <QRCode value={qr} size={240} />
            </div>

            <p className="text-sm text-gray-500 mb-4">
              WhatsApp → Settings → Linked Devices → Link a device
            </p>
          </>
        )}

        {!ready && !qr && (
          <div className="text-gray-500">
            {loading ? 'Loading WhatsApp status…' : 'Waiting for QR code…'}
          </div>
        )}
      </div>
    </div>
  )
}