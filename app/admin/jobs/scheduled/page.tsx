'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'

/* ================= IST FORMAT HELPER ================= */
function formatIST(dateString: string) {
  const iso =
    typeof dateString === 'string' && !dateString.endsWith('Z')
      ? dateString + 'Z'
      : dateString

  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
/* ===================================================== */

export default function ScheduledJobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])

  const [form, setForm] = useState<any>({
    job_name: '',
    client_name: '',
    scheduled_datetime: '',
    job_type: 'post',

    // WhatsApp fields
    whatsapp_number: '',
    message_text: '',
  })

  // ✅ NEW: store file only (no upload here)
  const [file, setFile] = useState<File | null>(null)

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    fetch('/api/jobs/scheduled')
      .then(res => res.json())
      .then(data => setJobs(Array.isArray(data) ? data : []))

    fetch('/api/client')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data)
        else if (Array.isArray(data.data)) setClients(data.data)
        else setClients([])
      })
  }, [])

  /* ================= CLIENT CHANGE ================= */
  function onClientChange(clientName: string) {
    const client = clients.find(
      (c: any) => c.clientName === clientName
    )

    setForm((prev: any) => ({
      ...prev,
      client_name: clientName,
      whatsapp_number: client?.mobile || '',
    }))
  }

  /* ================= CREATE JOB ================= */
  async function submit() {
    if (!form.job_name || !form.client_name || !form.scheduled_datetime) {
      alert('Please fill all required fields')
      return
    }

    if (
      form.job_type === 'whatsapp' &&
      (!form.whatsapp_number ||
        (!form.message_text && !file))
    ) {
      alert('WhatsApp number and message or media is required')
      return
    }

    // ✅ SEND EVERYTHING TO ONE ROUTE
    const formData = new FormData()
    formData.append('job_name', form.job_name)
    formData.append('client_name', form.client_name)
    formData.append('job_type', form.job_type)
    formData.append('scheduled_datetime', form.scheduled_datetime)
    formData.append('whatsapp_number', form.whatsapp_number || '')
    formData.append('message_text', form.message_text || '')

    if (file) {
      formData.append('file', file)
    }

    const res = await fetch('/api/jobs/scheduled', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      alert('Job creation failed')
      return
    }

    location.reload()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Scheduled Jobs</h1>

      {/* ================= FORM ================= */}
      <div className="border p-4 mb-6 rounded bg-white">
        <div className="grid grid-cols-2 gap-4">

          <input
            className="border p-2 rounded"
            placeholder="Job Name"
            onChange={e =>
              setForm({ ...form, job_name: e.target.value })
            }
          />

          <select
            className="border p-2 rounded"
            onChange={e => onClientChange(e.target.value)}
          >
            <option value="">Select Client</option>
            {clients.map((c: any) => (
              <option key={c._id} value={c.clientName}>
                {c.clientName}
              </option>
            ))}
          </select>

          <select
            className="border p-2 rounded"
            onChange={e =>
              setForm({ ...form, job_type: e.target.value })
            }
          >
            <option value="post">Post</option>
            <option value="video">Video</option>
            <option value="whatsapp">WhatsApp</option>
          </select>

          <input
            type="datetime-local"
            className="border p-2 rounded"
            onChange={e =>
              setForm({ ...form, scheduled_datetime: e.target.value })
            }
          />

          {/* ========== WHATSAPP FIELDS ========== */}
          {form.job_type === 'whatsapp' && (
            <>
              <input
                className="border p-2 rounded"
                placeholder="WhatsApp Number"
                value={form.whatsapp_number}
                readOnly
              />

              <textarea
                className="border p-2 rounded col-span-2"
                placeholder="Message Text"
                onChange={e =>
                  setForm({ ...form, message_text: e.target.value })
                }
              />

              {/* ✅ FILE PICK ONLY (NO UPLOAD HERE) */}
              <input
                type="file"
                accept="image/*,video/*,application/pdf"
                className="border p-2 rounded col-span-2"
                onChange={e =>
                  setFile(e.target.files?.[0] || null)
                }
              />

              {file && (
                <p className="col-span-2 text-sm text-green-600">
                  File selected: {file.name}
                </p>
              )}
            </>
          )}
          {/* ===================================== */}

        </div>

        <div className="mt-6">
          <button
            onClick={submit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Job
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <table className="w-full border bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Job</th>
            <th className="border p-2">Client</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Scheduled</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(j => (
            <tr key={j._id}>
              <td className="border p-2">{j.job_name}</td>
              <td className="border p-2">{j.client_name}</td>
              <td className="border p-2">{j.job_type}</td>
              <td className="border p-2">
                {formatIST(j.scheduled_datetime)}
              </td>
              <td className="border p-2">{j.job_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
