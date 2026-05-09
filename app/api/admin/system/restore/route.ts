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
    documents?: any[]
    notifications?: any[]
    audit_logs?: any[]
    sessions?: any[]
    themes?: any[]
  }
  
  users?: any[]
  students?: any[]
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

    
    const restoreData = backupFile.data || backupFile

    // Validate data structure
    if (!restoreData || typeof restoreData !== 'object') {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 })
    }

    const results = {
      users: { restored: 0, errors: [] as string[] },
      students: { restored: 0, errors: [] as string[] },
      supervisions: { restored: 0, errors: [] as string[] },
      documents: { restored: 0, errors: [] as string[] },
      notifications: { restored: 0, errors: [] as string[] },
      sessions: { restored: 0, errors: [] as string[] },
      themes: { restored: 0, errors: [] as string[] },
    }

   
    
    // Clear in reverse dependency order
    try {
      await serviceSupabase.from('notifications').delete().gte('created_at', '1900-01-01')
      await serviceSupabase.from('documents').delete().gte('created_at', '1900-01-01')
      await serviceSupabase.from('sessions').delete().gte('created_at', '1900-01-01')
      await serviceSupabase.from('supervisions').delete().gte('created_at', '1900-01-01')
      await serviceSupabase.from('students').delete().gte('created_at', '1900-01-01')
      await serviceSupabase.from('themes').delete().gte('created_at', '1900-01-01')
      console.log('  Cleared existing data for restore')
    } catch (clearError) {
      console.warn('  Warning during data clearing:', clearError)
    }

    // =====================================================
    // STEP 2: Restore USERS (upsert to handle existing users)
    // =====================================================
    if (restoreData.users && Array.isArray(restoreData.users) && restoreData.users.length > 0) {
      for (const userData of restoreData.users) {
        if (!userData.id || !userData.email) {
          results.users.errors.push(`Skipping user with missing id or email`)
          continue
        }

        try {
          // Check if user exists
          const { data: existingUser } = await serviceSupabase
            .from('users')
            .select('id')
            .eq('id', userData.id)
            .single()

          if (existingUser) {
            // Update existing user (restore soft-deleted or update data)
            const { error } = await serviceSupabase
              .from('users')
              .update({
                email: userData.email,
                full_name: userData.full_name || '',
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                role: userData.role || 'supervisor',
                requested_role: userData.requested_role || null,
                additional_roles: userData.additional_roles || [],
                is_approved: userData.is_approved ?? false,
                is_active: userData.is_active ?? true,
                department: userData.department || null,
                specialization: userData.specialization || null,
                phone: userData.phone || null,
                bio: userData.bio || null,
                address: userData.address || null,
                profile_picture_url: userData.profile_picture_url || null,
                password_hash: userData.password_hash || null,
                deleted_at: userData.deleted_at || null, // Preserve deleted_at status
                updated_at: new Date().toISOString(),
              })
              .eq('id', userData.id)

            if (error) {
              results.users.errors.push(`User ${userData.email}: ${error.message}`)
            } else {
              results.users.restored++
            }
          } else {
            // Insert new user
            const { error } = await serviceSupabase
              .from('users')
              .insert({
                id: userData.id,
                email: userData.email,
                full_name: userData.full_name || '',
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                role: userData.role || 'supervisor',
                requested_role: userData.requested_role || null,
                additional_roles: userData.additional_roles || [],
                is_approved: userData.is_approved ?? false,
                is_active: userData.is_active ?? true,
                department: userData.department || null,
                specialization: userData.specialization || null,
                phone: userData.phone || null,
                bio: userData.bio || null,
                address: userData.address || null,
                profile_picture_url: userData.profile_picture_url || null,
                password_hash: userData.password_hash || null,
                deleted_at: userData.deleted_at || null, // Preserve deleted_at status
                created_at: userData.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

            if (error) {
              results.users.errors.push(`User ${userData.email}: ${error.message}`)
            } else {
              results.users.restored++
            }
          }
        } catch (err) {
          results.users.errors.push(`User ${userData.email}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    }

    // =====================================================
    // STEP 3: Restore THEMES (needed before supervisions)
    // =====================================================
    if (restoreData.themes && Array.isArray(restoreData.themes) && restoreData.themes.length > 0) {
      for (const theme of restoreData.themes) {
        if (!theme.id) continue

        try {
          const { error } = await serviceSupabase
            .from('themes')
            .insert({
              id: theme.id,
              name: theme.name || '',
              description: theme.description || null,
              created_at: theme.created_at || new Date().toISOString(),
              updated_at: theme.updated_at || new Date().toISOString(),
            })

          if (error) {
            results.themes.errors.push(`Theme ${theme.name || theme.id}: ${error.message}`)
          } else {
            results.themes.restored++
          }
        } catch (err) {
          results.themes.errors.push(`Theme ${theme.name || theme.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    }

    // =====================================================
    // STEP 4: Restore STUDENTS
    // =====================================================
    if (restoreData.students && Array.isArray(restoreData.students) && restoreData.students.length > 0) {
      for (const student of restoreData.students) {
        if (!student.id) {
          results.students.errors.push('Skipping student with missing id')
          continue
        }

        try {
          const { error } = await serviceSupabase
            .from('students')
            .insert({
              id: student.id,
              user_id: student.user_id || null,
              registration_number: student.registration_number || null,
              full_name: student.full_name || '',
              email: student.email || '',
              phone: student.phone || null,
              program: student.program || null,
              level: student.level || null,
              academic_year: student.academic_year || null,
              deleted_at: student.deleted_at || null, 
              created_at: student.created_at || new Date().toISOString(),
              updated_at: student.updated_at || new Date().toISOString(),
            })

          if (error) {
            results.students.errors.push(`Student ${student.full_name || student.id}: ${error.message}`)
          } else {
            results.students.restored++
          }
        } catch (err) {
          results.students.errors.push(`Student ${student.full_name || student.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    }

    // =====================================================
    // STEP 5: Restore SUPERVISIONS
    // =====================================================
    if (restoreData.supervisions && Array.isArray(restoreData.supervisions) && restoreData.supervisions.length > 0) {
      for (const supervision of restoreData.supervisions) {
        if (!supervision.id) {
          results.supervisions.errors.push('Skipping supervision with missing id')
          continue
        }

        try {
          const { error } = await serviceSupabase
            .from('supervisions')
            .insert({
              id: supervision.id,
              title: supervision.title || '',
              description: supervision.description || null,
              student_id: supervision.student_id || null,
              teacher_id: supervision.teacher_id || null,
              co_advisor_id: supervision.co_advisor_id || null,
              type: supervision.type || 'pfe',
              status: supervision.status || 'active',
              theme_id: supervision.theme_id || null,
              start_date: supervision.start_date || null,
              end_date: supervision.end_date || null,
              academic_year: supervision.academic_year || null,
              objectives: supervision.objectives || null,
              students: supervision.students || [],
              supervisors: supervision.supervisors || [],
              deleted_at: supervision.deleted_at || null, 
              created_at: supervision.created_at || new Date().toISOString(),
              updated_at: supervision.updated_at || new Date().toISOString(),
            })

          if (error) {
            results.supervisions.errors.push(`Supervision ${supervision.title || supervision.id}: ${error.message}`)
          } else {
            results.supervisions.restored++
          }
        } catch (err) {
          results.supervisions.errors.push(`Supervision ${supervision.title || supervision.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    }

    // =====================================================
    // STEP 6: Restore SESSIONS
    // =====================================================
    if (restoreData.sessions && Array.isArray(restoreData.sessions) && restoreData.sessions.length > 0) {
      for (const session of restoreData.sessions) {
        if (!session.id || !session.supervision_id) continue

        try {
          const { error } = await serviceSupabase
            .from('sessions')
            .insert({
              id: session.id,
              supervision_id: session.supervision_id,
              session_date: session.session_date,
              duration_minutes: session.duration_minutes || 60,
              status: session.status || 'scheduled',
              notes: session.notes || null,
              location: session.location || null,
              created_at: session.created_at || new Date().toISOString(),
              updated_at: session.updated_at || new Date().toISOString(),
            })

          if (error) {
            results.sessions.errors.push(`Session ${session.id}: ${error.message}`)
          } else {
            results.sessions.restored++
          }
        } catch (err) {
          results.sessions.errors.push(`Session ${session.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    }

    // =====================================================
    // STEP 7: Restore DOCUMENTS
    // =====================================================
    if (restoreData.documents && Array.isArray(restoreData.documents) && restoreData.documents.length > 0) {
      for (const document of restoreData.documents) {
        if (!document.id || !document.supervision_id) continue

        try {
          const { error } = await serviceSupabase
            .from('documents')
            .insert({
              id: document.id,
              supervision_id: document.supervision_id,
              title: document.title || document.name || '',
              document_type: document.document_type || document.file_type || null,
              file_url: document.file_url || null,
              file_size: document.file_size || null,
              uploaded_by: document.uploaded_by || null,
              version_number: document.version_number || 1,
              feedback: document.feedback || null,
              created_at: document.created_at || new Date().toISOString(),
              updated_at: document.updated_at || new Date().toISOString(),
            })

          if (error) {
            results.documents.errors.push(`Document ${document.title || document.id}: ${error.message}`)
          } else {
            results.documents.restored++
          }
        } catch (err) {
          results.documents.errors.push(`Document ${document.title || document.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    }

    // =====================================================
    // STEP 8: Restore NOTIFICATIONS
    // =====================================================
    if (restoreData.notifications && Array.isArray(restoreData.notifications) && restoreData.notifications.length > 0) {
      for (const notification of restoreData.notifications) {
        if (!notification.id || !notification.user_id) continue

        try {
          const { error } = await serviceSupabase
            .from('notifications')
            .insert({
              id: notification.id,
              user_id: notification.user_id,
              title: notification.title || '',
              message: notification.message || '',
              type: notification.type || 'info',
              read: notification.read ?? false,
              link: notification.link || null,
              related_entity_type: notification.related_entity_type || null,
              related_entity_id: notification.related_entity_id || null,
              action_required: notification.action_required ?? false,
              metadata: notification.metadata || {},
              created_at: notification.created_at || new Date().toISOString(),
              updated_at: notification.updated_at || new Date().toISOString(),
            })

          if (error) {
            results.notifications.errors.push(`Notification ${notification.id}: ${error.message}`)
          } else {
            results.notifications.restored++
          }
        } catch (err) {
          results.notifications.errors.push(`Notification ${notification.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    }

    // =====================================================
    // Log the restore action
    // =====================================================
    const totalRestored = results.users.restored + results.students.restored + 
      results.supervisions.restored + results.documents.restored + 
      results.notifications.restored + results.sessions.restored + results.themes.restored
    
    const totalErrors = results.users.errors.length + results.students.errors.length +
      results.supervisions.errors.length + results.documents.errors.length +
      results.notifications.errors.length + results.sessions.errors.length + results.themes.errors.length

    try {
      await logAuditEvent({
        userId: user.id,
        userEmail: userData?.email,
        action: 'DATABASE_RESTORE',
        entityType: 'DATABASE',
        changes: {
          users_restored: results.users.restored,
          students_restored: results.students.restored,
          supervisions_restored: results.supervisions.restored,
          documents_restored: results.documents.restored,
          notifications_restored: results.notifications.restored,
          sessions_restored: results.sessions.restored,
          themes_restored: results.themes.restored,
          total_restored: totalRestored,
          total_errors: totalErrors,
        },
        details: `Database restored from backup. ${totalRestored} records restored, ${totalErrors} errors.`,
      })
    } catch (logErr) {
      console.error('  Error logging restore action:', logErr)
    }

    // Collect all errors for response
    const allErrors = [
      ...results.users.errors,
      ...results.students.errors,
      ...results.supervisions.errors,
      ...results.documents.errors,
      ...results.notifications.errors,
      ...results.sessions.errors,
      ...results.themes.errors,
    ]

    return NextResponse.json({
      success: true,
      message: `Database restore completed. ${totalRestored} records restored.`,
      totalRestored,
      totalErrors,
      details: {
        users: results.users.restored,
        students: results.students.restored,
        supervisions: results.supervisions.restored,
        documents: results.documents.restored,
        notifications: results.notifications.restored,
        sessions: results.sessions.restored,
        themes: results.themes.restored,
      },
      errors: allErrors.length > 0 ? allErrors : undefined,
      info: `Restored ${results.users.restored} users, ${results.students.restored} students, ${results.supervisions.restored} supervisions, ${results.documents.restored} documents, ${results.notifications.restored} notifications. Soft-deleted records are preserved with their deleted_at timestamps.`,
    })
  } catch (error) {
    console.error('  Restore error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore database' },
      { status: 500 }
    )
  }
}
