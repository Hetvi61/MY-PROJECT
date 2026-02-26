
'use client'

import { useEffect, useState } from 'react'

type Client = {
  _id: string
  name: string
  mobiles: string[]
}

type RawClient = {
  _id?: string
  clientName?: string
  ClientName?: string
  mobile?: string | null
  alternateMobile?: string | number | null
  mobileNumbers?: unknown
}

export default function SendTextPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [mobiles, setMobiles] = useState<string[]>([])
  const [mobile, setMobile] = useState('')
  const [message, setMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  // ================= LOAD CLIENTS =================
  useEffect(() => {
    fetch('/api/client')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data?.clients)
          ? data.clients
          : Array.isArray(data)
            ? data
            : []

        const normalized = (list as RawClient[]).map(c => {
          let nums: string[] = []

          if (typeof c.mobile === 'string') {
            nums.push(...c.mobile.split(',').map((m: string) => m.trim()))
          }
          if (c.alternateMobile) nums.push(String(c.alternateMobile))
          if (Array.isArray(c.mobileNumbers)) {
            c.mobileNumbers.forEach((m: unknown) => nums.push(String(m)))
          }

          nums = Array.from(new Set(nums)).filter(Boolean)

          return {
            _id: c._id || '',
            name: c.clientName || c.ClientName || 'Unnamed Client',
            mobiles: nums,
          }
        })

        setClients(normalized)
      })
  }, [])

  // ================= WHATSAPP STATUS =================
  useEffect(() => {
    fetch('/api/whatsapp/status')
      .then(res => res.json())
      .then(d => setConnected(Boolean(d.ready)))
  }, [])

  function handleClientChange(id: string) {
    setClientId(id)
    const c = clients.find(x => x._id === id)
    setMobiles(c?.mobiles || [])
    setMobile(c?.mobiles?.[0] || '')
  }

  async function sendMessage() {
    if (!connected) return alert('WhatsApp not connected')
    if (!clientId || !mobile || !message)
      return alert('All fields required')

    setLoading(true)

    const res = await fetch('/api/whatsapp/send-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: mobile, message }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.success) {
      alert('Message sent')
      setMessage('')
    } else {
      alert(data.error)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Send WhatsApp Text</h1>

      <div className="bg-white p-6 border rounded max-w-3xl">
        {!connected && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
            WhatsApp not connected. Scan QR first.
          </div>
        )}

        {/* CLIENT */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Client</label>
          <select
            className="border p-2 w-full rounded"
            value={clientId}
            onChange={e => handleClientChange(e.target.value)}
          >
            <option value="">Select Client</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* MOBILE */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Mobile Number</label>
          <select
            className="border p-2 w-full rounded"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
          >
            <option value="">Select Mobile</option>
            {mobiles.map((m, i) => (
              <option key={i} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* MESSAGE */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">Message</label>
          <textarea
            className="border p-2 w-full rounded min-h-[120px]"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold"
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  )
}