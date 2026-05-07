import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createNotificationsForUsers } from '@/lib/real-notifications'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all directors
    const { data: directors } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'director')

    if (!directors || directors.length === 0) {
      return NextResponse.json({ notified: 0 })
    }

    // Get all supervisions with recent activity
    const { data: supervisions } = await supabase
      .from('supervisions')
      .select('id, title, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50)

    if (!supervisions || supervisions.length === 0) {
      return NextResponse.json({ notified: 0 })
    }

    // Get supervision statistics for directors
    const { data: stats } = await supabase
      .from('supervisions')
      .select('status, count(*)', { count: 'exact' })
      .group_by('status')

    // Create notifications for directors about supervisions
    const directorIds = directors.map(d => d.id)
    
    if (directorIds.length > 0 && supervisions.length > 0) {
      // Get high priority items (pending or suspended)
      const { data: criticalItems } = await supabase
        .from('supervisions')
        .select('id, title, status')
        .in('status', ['pending', 'suspended', 'on_hold'])
        .limit(5)

      const criticalCount = criticalItems?.length || 0
      
      const message = criticalCount > 0 
        ? `${criticalCount} supervision(s) need attention: ${criticalItems?.map(s => s.title).join(', ')}`
        : `All supervisions are on track. ${supervisions.length} active supervision(s)`

      const notificationType = criticalCount > 0 ? 'warning' : 'info'

      await createNotificationsForUsers(
        directorIds,
        criticalCount > 0 ? 'Supervision Alert' : 'Supervision Status Update',
        message,
        notificationType,
        '/dashboard/director'
      )
    }

    return NextResponse.json({
      notified: directorIds.length,
      count: supervisions.length,
      criticalCount: supervisions.filter((s: any) => ['pending', 'suspended', 'on_hold'].includes(s.status)).length
    })
  } catch (error) {
    console.error('[v0] Director supervisions notification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
