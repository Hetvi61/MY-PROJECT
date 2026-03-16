'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [openClient, setOpenClient] = useState(false)
  const [openWhatsapp, setOpenWhatsapp] = useState(false)
  const [openTemplates, setOpenTemplates] = useState(false)
  const [openJobs, setOpenJobs] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)

  useEffect(() => {
    if (pathname.startsWith('/admin/client')) {
      setOpenClient(true)
    }

    if (pathname.startsWith('/admin/whatsapp')) {
      setOpenWhatsapp(true)
    }

    if (pathname.startsWith('/admin/templates')) {
      setOpenTemplates(true)
    }

    if (pathname.startsWith('/admin/jobs')) {
      setOpenJobs(true)
    }
  }, [pathname])

  function handleLogout() {
    localStorage.removeItem('admin-auth')
    router.replace('/login')
  }

  return (
    <AuthGuard>
      <div className="min-h-screen">

        {/* ================= SIDEBAR ================= */}
        <aside className="fixed left-0 top-0 w-64 h-screen bg-slate-900 text-white p-4 flex flex-col">

          <div className="flex-1 overflow-y-auto pr-2">
            <h2 className="text-xl font-bold mb-6">Admin Panel</h2>

            <nav className="flex flex-col gap-2">
              <Link
                href="/admin"
                className={`hover:bg-gray-800 px-3 py-2 rounded ${
                  pathname === '/admin' ? 'bg-gray-800' : ''
                }`}
              >
                Dashboard
              </Link>

              <Link
                href="/admin/users"
                className={`hover:bg-gray-800 px-3 py-2 rounded ${
                  pathname === '/admin/users' ? 'bg-gray-800' : ''
                }`}
              >
                Users
              </Link>

              {/* ================= CLIENT ================= */}
              <button
                onClick={() => setOpenClient(!openClient)}
                className="text-left hover:bg-gray-800 px-3 py-2 rounded"
              >
                Client
              </button>

              {openClient && (
                <div className="ml-4 flex flex-col gap-1">
                  <Link href="/admin/client/add" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Add Client</Link>
                  <Link href="/admin/client/list" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Client List</Link>
                  <Link href="/admin/client/address" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Client Address</Link>
                  <Link href="/admin/client/owner" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Client Owner</Link>
                  <Link href="/admin/client/logo" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Client Logo</Link>
                  <Link href="/admin/client/color-palette" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Client Color Palette</Link>
                  <Link href="/admin/client/product" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Client Product</Link>
                  <Link href="/admin/client/product-category" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Client Product Category</Link>
                </div>
              )}

              {/* ================= TEMPLATES ================= */}
              <button
                onClick={() => setOpenTemplates(!openTemplates)}
                className="text-left hover:bg-gray-800 px-3 py-2 rounded"
              >
                Templates
              </button>

              {openTemplates && (
                <div className="ml-4 flex flex-col gap-1">
                  <Link href="/admin/templates/add" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Add</Link>
                  <Link href="/admin/templates/view" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">View</Link>
                </div>
              )}

              <Link
                href="/admin/templates/categories"
                className={`hover:bg-gray-800 px-3 py-2 rounded ${
                  pathname === '/admin/templates/categories' ? 'bg-gray-800' : ''
                }`}
              >
                Template Categories
              </Link>

              {/* ================= JOBS ================= */}
              <button
                onClick={() => setOpenJobs(!openJobs)}
                className="text-left hover:bg-gray-800 px-3 py-2 rounded"
              >
                Jobs
              </button>

              {openJobs && (
                <div className="ml-4 flex flex-col gap-1">
                  <Link href="/admin/jobs/scheduled" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Scheduled Jobs</Link>
                  <Link href="/admin/jobs/past" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Past Jobs</Link>
                </div>
              )}

              {/* ================= FLOW (NEW ADDED) ================= */}
              <Link href="/admin/flow" className="hover:bg-gray-800 px-3 py-2 rounded">
                
              
                Flow Builder
              </Link>

              {/* ================= WHATSAPP ================= */}
              <button
                onClick={() => setOpenWhatsapp(!openWhatsapp)}
                className="text-left hover:bg-gray-800 px-3 py-2 rounded"
              >
                WhatsApp
              </button>

              {openWhatsapp && (
                <div className="ml-4 flex flex-col gap-1">
                  <Link href="/admin/whatsapp/auth" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Auth</Link>
                  <Link href="/admin/whatsapp/send-text" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Send Text</Link>
                  <Link href="/admin/whatsapp/send-media" className="hover:bg-gray-800 px-3 py-1 rounded text-sm">Send Media</Link>
                </div>
              )}

              <Link href="/admin/business-category" className="hover:bg-gray-800 px-3 py-2 rounded">Business Categories</Link>
              <Link href="/admin/client-group" className="hover:bg-gray-800 px-3 py-2 rounded">Client Group</Link>
              <Link href="/profile" className="hover:bg-gray-800 px-3 py-2 rounded">Profile</Link>
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white py-2 rounded mt-4"
          >
            Logout
          </button>
        </aside>

        <main className="ml-64 mt-14 p-6 bg-gray-100 min-h-screen">
          {children}
        </main>

      </div>
    </AuthGuard>
  )
}