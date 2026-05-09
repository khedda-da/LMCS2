import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit-logger'
import { createNotification } from '@/lib/real-notifications'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { supervisionId, studentIds } = body

    if (!supervisionId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: 'Invalid request: supervisionId and studentIds array required' },
        { status: 400 }
      )
    }

    const { data: supervision, error: fetchError } = await supabase
      .from('supervisions')
      .select('students')
      .eq('id', supervisionId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Supervision not found' }, { status: 404 })
    }

    const existingStudents = supervision?.students || []
    const updatedStudents = Array.from(new Set([...existingStudents, ...studentIds]))

    const { data: updated, error: updateError } = await supabase
      .from('supervisions')
      .update({ students: updatedStudents })
      .eq('id', supervisionId)
      .select()
      .single()

    if (updateError) throw updateError

    await logAuditEvent({
      userId: user.id,
      action: 'ASSIGN',
      entityType: 'supervision_students',
      entityId: supervisionId,
      changes: {
        studentIds,
        studentCount: studentIds.length,
      },
    })

    const newStudentIds = studentIds.filter((id: string) => !existingStudents.includes(id))
    if (newStudentIds.length > 0) {
      const supervisorId = updated.teacher_id
      if (supervisorId) {
        await createNotification({
          userId: supervisorId,
          title: 'Students Assigned',
          message: `${newStudentIds.length} new student(s) have been assigned to your supervision`,
          type: 'info',
          link: `/dashboard/supervisions/${supervisionId}`,
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      supervision: updated,
      message: `${studentIds.length} student(s) assigned successfully`
    })
  } catch (error) {
    console.error(' Student assignment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Assignment failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { supervisionId, studentId } = body

    if (!supervisionId || !studentId) {
      return NextResponse.json(
        { error: 'Invalid request: supervisionId and studentId required' },
        { status: 400 }
      )
    }

    const { data: supervision, error: fetchError } = await supabase
      .from('supervisions')
      .select('students')
      .eq('id', supervisionId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Supervision not found' }, { status: 404 })
    }

    // Remove student
    const updatedStudents = (supervision?.students || []).filter(
      (id: string) => id !== studentId
    )

    const { data: updated, error: updateError } = await supabase
      .from('supervisions')
      .update({ students: updatedStudents })
      .eq('id', supervisionId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ 
      success: true, 
      supervision: updated,
      message: 'Student removed from supervision'
    })
  } catch (error) {
    console.error(' Student removal error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Removal failed' },
      { status: 500 }
    )
  }
}
