import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user info
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('id', user.id)
      .single()

    // Get user's notifications
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (notifError) {
      return NextResponse.json({ error: notifError.message }, { status: 500 })
    }

    // Get all notifications for debugging
    const { data: allNotifications } = await supabase
      .from('notifications')
      .select('id, user_id, title, message, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    // Get all users and their roles
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, email, role')

    return NextResponse.json({
      currentUser,
      userNotifications: {
        count: notifications?.length || 0,
        unreadCount: notifications?.filter((n: any) => !n.read).length || 0,
        notifications: notifications || []
      },
      allNotificationsCount: allNotifications?.length || 0,
      allNotifications: allNotifications || [],
      allUsers: allUsers || [],
      message: 'Debug info retrieved successfully'
    })
  } catch (error) {
    console.error('[v0] Debug error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
