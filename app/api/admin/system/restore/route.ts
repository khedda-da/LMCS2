import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit-logger'

interface BackupData {
  timestamp?: string
  version?: string
  data?: {
    users?: any[]
    students?: any[]
    supervisions?: any[]
    notifications?: any[]
    audit_logs?: any[]
    documents?: any[]
  }
  // Legacy format support
  users?: any[]
  supervisions?: any[]
  notifications?: any[]
  audit_logs?: any[]
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Check user authentication and role
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (userError || userData?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Create service role client for restoring data (bypasses RLS)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const fileContent = await file.text()
    const backupFile: BackupData = JSON.parse(fileContent)

    // Support both old and new backup formats
    const restoreData = backupFile.data || backupFile

    // Validate data structure
    if (!restoreData || typeof restoreData !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }

    let restoredCount = 0
    const tempPasswords: Record<string, string> = {}
    const errors: string[] = []

    // Clear existing data before restoring
    try {
      // Delete notifications first (no foreign key dependencies)
      const { error: notifError } = await serviceSupabase
        .from('notifications')
        .delete()
        .gt('id', '')

      if (notifError) {
        console.warn('[v0] Warning clearing notifications:', notifError)
      }

      // Delete supervisions (depends on users)
      const { error: supervisionError } = await serviceSupabase
        .from('supervisions')
        .delete()
        .gt('id', '')

      if (supervisionError) {
        console.warn('[v0] Warning clearing supervisions:', supervisionError)
      }

      // Delete students (depends on users)
      const { error: studentError } = await serviceSupabase
        .from('students')
        .delete()
        .gt('id', '')

      if (studentError) {
        console.warn('[v0] Warning clearing students:', studentError)
      }

      // Delete documents (depends on users/supervisions)
      const { error: docError } = await serviceSupabase
        .from('documents')
        .delete()
        .gt('id', '')

      if (docError) {
        console.warn('[v0] Warning clearing documents:', docError)
      }

      // Finally delete users (other tables depend on this)
      const { error: userError } = await serviceSupabase
        .from('users')
        .delete()
        .gt('id', '')

      if (userError) {
        console.warn('[v0] Warning clearing users:', userError)
      }

      console.log('[v0] Database cleared, ready for restore')
    } catch (err) {
      console.warn('[v0] Warning clearing old data:', err)
    }

    // Restore users if data exists
    if (restoreData.users && Array.isArray(restoreData.users) && restoreData.users.length > 0) {
      try {
        for (const user of restoreData.users) {
          if (!user.id || !user.email) {
            errors.push(`Skipping user with missing required fields`)
            continue
          }

          // Insert into application users table
          const { error } = await serviceSupabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.full_name || '',
              first_name: user.first_name || '',
              last_name: user.last_name || '',
              role: user.role || 'user',
              is_approved: user.is_approved ?? true,
              profile_picture_url: user.profile_picture_url || null,
              created_at: user.created_at || new Date().toISOString(),
              updated_at: user.updated_at || new Date().toISOString(),
            })

          if (error) {
            errors.push(`User ${user.email}: ${error.message}`)
            console.warn(`[v0] Failed to restore user ${user.email}:`, error)
            continue
          }

          // Create auth account with a temporary password so the user can sign in.
          // Uses the service role client's admin API.
          try {
            const tempPassword = `Tmp!${Math.random().toString(36).slice(2,10)}${Date.now().toString().slice(-4)}`
            if (serviceSupabase.auth && serviceSupabase.auth.admin && typeof serviceSupabase.auth.admin.createUser === 'function') {
              const { user: createdAuthUser, error: authErr } = await serviceSupabase.auth.admin.createUser({
                id: user.id,
                email: user.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                  full_name: user.full_name || '',
                  first_name: user.first_name || '',
                  last_name: user.last_name || '',
                },
              } as any)

              if (authErr) {
                errors.push(`Auth create user ${user.email}: ${authErr.message}`)
                console.warn(`[v0] Failed to create auth user ${user.email}:`, authErr)
              } else {
                restoredCount++
                // Insert a notification containing the temporary password for admin to share (do NOT email plaintext in prod)
                try {
                  const nid = (globalThis.crypto && typeof (globalThis.crypto as any).randomUUID === 'function') ? (globalThis.crypto as any).randomUUID() : `notif-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
                  await serviceSupabase.from('notifications').insert({
                    id: nid,
                    user_id: user.id,
                    title: 'Account Restored',
                    message: `Your account was restored. Temporary password: ${tempPassword}`,
                    type: 'info',
                    read: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                } catch (nerr) {
                  console.warn('[v0] Failed to create restore notification:', nerr)
                }
              }
            } else {
              // Fallback: try to create a user via SQL into auth.users (risky).
              console.warn('[v0] Admin createUser API not available on serviceSupabase; skipping auth user creation for', user.email)
              errors.push(`Auth API unavailable; auth user not created for ${user.email}`)
            }
          } catch (aerr) {
            errors.push(`Error creating auth user for ${user.email}: ${aerr instanceof Error ? aerr.message : String(aerr)}`)
            console.error('[v0] Error creating auth user:', aerr)
          }
        }
      } catch (err) {
        errors.push(`Error restoring users: ${err instanceof Error ? err.message : 'Unknown error'}`)
        console.error('[v0] Error restoring users batch:', err)
      }
    }

    // Restore supervisions if data exists
    if (restoreData.supervisions && Array.isArray(restoreData.supervisions) && restoreData.supervisions.length > 0) {
      try {
        for (const supervision of restoreData.supervisions) {
          if (!supervision.id) {
            errors.push(`Skipping supervision with missing required fields`)
            continue
          }

          const { error } = await serviceSupabase
            .from('supervisions')
            .insert({
              id: supervision.id,
              title: supervision.title || '',
              type: supervision.type || 'standard',
              status: supervision.status || 'active',
              teacher_id: supervision.teacher_id || null,
              student_id: supervision.student_id || null,
              academic_year: supervision.academic_year || '',
              description: supervision.description || null,
              created_at: supervision.created_at || new Date().toISOString(),
              updated_at: supervision.updated_at || new Date().toISOString(),
            })

          if (error) {
            errors.push(`Supervision ${supervision.title || supervision.id}: ${error.message}`)
            console.warn(`[v0] Failed to restore supervision ${supervision.id}:`, error)
          } else {
            restoredCount++
          }
        }
      } catch (err) {
        errors.push(`Error restoring supervisions: ${err instanceof Error ? err.message : 'Unknown error'}`)
        console.error('[v0] Error restoring supervisions batch:', err)
      }
    }

    // Restore notifications if data exists
    if (restoreData.notifications && Array.isArray(restoreData.notifications) && restoreData.notifications.length > 0) {
      try {
        for (const notification of restoreData.notifications) {
          if (!notification.id || !notification.user_id) {
            errors.push(`Skipping notification with missing required fields`)
            continue
          }

          const { error } = await serviceSupabase
            .from('notifications')
            .insert({
              id: notification.id,
              user_id: notification.user_id,
              title: notification.title || '',
              message: notification.message || '',
              type: notification.type || 'general',
              read: notification.read ?? false,
              created_at: notification.created_at || new Date().toISOString(),
              updated_at: notification.updated_at || new Date().toISOString(),
            })

          if (error) {
            errors.push(`Notification ${notification.id}: ${error.message}`)
            console.warn(`[v0] Failed to restore notification ${notification.id}:`, error)
          } else {
            restoredCount++
          }
        }
      } catch (err) {
        errors.push(`Error restoring notifications: ${err instanceof Error ? err.message : 'Unknown error'}`)
        console.error('[v0] Error restoring notifications batch:', err)
      }
    }

    // Log the restore action
    try {
      await logAuditEvent({
        userId: user.id,
        userEmail: userData?.email,
        action: 'DATABASE_RESTORE',
        entityType: 'DATABASE',
        changes: {
          users_restored: restoreData.users?.length || 0,
          supervisions_restored: restoreData.supervisions?.length || 0,
          notifications_restored: restoreData.notifications?.length || 0,
          total_restored: restoredCount,
          errors: errors.length,
        },
        details: `Database restored from backup file. ${restoredCount} records restored${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
      })
    } catch (logErr) {
      console.error('[v0] Error logging restore action:', logErr)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${restoredCount} records from backup`,
      restoredCount,
      tempPasswords: Object.keys(tempPasswords).length ? tempPasswords : undefined,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[v0] Restore error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore database' },
      { status: 500 }
    )
  }
}