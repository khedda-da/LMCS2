import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, updates } = body

    if (!userId || !updates) {
      return NextResponse.json({ error: 'User ID and updates are required' }, { status: 400 })
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Create admin client using service role key to bypass RLS
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

    // Only allow updating specific fields
    const allowedFields = ['full_name', 'first_name', 'last_name', 'role', 'is_approved', 'department', 'phone', 'bio', 'research_interests']
    const sanitizedUpdates: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        sanitizedUpdates[key] = value
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Add updated_at timestamp
    sanitizedUpdates.updated_at = new Date().toISOString()

    // Update the user
    const { data, error } = await supabase
      .from('users')
      .update(sanitizedUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('  Error updating user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data, success: true })
  } catch (error) {
    console.error(' Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
