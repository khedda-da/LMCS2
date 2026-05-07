import { createServerClient } from '@supabase/ssr'

export interface NotificationInput {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  link?: string
  relatedEntityType?: string
  relatedEntityId?: string
}

/**
 * Get a Supabase client with service role for notifications
 */
function getServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}

/**
 * Create a notification for a specific user
 */
export async function createNotification(input: NotificationInput) {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || 'info',
        link: input.link,
        related_entity_type: input.relatedEntityType,
        related_entity_id: input.relatedEntityId,
        read: false,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('[v0] Notification creation error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Failed to create notification:', error)
    return false
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationsForUsers(
  userIds: string[],
  title: string,
  message: string,
  type?: 'info' | 'success' | 'warning' | 'error',
  link?: string,
  relatedEntityType?: string,
  relatedEntityId?: string
) {
  try {
    const supabase = getServiceClient()

    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type: type || 'info',
      link,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      read: false,
      created_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('notifications')
      .insert(notifications)

    if (error) {
      console.error('[v0] Bulk notification error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Failed to create bulk notifications:', error)
    return false
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, unreadOnly: boolean = false) {
  try {
    const supabase = getServiceClient()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[v0] Error fetching notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[v0] Failed to fetch notifications:', error)
    return []
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('[v0] Error marking notification as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Failed to mark notification as read:', error)
    return false
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('[v0] Error marking all notifications as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Failed to mark all notifications as read:', error)
    return false
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('[v0] Error deleting notification:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Failed to delete notification:', error)
    return false
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string) {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('[v0] Error deleting all notifications:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Failed to delete all notifications:', error)
    return false
  }
}

/**
 * Delete all unread notifications for a user (mark all as read by deleting)
 */
export async function deleteAllUnreadNotifications(userId: string) {
  try {
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('[v0] Error deleting unread notifications:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Failed to delete unread notifications:', error)
    return false
  }
}
