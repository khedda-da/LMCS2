import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Build query based on role - simplified to avoid foreign key issues
    let query = supabase
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
        teacher_id,
        co_advisor_id,
        student_id,
        students,
        theme_id
      `)
      .order('created_at', { ascending: false })

    // Filter by teacher_id if not admin/director
    if (userData?.role !== 'admin' && userData?.role !== 'director') {
      query = query.eq('teacher_id', user.id)
    }

    const { data: supervisions, error } = await query

    if (error) {
      console.error('[v0] Export error:', error)
      throw error
    }

    // Fetch related data separately if supervisions exist
    let enrichedSupervisions: any[] = []
    if (supervisions && supervisions.length > 0) {
      // Get unique IDs - handle both students array and legacy student_id, plus coadvisors
      const teacherIds = [...new Set(supervisions.flatMap(s => [s.teacher_id, s.co_advisor_id]).filter(Boolean))]
      const studentIds = [
        ...new Set(
          supervisions
            .flatMap(s => {
              const ids: string[] = []
              if (s.students && Array.isArray(s.students)) {
                ids.push(...s.students)
              }
              if (s.student_id) {
                ids.push(s.student_id)
              }
              return ids
            })
            .filter(Boolean)
        )
      ]
      const themeIds = [...new Set(supervisions.map(s => s.theme_id).filter(Boolean))]

      // Fetch teachers
      const { data: teachers } = teacherIds.length > 0 
        ? await supabase.from('users').select('id, full_name, email').in('id', teacherIds)
        : { data: [] }

      // Fetch students
      const { data: students } = studentIds.length > 0
        ? await supabase.from('students').select('id, full_name, registration_number, program, level, email').in('id', studentIds)
        : { data: [] }

      // Fetch themes
      const { data: themes } = themeIds.length > 0
        ? await supabase.from('themes').select('id, name').in('id', themeIds)
        : { data: [] }

      // Create lookup maps
      const teacherMap = new Map((teachers || []).map(t => [t.id, t]))
      const studentMap = new Map((students || []).map(s => [s.id, s]))
      const themeMap = new Map((themes || []).map(t => [t.id, t]))

      // Enrich supervisions - handle both students array and legacy student_id
      enrichedSupervisions = supervisions.map(sup => {
        let studentList: any[] = []
        if (sup.students && Array.isArray(sup.students)) {
          studentList = sup.students.map(id => studentMap.get(id)).filter(Boolean)
        } else if (sup.student_id) {
          const student = studentMap.get(sup.student_id)
          if (student) studentList = [student]
        }
        return {
          ...sup,
          teacher: teacherMap.get(sup.teacher_id) || null,
          coAdvisor: teacherMap.get(sup.co_advisor_id) || null,
          student: studentMap.get(sup.student_id) || null, // Keep for backward compatibility
          studentList: studentList,
          theme: themeMap.get(sup.theme_id) || null,
        }
      })
    }

    if (format === 'csv') {
      // Create CSV header with all columns including comanager
      let csv = 'Title,Type,Status,Students,Program,Supervisor,Co-Manager,Theme,Academic Year,Start Date,End Date,Description\n'

      enrichedSupervisions?.forEach((sup: any) => {
        const title = (sup.title || '').replace(/"/g, '""')
        const type = sup.type || ''
        const status = sup.status || ''
        // Get ALL student names from studentList or fall back to single student
        const studentNames = sup.studentList && sup.studentList.length > 0 
          ? sup.studentList.map((s: any) => s.full_name || 'N/A').join('; ')
          : (sup.student?.full_name || '')
        const program = sup.studentList && sup.studentList.length > 0 
          ? sup.studentList.map((s: any) => s.program || 'N/A').join('; ')
          : (sup.student?.program || '')
        const supervisor = (sup.teacher?.full_name || '').replace(/"/g, '""')
        const coManager = (sup.coAdvisor?.full_name || '').replace(/"/g, '""')
        const theme = (sup.theme?.name || '').replace(/"/g, '""')
        const academicYear = sup.academic_year || ''
        const startDate = sup.start_date || ''
        const endDate = sup.end_date || ''
        const description = (sup.description || '').replace(/"/g, '""').replace(/\n/g, ' ')

        csv += `"${title}","${type}","${status}","${studentNames}","${program}","${supervisor}","${coManager}","${theme}","${academicYear}","${startDate}","${endDate}","${description}"\n`
      })

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="lmcs-supervisions.csv"',
        },
      })
    } else if (format === 'json') {
      return NextResponse.json({
        exportDate: new Date().toISOString(),
        totalRecords: enrichedSupervisions?.length || 0,
        data: enrichedSupervisions
      }, {
        headers: {
          'Content-Disposition': 'attachment; filename="lmcs-supervisions.json"',
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format. Use csv or json.' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
