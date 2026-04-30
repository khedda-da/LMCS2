import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const role = searchParams.get('role')

  if (!userId || !role) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    // Get role-specific statistics
    let stats: Record<string, any> = {}

    switch (role) {
      case 'supervisor':
        // Get supervisor statistics
        const { data: supervisionData } = await supabase
          .from('supervisions')
          .select('id, status')
          .eq('supervisor_id', userId)

        stats = {
          active_supervisions: supervisionData?.filter(s => s.status === 'active').length || 0,
          completed_supervisions: supervisionData?.filter(s => s.status === 'completed').length || 0,
          total_supervisions: supervisionData?.length || 0,
        }
        break

      case 'student':
        // Get student statistics
        const { data: studentSupervisions } = await supabase
          .from('students')
          .select('supervisions:supervision_id(*)')
          .eq('user_id', userId)

        stats = {
          active_supervisions: 0,
          completed_supervisions: 0,
          total_supervisions: studentSupervisions?.length || 0,
        }
        break

      case 'director':
        // Get director statistics
        const { data: allSupervisions } = await supabase
          .from('supervisions')
          .select('id, status')

        stats = {
          total_supervisions: allSupervisions?.length || 0,
          active_supervisions: allSupervisions?.filter(s => s.status === 'active').length || 0,
          completed_supervisions: allSupervisions?.filter(s => s.status === 'completed').length || 0,
        }
        break

      case 'admin':
        // Get admin statistics
        const { data: users } = await supabase
          .from('users')
          .select('id')

        stats = {
          total_users: users?.length || 0,
          approved_users: users?.filter((u: any) => u.is_approved).length || 0,
          pending_users: users?.filter((u: any) => !u.is_approved).length || 0,
        }
        break

      default:
        stats = {}
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[v0] Error fetching role statistics:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
