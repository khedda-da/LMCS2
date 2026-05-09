import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(' Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Supabase configuration missing', users: [] },
        { status: 200 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {},
        },
      }
    )
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, first_name, last_name, role, requested_role, is_approved, created_at, is_active, deleted_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('  Error fetching users:', error)
      return NextResponse.json({ error: error.message, users: [] }, { status: 200 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(' Unexpected error fetching users:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to fetch users', users: [], details: errorMessage },
      { status: 200 }
    )
  }
}
