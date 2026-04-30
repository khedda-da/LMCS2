'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main login page
    router.push('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Redirecting...</h1>
        <p className="text-slate-600 mt-2">Please wait while we redirect you to the login page.</p>
      </div>
    </div>
  )
}
