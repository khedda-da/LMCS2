import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    
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
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (userData?.role !== 'admin' && userData?.role !== 'director') {
      query = query.eq('teacher_id', user.id)
    }

    const { data: supervisions, error } = await query

    if (error) {
      console.error('  Export error:', error)
      throw error
    }

    let enrichedSupervisions: any[] = []
    if (supervisions && supervisions.length > 0) {
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

      const { data: teachers } = teacherIds.length > 0 
        ? await supabase.from('users').select('id, full_name, email').in('id', teacherIds).is('deleted_at', null)
        : { data: [] }

      const { data: students } = studentIds.length > 0
        ? await supabase.from('students').select('id, full_name, registration_number, program, level, email').in('id', studentIds).is('deleted_at', null)
        : { data: [] }

      const { data: themes } = themeIds.length > 0
        ? await supabase.from('themes').select('id, name').in('id', themeIds)
        : { data: [] }

      const teacherMap = new Map((teachers || []).map(t => [t.id, t]))
      const studentMap = new Map((students || []).map(s => [s.id, s]))
      const themeMap = new Map((themes || []).map(t => [t.id, t]))

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
      let csv = 'Title,Type,Status,Students,Program,Supervisor,Co-Manager,Theme,Academic Year,Start Date,End Date,Description\n'

      enrichedSupervisions?.forEach((sup: any) => {
        const title = (sup.title || '').replace(/"/g, '""')
        const type = sup.type || ''
        const status = sup.status || ''
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
    console.error(' Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
