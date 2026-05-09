import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase configuration missing', students: [] }, { status: 200 })
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

    
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, user_id, registration_number, program, level, academic_year, deleted_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (studentsError) {
      console.error('  Error fetching students:', studentsError)
      return NextResponse.json({ error: studentsError.message, students: [] }, { status: 200 })
    }

    // Get user details for all students
    const userIds = students?.map(s => s.user_id).filter(Boolean) || []
    let usersMap: Record<string, any> = {}

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds)
        .is('deleted_at', null)

      users?.forEach(u => {
        usersMap[u.id] = u
      })
    }

    // Combine student and user data
    const enrichedStudents = students?.map(student => ({
      ...student,
      full_name: usersMap[student.user_id]?.full_name || 'Unknown',
      email: usersMap[student.user_id]?.email || '',
    })) || []

    return NextResponse.json({ students: enrichedStudents })
  } catch (error) {
    console.error(' Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to fetch students', students: [] }, { status: 200 })
  }
}
