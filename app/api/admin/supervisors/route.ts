import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase configuration missing', supervisors: [] }, { status: 200 })
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

    // Fetch users who are supervisors or have supervisor role
    const { data: supervisors, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, department, is_approved')
      .or('role.eq.supervisor,role.eq.director,requested_role.eq.supervisor,requested_role.eq.director')
      .eq('is_approved', true)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching supervisors:', error)
      return NextResponse.json({ error: error.message, supervisors: [] }, { status: 200 })
    }

    return NextResponse.json({ supervisors: supervisors || [] })
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to fetch supervisors', supervisors: [] }, { status: 200 })
  }
}
