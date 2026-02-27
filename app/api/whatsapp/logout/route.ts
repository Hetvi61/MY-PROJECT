import { NextResponse } from 'next/server'
import { logoutWhatsApp } from '@/lib/whatsapp'

export async function POST() {
  try {
    await logoutWhatsApp()
    
    // Wait 500ms to ensure file system is cleared
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return NextResponse.json({ success: true, message: 'Logged out and session deleted' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}