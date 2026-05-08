import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logAuditEvent } from '@/lib/audit-logger'
import { createNotificationsForUsers } from '@/lib/real-notifications'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    // Get current user from auth header or session
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7))
      userId = user?.id || null
    }

    // Fallback to cookie-based auth
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession()
      userId = session?.user?.id || null
    }

    const { searchParams } = new URL(request.url)
    const supervisorId = searchParams.get('supervisor_id') || userId

    if (!supervisorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch supervisions for the supervisor (as main supervisor OR co-supervisor)
    // Filter out soft-deleted supervisions
    const { data: supervisions, error } = await supabase
      .from('supervisions')
      .select(`
        *,
        student:students(
          id,
          user_id,
          registration_number,
          full_name,
          email,
          program,
          level,
          academic_year
        ),
        supervisor:users!supervisions_teacher_id_fkey(
          id,
          full_name,
          email
        ),
        co_supervisor:users!supervisions_co_advisor_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .or(`teacher_id.eq.${supervisorId},co_advisor_id.eq.${supervisorId}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching supervisions:', error)
      return NextResponse.json({ supervisions: [] })
    }

    return NextResponse.json({ supervisions: supervisions || [] })
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    return NextResponse.json({ supervisions: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, student_id, supervisor_id, type, start_date, academic_year } = body

    if (!title || !student_id || !supervisor_id) {
      return NextResponse.json(
        { error: 'Title, student, and supervisor are required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    // Verify the supervisor exists, is approved, and not soft-deleted
    const { data: supervisorData, error: supervisorError } = await supabase
      .from('users')
      .select('id, role, is_approved, full_name')
      .eq('id', supervisor_id)
      .is('deleted_at', null)
      .single()

    if (supervisorError || !supervisorData?.is_approved) {
      return NextResponse.json(
        { error: 'Invalid or unapproved supervisor' },
        { status: 400 }
      )
    }

    // Verify the student exists and is not soft-deleted
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', student_id)
      .is('deleted_at', null)
      .single()

    if (studentError) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 400 }
      )
    }

    // Map supervision type to enum values
    const typeMap: Record<string, string> = {
      'license': 'pfe',
      'master': 'master',
      'phd': 'doctorate',
      'internship': 'internship'
    }

    // Create the supervision (using teacher_id as per schema)
    const { data: supervision, error: insertError } = await supabase
      .from('supervisions')
      .insert([
        {
          title,
          description: description || null,
          student_id,
          teacher_id: supervisor_id,
          type: typeMap[type] || 'master',
          status: 'active',
          start_date: start_date || new Date().toISOString().split('T')[0],
          academic_year: academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        },
      ])
      .select()
      .single()

    if (insertError) {
      console.error('[v0] Error creating supervision:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Failed to create supervision' },
        { status: 500 }
      )
    }

    // Log audit event
    const authHeader = request.headers.get('authorization')
    let currentUserId: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7))
      currentUserId = user?.id || null
    }

    if (currentUserId) {
      await logAuditEvent({
        userId: currentUserId,
        action: 'CREATE',
        entityType: 'supervision',
        entityId: supervision?.id,
        changes: {
          title,
          description,
          student_id,
          supervisor_id,
          type,
          academic_year,
        },
      })

      // Notify all admins and directors (exclude soft-deleted)
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'director'])
        .is('deleted_at', null)

      if (admins && admins.length > 0) {
        const adminIds = admins.map(admin => admin.id)
        await createNotificationsForUsers(
          adminIds,
          'New Supervision Created',
          `A new supervision "${title}" has been created by ${supervisorData.full_name || 'a supervisor'}`,
          'info',
          `/dashboard/supervisions/${supervision?.id}`
        )
      }
    }

    return NextResponse.json({ supervision, success: true })
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to create supervision' },
      { status: 500 }
    )
  }
}
