'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const routeToRoleDashboard = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, is_approved')
          .eq('id', user.id)
          .single()

        if (userError || !userData) {
          router.push('/auth/login')
          return
        }

        if (!userData.is_approved) {
          router.push('/auth/pending-approval')
          return
        }

        switch (userData.role) {
          case 'admin':
            router.push('/dashboard/admin')
            break
          case 'supervisor':
            router.push('/dashboard/supervisor')
            break
          case 'director':
            router.push('/dashboard/director')
            break
          default:
            router.push('/auth/login')
        }
      } catch (error) {
        console.error('Error routing to dashboard:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    routeToRoleDashboard()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}
