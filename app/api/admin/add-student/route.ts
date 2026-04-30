import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, full_name, first_name, last_name, registration_number, program, level, academic_year } = body

    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      )
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

    // Check if user with this email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[v0] Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing user' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Generate a UUID for the new user
    const userId = crypto.randomUUID()

    // Create user in users table (using service role bypasses RLS)
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email,
          full_name,
          first_name: first_name || full_name.split(' ')[0] || '',
          last_name: last_name || full_name.split(' ').slice(1).join(' ') || '',
          role: 'student',
          requested_role: 'student',
          is_approved: true, // Admin-created students are pre-approved
          is_active: true,
        },
      ])

    if (userError) {
      console.error('[v0] Error creating user:', userError)
      return NextResponse.json(
        { error: userError.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create student record
    const { error: studentError } = await supabase
      .from('students')
      .insert([
        {
          user_id: userId,
          registration_number: registration_number || null,
          program: program || null,
          level: level || null,
          academic_year: academic_year || new Date().getFullYear().toString(),
        },
      ])

    if (studentError) {
      console.error('[v0] Error creating student record:', studentError)
      // Try to clean up the user if student creation fails
      await supabase.from('users').delete().eq('id', userId)
      
      return NextResponse.json(
        { error: studentError.message || 'Failed to create student record' },
        { status: 500 }
      )
    }

    console.log('[v0] Student created successfully:', email)

    return NextResponse.json({
      success: true,
      message: 'Student created successfully',
      user: {
        id: userId,
        email,
        full_name,
        role: 'student',
      },
    })
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
