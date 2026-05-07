import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[v0] Auth error in password change:', authError)
      return NextResponse.json(
        { error: 'Unauthorized. Please log in again.' },
        { status: 401 }
      )
    }

    // Parse request body
    const { oldPassword, newPassword } = await request.json()

    // Validate inputs
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

    // Verify old password by attempting to refresh the session with the old password
    // In Supabase, we can use signInWithPassword to verify the current password
    const userEmail = user.email
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    // Attempt to verify the old password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: oldPassword,
    })

    if (signInError) {
      console.error('[v0] Old password verification failed:', signInError)
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Update the password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      console.error('[v0] Error updating password:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password' },
        { status: 500 }
      )
    }

    // Log the password change in audit logs
    try {
      const { error: auditError } = await supabase
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
      if (auditError) console.error('[v0] Error logging password change:', auditError)
    } catch (err) {
      console.error('[v0] Exception logging password change:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('[v0] Unexpected error in password change:', error)
    try {
      console.error('[v0] Error stack:', (error as Error)?.stack)
    } catch {}
    return NextResponse.json(
      { error: (error as Error)?.message || String(error) },
      { status: 500 }
    )
  }
}
