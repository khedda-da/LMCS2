import { createClient } from '@/lib/supabase/server'

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        read: false,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('  Error creating notification:', error)
    }
  } catch (error) {
    console.error('  Notification creation failed:', error)
  }
}

export async function createAuditLog(
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  entityType: string,
  entityId: string,
  changes: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        changes,
        ip_address: ipAddress || 'unknown',
        user_agent: userAgent || 'unknown',
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('  Error creating audit log:', error)
    }
  } catch (error) {
    console.error('  Audit log creation failed:', error)
  }
}
