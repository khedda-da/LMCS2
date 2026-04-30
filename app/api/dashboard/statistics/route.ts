import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Create admin client using service role key to bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {},
        },
      }
    )

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get active supervisions count
    const { count: activeSuperVisions } = await supabase
      .from('supervisions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get completed supervisions count
    const { count: completedSupervisions } = await supabase
      .from('supervisions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Get students count
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    // Get pending approvals count
    const { count: pendingApprovals } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_approved', false)

    // Get supervision types distribution
    const { data: supervisionTypes } = await supabase
      .from('supervisions')
      .select('type, count:id', { count: 'exact' })
      .then(({ data, error }) => {
        if (error) return { data: [] }
        // Group by type
        const grouped: Record<string, number> = {}
        data?.forEach((item: any) => {
          grouped[item.type] = (grouped[item.type] || 0) + 1
        })
        return { data: Object.entries(grouped).map(([type, count]) => ({ type, count })) }
      })

    // Get academic year distribution
    const { data: academicYears } = await supabase
      .from('supervisions')
      .select('academic_year')
      .then(({ data, error }) => {
        if (error) return { data: [] }
        // Group by academic year
        const grouped: Record<string, number> = {}
        data?.forEach((item: any) => {
          grouped[item.academic_year] = (grouped[item.academic_year] || 0) + 1
        })
        return { data: Object.entries(grouped).map(([year, count]) => ({ year, count })) }
      })

    // Get user roles distribution
    const { data: userRoles } = await supabase
      .from('users')
      .select('role')
      .then(({ data, error }) => {
        if (error) return { data: [] }
        // Group by role
        const grouped: Record<string, number> = {}
        data?.forEach((item: any) => {
          if (item.role) {
            grouped[item.role] = (grouped[item.role] || 0) + 1
          }
        })
        return { data: Object.entries(grouped).map(([role, count]) => ({ role, count })) }
      })

    // Get sessions scheduled vs completed
    const { data: sessions } = await supabase
      .from('sessions')
      .select('status')
      .then(({ data, error }) => {
        if (error) return { data: [] }
        // Group by status
        const grouped: Record<string, number> = {}
        data?.forEach((item: any) => {
          grouped[item.status] = (grouped[item.status] || 0) + 1
        })
        return { data: Object.entries(grouped).map(([status, count]) => ({ status, count })) }
      })

    return NextResponse.json({
      summary: {
        totalUsers: totalUsers || 0,
        activeSuperVisions: activeSuperVisions || 0,
        completedSupervisions: completedSupervisions || 0,
        totalStudents: totalStudents || 0,
        pendingApprovals: pendingApprovals || 0,
      },
      charts: {
        supervisionTypes: supervisionTypes || [],
        academicYears: academicYears || [],
        userRoles: userRoles || [],
        sessionStatus: sessions || [],
      },
    })
  } catch (error) {
    console.error('[v0] Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
