import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('  Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError) {
      console.error(' Role check error:', roleError)
      return NextResponse.json({ error: 'Failed to verify role' }, { status: 500 })
    }

    if (!userData || !['admin', 'director'].includes(userData.role)) {
      console.warn(' User does not have proper role:', userData?.role)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const supervisor = searchParams.get('supervisor') || 'all'
    const academicYear = searchParams.get('academicYear') || 'all'
    const yearOfStudy = searchParams.get('yearOfStudy') || 'all'
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    console.log(' Filter params:', { status, type, supervisor, academicYear, yearOfStudy, startDate, endDate })

    // Build query
    let query = supabase
      .from('supervisions')
      .select(`
        id,
        title,
        type,
        status,
        academic_year,
        teacher_id,
        co_advisor_id,
        students,
        start_date,
        end_date,
        created_at
      `)

   
    if (status !== 'all') {
    
      const statusValue = status.replace(/_/g, '-')
      query = query.eq('status', statusValue)
    }

    if (type !== 'all') {
     
      const typeValue = type === 'pfe' ? 'pfe' : type
      query = query.eq('type', typeValue)
    }

    if (supervisor !== 'all') {
      query = query.eq('teacher_id', supervisor)
    }

    if (academicYear !== 'all') {
      query = query.eq('academic_year', academicYear)
    }

    if (startDate) {
      query = query.gte('start_date', startDate)
    }

    if (endDate) {
      query = query.lte('end_date', endDate)
    }

    const { data: supervisions, error } = await query

    if (error) {
      console.error(' Error fetching advanced statistics:', error)
      console.error(' Query details - Status:', status, 'Type:', type, 'Supervisor:', supervisor)
      return NextResponse.json({ error: 'Failed to fetch statistics', details: error }, { status: 500 })
    }

    let filteredSupervisions = supervisions || []
    
    if (yearOfStudy !== 'all') {
      const { data: studentsData } = await supabase
        .from('students')
        .select('id')
        .eq('level', yearOfStudy)

      const studentIds = (studentsData || []).map(s => s.id)

      filteredSupervisions = filteredSupervisions.filter((s: any) => {
        if (!s.students || !Array.isArray(s.students)) return false
        return s.students.some((sid: string) => studentIds.includes(sid))
      })
    }

    // Calculate statistics
    const stats = {
      total: filteredSupervisions.length || 0,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      bySupervisor: {} as Record<string, number>,
      byYear: {} as Record<string, number>,
      byYearOfStudy: {} as Record<string, number>,
      activeCount: 0,
      completedCount: 0,
      pendingCount: 0,
      defendedCount: 0,
      abandonedCount: 0,
      studentCount: 0,
    }

    filteredSupervisions.forEach((s: any) => {
      // By status
      stats.byStatus[s.status] = (stats.byStatus[s.status] || 0) + 1

      // By type
      stats.byType[s.type] = (stats.byType[s.type] || 0) + 1

      // By supervisor (use teacher_id as key)
      stats.bySupervisor[s.teacher_id] = (stats.bySupervisor[s.teacher_id] || 0) + 1

      // By year
      stats.byYear[s.academic_year] = (stats.byYear[s.academic_year] || 0) + 1

      // Count by specific statuses
      if (s.status === 'active') stats.activeCount++
      if (s.status === 'completed') stats.completedCount++
      if (s.status === 'pending') stats.pendingCount++
      if (s.status === 'defended') stats.defendedCount++
      if (s.status === 'abandoned') stats.abandonedCount++

      // Count unique students
      if (s.students && Array.isArray(s.students)) {
        stats.studentCount += s.students.length
      }
    })

    const response = {
      stats,
      supervisions: filteredSupervisions || [],
      filters: {
        status,
        type,
        supervisor,
        academicYear,
        yearOfStudy,
        startDate,
        endDate,
      },
    }
    
    console.log(' API response:', { statsTotal: stats.total, supervisionCount: filteredSupervisions.length })
    return NextResponse.json(response)
  } catch (error) {
    console.error(' Error in advanced statistics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
