'use client'

import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'

export default function WhatsAppAuthPage() {
  const [qr, setQr] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)

  // ✅ STATUS LOADER FUNCTION
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

  // ✅ START WHATSAPP ONCE + POLL STATUS
  useEffect(() => {
    // 🔥 Start WhatsApp (IMPORTANT)
    fetch('/api/whatsapp/auth')

    loadStatus()
    const interval = setInterval(loadStatus, 3000)

    return () => clearInterval(interval)
  }, [])

  // ✅ LOGOUT (FIXED)
  async function logout() {
    setLoading(true)
    setReady(false)  // ✅ ADD THIS - Clear ready state immediately
    setQr(null)
    try {
      const response = await fetch('/api/whatsapp/logout', { method: 'POST' })
      const data = await response.json()

      if (!data.success) {
        console.error('Logout failed:', data)
        setLoading(false)
        return
      }

      // Wait 1 second for session deletion
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Start fresh
      await fetch('/api/whatsapp/auth')

      // Wait 2 seconds for QR to generate
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Load status
      await loadStatus()

      console.log('✅ Logout complete, QR should appear')
    } catch (error) {
      console.error('Logout failed:', error)
      setLoading(false)
    }
  }
      return (
        <div className="p-6">
          <h1 className="text-xl font-bold mb-4">
            WhatsApp Authentication
          </h1>

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
              <div>
                {loading ? 'Loading…' : 'Waiting for QR…'}
              </div>
            )}
          </div>
        </div>
      )
    }