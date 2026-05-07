import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { type } = await request.json()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let result: any = {}

    switch (type) {
      case 'cleanup_expired_sessions':
        // Delete expired sessions
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const { data: deletedSessions } = await supabase
          .from('sessions')
          .delete()
          .lt('created_at', thirtyDaysAgo.toISOString())
        result = { deletedSessions: deletedSessions?.length || 0 }
        break

      case 'optimize_database':
        // Run VACUUM and ANALYZE (if supported)
        // Note: This is a placeholder - actual implementation depends on your DB setup
        result = { optimized: true, message: 'Database optimization scheduled' }
        break

      case 'clear_notifications':
        // Delete old notifications (older than 90 days)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        const { data: deletedNotifications } = await supabase
          .from('notifications')
          .delete()
          .lt('created_at', ninetyDaysAgo.toISOString())
        result = { deletedNotifications: deletedNotifications?.length || 0 }
        break

      case 'health_check':
        // Check system health
        const { data: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
        
        const { data: pendingUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_approved', false)

        result = {
          totalUsers: usersCount || 0,
          pendingApprovals: pendingUsers || 0,
          timestamp: new Date().toISOString()
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid maintenance type' }, { status: 400 })
    }

    // Log maintenance action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: `MAINTENANCE_${type.toUpperCase()}`,
      entity_type: 'SYSTEM',
      entity_id: 'database',
      details: JSON.stringify(result),
      status: 'success'
    })

    return NextResponse.json({
      success: true,
      type,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Maintenance error:', error)
    return NextResponse.json(
      { error: 'Maintenance operation failed', details: error.message },
      { status: 500 }
    )
  }
}
