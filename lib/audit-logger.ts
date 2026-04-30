import { createServerClient } from '@supabase/ssr'

export interface AuditLogEntry {
  userId: string
  userEmail?: string
  action: string
  entityType: string
  entityId?: string
  changes?: Record<string, any>
  details?: string
  ipAddress?: string
}

export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    // Use service role key to bypass RLS for audit logging
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[v0] Missing Supabase environment variables for audit logging')
      return
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.userId,
        user_email: entry.userEmail,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        changes: entry.changes,
        details: entry.details,
        ip_address: entry.ipAddress,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('[v0] Audit log error:', error)
    }
  } catch (error) {
    console.error('[v0] Failed to log audit event:', error)
  }
}

export async function getAuditLogs(
  limit: number = 100,
  offset: number = 0
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        changes,
        ip_address,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[v0] Error fetching audit logs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[v0] Failed to fetch audit logs:', error)
    return []
  }
}
