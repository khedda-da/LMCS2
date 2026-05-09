import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('  Auth error in password change:', authError)
      return NextResponse.json(
        { error: 'Unauthorized. Please log in again.' },
        { status: 401 }
      )
    }

    const { oldPassword, newPassword } = await request.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Old password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (oldPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from old password' },
        { status: 400 }
      )
    }

    
    const userEmail = user.email
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: oldPassword,
    })

    if (signInError) {
      console.error('  Old password verification failed:', signInError)
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error(' Error updating password:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password' },
        { status: 500 }
      )
    }

    try {
      const saltRounds = 10
      const passwordHash = await bcrypt.hash(newPassword, saltRounds)
      
      const { error: dbError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', user.id)

      if (dbError) {
        console.error(' Warning: Failed to store password hash in database:', dbError)
      } else {
        console.log('Password hash stored in database for user:', user.id)
      }
    } catch (hashError) {
      console.error('  Error hashing password:', hashError)
    }

    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'UPDATE',
        entity_type: 'user',
        entity_id: user.id,
        changes: {
          field: 'password',
          old_value: '***',
          new_value: '***'
        },
      })
      .catch(err => console.error('  Error logging password change:', err))

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error(' Unexpected error in password change:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
