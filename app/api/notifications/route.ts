import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('[v0] Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({ 
      notifications: notifications || [],
      unreadCount: unreadCount || 0
    })
  } catch (error) {
    console.error('[v0] Error in notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId, deleteAll, deleteNotification } = body

    if (deleteAll) {
      // Delete all unread notifications
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('[v0] Error deleting all notifications:', error)
        return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'All notifications deleted' })
    }

    if (deleteNotification || notificationId) {
      // Delete single notification
      const idToDelete = deleteNotification || notificationId
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', idToDelete)
        .eq('user_id', user.id)

      if (error) {
        console.error('[v0] Error deleting notification:', error)
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Error in notifications PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


