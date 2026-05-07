'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Check, Trash2, CheckSquare, Trash } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

export function NotificationBell({ userId, language = 'en' }: { userId: string; language?: 'en' | 'fr' }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          loadNotifications()
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          // Reload to sync state with database
          setTimeout(() => loadNotifications(), 100)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, supabase])

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading notifications:', error)
        return
      }

      setNotifications(data || [])
      const unread = (data || []).filter(n => !n.read).length
      setUnreadCount(unread)
      setLoading(false)
    } catch (err) {
      console.error('Error in loadNotifications:', err)
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const deleted = notifications.find(n => n.id === notificationId)
      
      // Call API to delete the notification
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteNotification: notificationId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete notification')
      }

      // Remove from local state immediately
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const deleted = notifications.find(n => n.id === notificationId)
      
      // Call API to delete the notification
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteNotification: notificationId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete notification')
      }

      // Remove from local state immediately
      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      // Update unread count if necessary
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Delete all unread notifications
      const unreadNotifications = notifications.filter(n => !n.read)

      if (unreadNotifications.length === 0) return

      // Call API to delete all unread notifications
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete notifications')
      }

      // Remove all unread notifications from state
      setNotifications(prev => prev.filter(n => n.read))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const deleteAllNotifications = async () => {
    try {
      // Call API to delete all notifications
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete notifications')
      }

      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error('Error deleting all notifications:', err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return '✓'
      case 'rejection': return '✗'
      case 'update': return '⚡'
      case 'message': return '💬'
      case 'success': return '✓'
      case 'warning': return '⚠'
      case 'error': return '✗'
      default: return 'ℹ'
    }
  }

  const locale = language === 'fr' ? fr : enUS

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span>{language === 'fr' ? 'Notifications' : 'Notifications'}</span>
          <span className="text-xs text-muted-foreground font-normal">
            {unreadCount > 0 && `${unreadCount} ${language === 'fr' ? 'non lues' : 'unread'}`}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              {language === 'fr' ? 'Chargement...' : 'Loading...'}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {language === 'fr' ? 'Aucune notification' : 'No notifications'}
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b last:border-0 transition-colors ${
                    notification.read
                      ? 'bg-background hover:bg-muted/50'
                      : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-2">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1.5"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 ml-7">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => markAsRead(notification.id)}
                        title={language === 'fr' ? 'Marquer comme lu' : 'Mark as read'}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {language === 'fr' ? 'Lire' : 'Read'}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => deleteNotification(notification.id)}
                      title={language === 'fr' ? 'Supprimer' : 'Delete'}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {language === 'fr' ? 'Supprimer' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckSquare className="w-3 h-3 mr-1" />
                {language === 'fr' ? 'Tout lire' : 'Mark All Read'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={deleteAllNotifications}
              >
                <Trash className="w-3 h-3 mr-1" />
                {language === 'fr' ? 'Supprimer tout' : 'Delete All'}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
