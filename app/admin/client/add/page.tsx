'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'

/* ================= BUILD TREE OPTIONS ================= */
function buildOptions(items: any[]) {
  const map: any = {}
  const result: any[] = []

  items.forEach((item) => {
    const parentId = item.parent?._id || 'root'
    if (!map[parentId]) map[parentId] = []
    map[parentId].push(item)
  })

  function walk(parentId: string, prefix = '') {
    ; (map[parentId] || []).forEach((item: any) => {
      result.push({
        _id: item._id,
        label: `${prefix}${item.name}`,
      })
      walk(item._id, `${prefix}— `)
    })
  }

  walk('root')
  return result
}

export default function AddClientPage() {
  const router = useRouter()

  const [form, setForm] = useState<any>({})
  const [categories, setCategories] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])

  /* ================= FETCH MASTER DATA ================= */
  useEffect(() => {
    fetch('/api/business-category')
      .then((r) => r.json())
      .then(setCategories)

    fetch('/api/client-group')
      .then((r) => r.json())
      .then(setGroups)
  }, [])

  const categoryOptions = buildOptions(categories)
  const groupOptions = buildOptions(groups)

  /* ================= HANDLE CHANGE ================= */
  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  /* ================= SAVE CLIENT ================= */
  async function saveClient() {
    const res = await fetch('/api/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    let data

    try {
      data = await res.json()
    } catch {
      alert('Server returned invalid response')
      return
    }

    if (!res.ok) {
      alert(data.error || 'Failed to save client')
      return
    }


    router.push('/admin/client/list')
  }

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-6">Add New Client</h1>

        <div className="grid grid-cols-2 gap-6">

          {/* CLIENT NAME */}
          <div>
            <label className="block mb-1 font-medium">Client Name</label>
            <input
              name="clientName"
              className="border p-2 w-full"
              onChange={handleChange}
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              name="email"
              type="email"
              className="border p-2 w-full"
              onChange={handleChange}
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="block mb-1 font-medium">Phone</label>
            <input
              name="phone"
              className="border p-2 w-full"
              onChange={handleChange}
            />
          </div>

          {/* MOBILE */}
          <div>
            <label className="block mb-1 font-medium">Mobile</label>
            <input
              name="mobile"
              className="border p-2 w-full"
              onChange={handleChange}
            />
          </div>

          {/* BUSINESS CATEGORY */}
          <div>
            <label className="block mb-1 font-medium">
              Business Category
            </label>
            <select
              name="businessCategory"
              className="border p-2 w-full"
              onChange={handleChange}
            >
              <option value="">Select Category</option>
              {categoryOptions.map((g) => (
                <option key={g._id} value={g.label}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* CLIENT GROUP */}
          <div>
            <label className="block mb-1 font-medium">Client Group</label>
            <select
              name="clientGroup"
              className="border p-2 w-full"
              onChange={handleChange}
            >
              <option value="">Select Group</option>
              {groupOptions.map((g) => (
                <option key={g._id} value={g.label}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* TARGET AUDIENCE */}
          <div>
            <label className="block mb-1 font-medium">Target Audience</label>
            <input
              name="targetAudience"
              className="border p-2 w-full"
              onChange={handleChange}
            />
          </div>

          {/* WEBSITE */}
          <div>
            <label className="block mb-1 font-medium">Website</label>
            <input
              name="website"
              className="border p-2 w-full"
              onChange={handleChange}
            />
          </div>

          {/* SERVICES */}
          <div>
            <label className="block mb-1 font-medium">
              Services / Product
            </label>
            <input
              name="services"
              className="border p-2 w-full"
              onChange={handleChange}
            />
          </div>

          {/* DEMOGRAPHICS */}
          <div>
            <label className="block mb-1 font-medium">Demographics</label>
            <input
              name="demographics"
              className="border p-2 w-full"
              onChange={handleChange}
            />
          </div>

          {/* PRODUCT DETAILS */}
          <div className="col-span-2">
            <label className="block mb-1 font-medium">
              Product Details
            </label>
            <textarea
              name="productDetails"
              rows={3}
              className="border p-2 w-full"
              onChange={handleChange}
            />
          </div>
        </div>

        <button
          onClick={saveClient}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Save Client
        </button>
      </div>
    </AuthGuard>
  )
}
