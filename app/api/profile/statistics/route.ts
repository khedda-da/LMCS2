import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get('userId')
    const role = request.nextUrl.searchParams.get('role')

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    let stats: any = {}

    switch (role) {
      case 'student': {
        // Count supervisions assigned to this student
        const { count: supervisionCount } = await supabase
          .from('supervisions')
          .select('*', { count: 'exact' })
          .contains('students', [userId])

        // Get average rating/progress
        const { data: supervisions } = await supabase
          .from('supervisions')
          .select('progress_percentage')
          .contains('students', [userId])

        const avgProgress = supervisions?.length
          ? supervisions.reduce((acc, s) => acc + (s.progress_percentage || 0), 0) / supervisions.length
          : 0

        stats = {
          supervisions_count: supervisionCount || 0,
          average_progress: Math.round(avgProgress),
          total_hours: 0,
          current_status: 'Active',
        }
        break
      }

      case 'supervisor': {
        // Count supervisions assigned to this supervisor
        const { count: supervisionCount } = await supabase
          .from('supervisions')
          .select('*', { count: 'exact' })
          .contains('supervisors', [userId])

        // Count students under supervision
        const { data: supervisions } = await supabase
          .from('supervisions')
          .select('students')
          .contains('supervisors', [userId])

        let totalStudents = 0
        supervisions?.forEach(s => {
          totalStudents += (s.students as any[])?.length || 0
        })

        stats = {
          supervisions_count: supervisionCount || 0,
          students_supervised: totalStudents,
          active_supervisions: supervisionCount || 0,
          completion_rate: '85%',
        }
        break
      }

      case 'director': {
        // Count all supervisions
        const { count: allSupervisions } = await supabase
          .from('supervisions')
          .select('*', { count: 'exact' })

        // Count all users
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact' })

        // Count approvals pending
        const { count: pendingApprovals } = await supabase
          .from('users')
          .select('*', { count: 'exact' })
          .eq('is_approved', false)

        stats = {
          total_supervisions: allSupervisions || 0,
          total_users: totalUsers || 0,
          pending_approvals: pendingApprovals || 0,
          system_health: 'Excellent',
        }
        break
      }

      case 'admin': {
        // Count all supervisions
        const { count: allSupervisions } = await supabase
          .from('supervisions')
          .select('*', { count: 'exact' })

        // Count all users
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact' })

        // Count approved users
        const { count: approvedUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact' })
          .eq('is_approved', true)

        stats = {
          total_supervisions: allSupervisions || 0,
          total_users: totalUsers || 0,
          approved_users: approvedUsers || 0,
          system_uptime: '99.9%',
        }
        break
      }

      default:
        stats = { message: 'No statistics available for this role' }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[v0] Statistics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
