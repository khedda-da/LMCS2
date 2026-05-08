import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[v0] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Supabase configuration missing', users: [] },
        { status: 200 }
      )
    }

    // Create admin client using service role key to bypass RLS
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
    
    // Fetch all users using service role (bypasses RLS)
    // Filter out soft-deleted users (where deleted_at is not null)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, first_name, last_name, role, requested_role, is_approved, created_at, is_active, deleted_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching users:', error)
      return NextResponse.json({ error: error.message, users: [] }, { status: 200 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Unexpected error fetching users:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to fetch users', users: [], details: errorMessage },
      { status: 200 }
    )
  }
}
