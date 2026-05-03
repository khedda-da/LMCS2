'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, Check, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

interface Notification {
  id: string
  user_id: string | null
  target_role?: string | null // Ajouté pour gérer les rôles
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

// 1. Ajout de `userRole` dans les props
export function NotificationBell({ 
  userId, 
  userRole = 'researcher', 
  language = 'en' 
}: { 
  userId: string; 
  userRole?: string; // 'admin', 'director', ou 'researcher'
  language?: 'en' | 'fr' 
}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
    
    // 2. Correction du canal Temps Réel (Real-time)
    // Les filtres complexes (OR) ne sont pas gérés dans les chaînes de filtres Supabase realtime.
    // Donc, pour les admins/directeurs, on écoute toute la table, pour les chercheurs on filtre.
    const filterConfig = (userRole === 'admin' || userRole === 'director') 
      ? {} // Pas de filtre strict, ils écoutent tout
      : { filter: `user_id=eq.${userId}` } // Les chercheurs n'écoutent que leurs notifs

    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications', 
          ...filterConfig 
        },
        (payload) => {
          console.log('[v0] Notification update received:', payload)
          loadNotifications() // Recharge pour appliquer les bons filtres de lecture
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, userRole])

  const loadNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // 3. Correction de la requête de chargement
      if (userRole === 'admin' || userRole === 'director') {
        // Les admins/directeurs voient leurs propres notifications OU celles destinées à leur rôle
        // (Ajustez 'target_role' selon le nom exact de votre colonne dans votre base de données Supabase)
        query = query.or(`user_id.eq.${userId},target_role.eq.${userRole},target_role.eq.all,user_id.is.null`)
        
        // NOTE: Si vous voulez simplement que l'admin voie TOUTES les notifications du système, 
        // vous pouvez simplement supprimer la ligne `query = query.or(...)` ci-dessus.
      } else {
        // Les chercheurs ne voient que leurs notifications strictes
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('[v0] Error loading notifications:', error)
        return
      }

      setNotifications(data || [])
      const unread = (data ||[]).filter(n => !n.read).length
      setUnreadCount(unread)
    } catch (err) {
      console.error('[v0] Error in loadNotifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('[v0] Error marking notification as read:', err)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      const deleted = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (deleted && !deleted.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('[v0] Error deleting notification:', err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return '✓'
      case 'rejection': return '✗'
      case 'update': return '⚡'
      case 'message': return '💬'
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
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>
          {language === 'fr' ? 'Notifications' : 'Notifications'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            {language === 'fr' ? 'Chargement...' : 'Loading...'}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {language === 'fr' ? 'Aucune notification' : 'No notifications'}
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-3 border-b last:border-0 cursor-pointer transition-colors ${
                  notification.read
                    ? 'bg-background hover:bg-muted/50'
                    : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => markAsRead(notification.id)}
                        title={language === 'fr' ? 'Marquer comme lu' : 'Mark as read'}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteNotification(notification.id)}
                      title={language === 'fr' ? 'Supprimer' : 'Delete'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}