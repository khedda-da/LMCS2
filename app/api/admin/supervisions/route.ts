import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit-logger'
import { createNotification, createNotificationsForUsers } from '@/lib/real-notifications'

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase configuration missing', supervisions: [] }, { status: 200 })
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

    // Fetch supervisions with related data
    const { data: supervisions, error } = await supabase
      .from('supervisions')
      .select(`
        id,
        title,
        description,
        type,
        status,
        start_date,
        end_date,
        academic_year,
        objectives,
        created_at,
        student_id,
        teacher_id,
        co_advisor_id,
        theme_id
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching supervisions:', error)
      return NextResponse.json({ error: error.message, supervisions: [] }, { status: 200 })
    }

    // Get related data separately
    const studentIds = [...new Set(supervisions?.map(s => s.student_id).filter(Boolean))]
    const supervisorIds = [...new Set([
      ...supervisions?.map(s => s.teacher_id).filter(Boolean) || [],
      ...supervisions?.map(s => s.co_advisor_id).filter(Boolean) || []
    ])]

    // Fetch students
    let studentsMap: Record<string, any> = {}
    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id, registration_number, program, level')
        .in('id', studentIds)

      if (students) {
        const userIds = students.map(s => s.user_id)
        const { data: studentUsers } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds)

        students.forEach(student => {
          const user = studentUsers?.find(u => u.id === student.user_id)
          studentsMap[student.id] = {
            ...student,
            full_name: user?.full_name || 'Unknown',
            email: user?.email || ''
          }
        })
      }
    }

    // Fetch supervisors
    let supervisorsMap: Record<string, any> = {}
    if (supervisorIds.length > 0) {
      const { data: supervisors } = await supabase
        .from('users')
        .select('id, full_name, email, role')
        .in('id', supervisorIds)

      supervisors?.forEach(sup => {
        supervisorsMap[sup.id] = sup
      })
    }

    // Combine data
    const enrichedSupervisions = supervisions?.map(supervision => ({
      ...supervision,
      student: studentsMap[supervision.student_id] || null,
      supervisor: supervisorsMap[supervision.teacher_id] || null,
      co_supervisor: supervision.co_advisor_id ? supervisorsMap[supervision.co_advisor_id] : null,
    }))

    return NextResponse.json({ supervisions: enrichedSupervisions || [] })
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to fetch supervisions', supervisions: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const body = await request.json()
    const { title, description, student_id, teacher_id, co_advisor_id, type, status, start_date, academic_year, objectives } = body

    if (!title || !student_id || !teacher_id || !type || !start_date || !academic_year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    const { data: supervision, error } = await supabase
      .from('supervisions')
      .insert([{
        title,
        description: description || '',
        student_id,
        teacher_id,
        co_advisor_id: co_advisor_id || null,
        type,
        status: status || 'active',
        start_date,
        academic_year,
        objectives: objectives || '',
      }])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating supervision:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get current user for audit logging
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

    // Log audit event
    if (currentUserId) {
      await logAuditEvent({
        userId: currentUserId,
        action: 'CREATE',
        entityType: 'supervision',
        entityId: supervision?.id,
        details: `Created supervision: ${title}`,
        changes: { title, type, student_id, teacher_id, co_advisor_id, academic_year },
      })
    }

    // Notify the main supervisor
    if (teacher_id) {
      await createNotification({
        userId: teacher_id,
        title: 'New Supervision Assigned',
        message: `You have been assigned as the main supervisor for "${title}"`,
        type: 'info',
        link: `/dashboard/supervisions/${supervision?.id}`,
        relatedEntityType: 'supervision',
        relatedEntityId: supervision?.id,
      })
    }

    // Notify the co-supervisor if exists
    if (co_advisor_id) {
      await createNotification({
        userId: co_advisor_id,
        title: 'New Co-Supervision Assigned',
        message: `You have been assigned as a co-supervisor for "${title}"`,
        type: 'info',
        link: `/dashboard/supervisions/${supervision?.id}`,
        relatedEntityType: 'supervision',
        relatedEntityId: supervision?.id,
      })
    }

    // Notify all admins and directors about the new supervision
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .in('role', ['admin', 'director'])
      .neq('id', currentUserId || '')

    if (admins && admins.length > 0) {
      const adminIds = admins.map(a => a.id)
      await createNotificationsForUsers(
        adminIds,
        'New Supervision Created',
        `A new supervision "${title}" has been created`,
        'info',
        `/dashboard/supervisions/${supervision?.id}`,
        'supervision',
        supervision?.id
      )
    }

    return NextResponse.json({ supervision, message: 'Supervision created successfully' })
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to create supervision' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Supervision ID is required' }, { status: 400 })
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

    // Get original supervision for comparison
    const { data: originalSupervision } = await supabase
      .from('supervisions')
      .select('*')
      .eq('id', id)
      .single()

    const { data: supervision, error } = await supabase
      .from('supervisions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating supervision:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get current user for audit logging
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

    // Log audit event
    if (currentUserId) {
      await logAuditEvent({
        userId: currentUserId,
        action: 'UPDATE',
        entityType: 'supervision',
        entityId: id,
        details: `Updated supervision: ${supervision?.title}`,
        changes: updates,
      })
    }

    // If status changed, notify relevant users
    if (updates.status && updates.status !== originalSupervision?.status) {
      const notifyUsers = [originalSupervision?.teacher_id, originalSupervision?.co_advisor_id].filter(Boolean)
      if (notifyUsers.length > 0) {
        await createNotificationsForUsers(
          notifyUsers as string[],
          'Supervision Status Changed',
          `The status of "${supervision?.title}" has been changed to ${updates.status}`,
          'info',
          `/dashboard/supervisions/${id}`,
          'supervision',
          id
        )
      }
    }

    return NextResponse.json({ supervision, message: 'Supervision updated successfully' })
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to update supervision' }, { status: 500 })
  }
}
