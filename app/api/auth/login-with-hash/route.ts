import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get user from database with password hash
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash, role, status, full_name')
      .eq('email', email)
      .single()

    if (userError || !user) {
      console.log('[v0] User not found:', email)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user has a password hash (from backup restore)
    if (!user.password_hash) {
      console.log('[v0] User has no password hash, must use Supabase Auth')
      return NextResponse.json(
        { error: 'This account does not have a stored password. Please use the standard login method.' },
        { status: 401 }
      )
    }

    // Verify password against hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      console.log('[v0] Password mismatch for user:', email)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create a session token (you could use JWT or a session ID)
    // For now, we'll return user data and let the client establish a session
    console.log('[v0] User authenticated with password hash:', email)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      message: 'Authentication successful. You are now logged in.',
    })
  } catch (error) {
    console.error('[v0] Login with hash error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
