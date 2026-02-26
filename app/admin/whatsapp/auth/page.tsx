'use client'

import { useEffect, useRef, useState } from 'react' // 🔴 useRef added
import QRCode from 'react-qr-code'

export default function WhatsAppAuthPage() {
  const [qr, setQr] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)

  // 🔴 ADDED: prevents repeated init calls
  const initCalledRef = useRef(false)

  useEffect(() => {
    const loadStatusAndInit = async () => {
      try {
        const res = await fetch('/api/whatsapp/status')
        const data = await res.json()

        setQr(data.qr)
        setReady(data.ready)
        setLoading(false)

        // 🔥 FIX: init ONLY ONCE
        if (!data.ready && !data.qr && !initCalledRef.current) {
          initCalledRef.current = true
          await fetch('/api/whatsapp/auth')
        }
      } catch (e) {
        console.error(e)
      }
    }

    loadStatusAndInit()
    const interval = setInterval(loadStatusAndInit, 3000)
    return () => clearInterval(interval)
  }, [])

  async function logout() {
    await fetch('/api/whatsapp/logout', { method: 'POST' })
    setQr(null)
    setReady(false)
    setLoading(true)

    // 🔴 RESET init flag so QR can appear again
    initCalledRef.current = false
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">WhatsApp Authentication</h1>

      <div className="bg-white p-6 border rounded max-w-3xl">
        {ready && (
          <>
            <div className="bg-green-100 text-green-800 px-4 py-3 rounded mb-4">
              WhatsApp Connected Successfully
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-6 py-3 rounded"
            >
              Logout WhatsApp
            </button>
          </>
        )}

        {!ready && qr && (
          <>
            <p className="mb-3">Scan QR code</p>
            <QRCode value={qr} size={240} />
          </>
        )}

        {!ready && !qr && (
          <div>{loading ? 'Loading…' : 'Waiting for QR…'}</div>
        )}
      </div>
    </div>
  )
}