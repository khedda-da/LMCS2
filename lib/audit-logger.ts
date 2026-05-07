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

    // Try to insert with all available columns
    const insertData: any = {
      user_id: entry.userId,
      action: entry.action,
      entity_type: entry.entityType,
    }

    // Add optional fields only if they exist
    if (entry.userEmail) insertData.user_email = entry.userEmail
    if (entry.entityId) insertData.entity_id = entry.entityId
    if (entry.changes) insertData.changes = entry.changes
    if (entry.details) insertData.details = entry.details
    if (entry.ipAddress) insertData.ip_address = entry.ipAddress

    const { error } = await supabase
      .from('audit_logs')
      .insert(insertData)

    if (error) {
      console.error('[v0] Audit log error:', error.message, error.code)
    } else {
      console.log('[v0] Audit log created for action:', entry.action)
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
