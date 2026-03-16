'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { useRouter } from 'next/navigation'

export default function ClientListPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function loadClients() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/client')
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to load clients')
        return
      }

      setClients(data)
    } catch {
      setError('Network error loading clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  async function deleteClient(id: string) {
    if (!confirm('Delete this client?')) return

    const res = await fetch('/api/client', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (!res.ok) {
      alert('Failed to delete client')
      return
    }

    loadClients()
  }

  return (
    <AuthGuard>
      <div className="w-full bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-6">Client List</h1>

        {loading && (
          <div className="text-center py-10 text-gray-500">
            Loading clients...
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-[1400px] border text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-3">Client ID</th>
                  <th className="border px-4 py-3">Client Name</th>
                  <th className="border px-4 py-3">Email</th>
                  <th className="border px-4 py-3">Mobile</th>
                  <th className="border px-4 py-3">Phone</th>
                  <th className="border px-4 py-3">Business Category</th>
                  <th className="border px-4 py-3">Client Group</th>
                  <th className="border px-4 py-3">Website</th>
                  <th className="border px-4 py-3">Services</th>
                  <th className="border px-4 py-3">Product Details</th>
                  <th className="border px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center p-6">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="border px-4 py-3 text-center">
                        {c.clientId || '-'}
                      </td>

                      <td className="border px-4 py-3">
                        {c.clientName ||
                          c.ClientName ||
                          c.companyName ||
                          '-'}
                      </td>

                      <td className="border px-4 py-3">
                        {c.email || '-'}
                      </td>

                      <td className="border px-4 py-3">
                        {c.mobile || '-'}
                      </td>

                      <td className="border px-4 py-3">
                        {c.phone || '-'}
                      </td>

                      <td className="border px-4 py-3">
                        {c.businessCategory || '-'}
                      </td>

                      <td className="border px-4 py-3">
                        {c.clientGroup || '-'}
                      </td>

                      <td className="border px-4 py-3">
                        {c.website ? (
                          <a
                            href={
                              c.website.startsWith('http')
                                ? c.website
                                : `https://${c.website}`
                            }
                            target="_blank"
                            className="text-blue-600 underline"
                          >
                            {c.website}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="border px-4 py-3">
                        {c.services || '-'}
                      </td>

                      <td className="border px-4 py-3">
                        {c.productDetails || '-'}
                      </td>

                      <td className="border px-4 py-3 text-center flex gap-2 justify-center">

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() =>
                            router.push(`/admin/client/edit/${c._id}`)
                          }
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => deleteClient(c._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>

                        {/* NEW BUTTON */}
                        <button
                          onClick={() =>
                            router.push(`/admin/flow?clientId=${c._id}`)
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Start Automation
                        </button>

                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
