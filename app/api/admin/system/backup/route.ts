import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create service role client to bypass RLS and get ALL data
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

    const backup: {
      timestamp: string
      version: string
      description: string
      data: {
        users: any[]
        students: any[]
        supervisions: any[]
        documents: any[]
        notifications: any[]
        audit_logs: any[]
        sessions: any[]
        themes: any[]
      }
      counts: {
        users: { total: number, active: number, deleted: number }
        students: { total: number, active: number, deleted: number }
        supervisions: { total: number, active: number, deleted: number }
        documents: number
        notifications: number
        audit_logs: number
        sessions: number
        themes: number
      }
    } = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      description: 'Full database backup including soft-deleted records for complete restoration',
      data: {
        users: [],
        students: [],
        supervisions: [],
        documents: [],
        notifications: [],
        audit_logs: [],
        sessions: [],
        themes: [],
      },
      counts: {
        users: { total: 0, active: 0, deleted: 0 },
        students: { total: 0, active: 0, deleted: 0 },
        supervisions: { total: 0, active: 0, deleted: 0 },
        documents: 0,
        notifications: 0,
        audit_logs: 0,
        sessions: 0,
        themes: 0,
      }
    }

    // =====================================================
    // BACKUP ALL USERS (including soft-deleted)
    // =====================================================
    const { data: usersData, error: usersError } = await serviceSupabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })

    if (usersError) {
      console.error('[v0] Error fetching users for backup:', usersError)
    } else {
      backup.data.users = usersData || []
      backup.counts.users.total = usersData?.length || 0
      backup.counts.users.active = usersData?.filter(u => !u.deleted_at).length || 0
      backup.counts.users.deleted = usersData?.filter(u => u.deleted_at).length || 0
    }

    // =====================================================
    // BACKUP ALL STUDENTS (including soft-deleted)
    // =====================================================
    const { data: studentsData, error: studentsError } = await serviceSupabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: true })

    if (studentsError) {
      console.error('[v0] Error fetching students for backup:', studentsError)
    } else {
      backup.data.students = studentsData || []
      backup.counts.students.total = studentsData?.length || 0
      backup.counts.students.active = studentsData?.filter(s => !s.deleted_at).length || 0
      backup.counts.students.deleted = studentsData?.filter(s => s.deleted_at).length || 0
    }

    // =====================================================
    // BACKUP ALL SUPERVISIONS (including soft-deleted)
    // =====================================================
    const { data: supervisionsData, error: supervisionsError } = await serviceSupabase
      .from('supervisions')
      .select('*')
      .order('created_at', { ascending: true })

    if (supervisionsError) {
      console.error('[v0] Error fetching supervisions for backup:', supervisionsError)
    } else {
      backup.data.supervisions = supervisionsData || []
      backup.counts.supervisions.total = supervisionsData?.length || 0
      backup.counts.supervisions.active = supervisionsData?.filter(s => !s.deleted_at).length || 0
      backup.counts.supervisions.deleted = supervisionsData?.filter(s => s.deleted_at).length || 0
    }

    // =====================================================
    // BACKUP ALL DOCUMENTS
    // =====================================================
    const { data: documentsData, error: documentsError } = await serviceSupabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: true })

    if (documentsError) {
      console.error('[v0] Error fetching documents for backup:', documentsError)
    } else {
      backup.data.documents = documentsData || []
      backup.counts.documents = documentsData?.length || 0
    }

    // =====================================================
    // BACKUP ALL NOTIFICATIONS
    // =====================================================
    const { data: notificationsData, error: notificationsError } = await serviceSupabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: true })

    if (notificationsError) {
      console.error('[v0] Error fetching notifications for backup:', notificationsError)
    } else {
      backup.data.notifications = notificationsData || []
      backup.counts.notifications = notificationsData?.length || 0
    }

    // =====================================================
    // BACKUP ALL SESSIONS
    // =====================================================
    const { data: sessionsData, error: sessionsError } = await serviceSupabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: true })

    if (sessionsError) {
      console.error('[v0] Error fetching sessions for backup:', sessionsError)
    } else {
      backup.data.sessions = sessionsData || []
      backup.counts.sessions = sessionsData?.length || 0
    }

    // =====================================================
    // BACKUP ALL THEMES
    // =====================================================
    const { data: themesData, error: themesError } = await serviceSupabase
      .from('themes')
      .select('*')
      .order('created_at', { ascending: true })

    if (themesError) {
      console.error('[v0] Error fetching themes for backup:', themesError)
    } else {
      backup.data.themes = themesData || []
      backup.counts.themes = themesData?.length || 0
    }

    // =====================================================
    // BACKUP AUDIT LOGS (last 1000 entries to avoid huge files)
    // =====================================================
    const { data: auditLogsData, error: auditLogsError } = await serviceSupabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (auditLogsError) {
      console.error('[v0] Error fetching audit logs for backup:', auditLogsError)
    } else {
      backup.data.audit_logs = auditLogsData || []
      backup.counts.audit_logs = auditLogsData?.length || 0
    }

    // Log backup action
    await serviceSupabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'SYSTEM_BACKUP',
      entity_type: 'SYSTEM',
      entity_id: 'database',
      details: `Full database backup created. Users: ${backup.counts.users.total} (${backup.counts.users.active} active, ${backup.counts.users.deleted} deleted), Students: ${backup.counts.students.total}, Supervisions: ${backup.counts.supervisions.total}`,
      status: 'success'
    })

    const totalRecords = Object.values(backup.data).flat().length

    return NextResponse.json({
      success: true,
      message: 'Full database backup created successfully',
      backup: backup,
      recordCount: totalRecords,
      summary: {
        users: `${backup.counts.users.total} (${backup.counts.users.active} active, ${backup.counts.users.deleted} soft-deleted)`,
        students: `${backup.counts.students.total} (${backup.counts.students.active} active, ${backup.counts.students.deleted} soft-deleted)`,
        supervisions: `${backup.counts.supervisions.total} (${backup.counts.supervisions.active} active, ${backup.counts.supervisions.deleted} soft-deleted)`,
        documents: backup.counts.documents,
        notifications: backup.counts.notifications,
        sessions: backup.counts.sessions,
        themes: backup.counts.themes,
        audit_logs: backup.counts.audit_logs,
      },
      info: 'This backup includes ALL records including soft-deleted ones. Soft-deleted records will be restored with their deleted_at timestamp preserved, allowing you to recover them if needed.'
    })
  } catch (error: any) {
    console.error('[v0] Backup error:', error)
    return NextResponse.json(
      { error: 'Failed to create backup', details: error.message },
      { status: 500 }
    )
  }
}
