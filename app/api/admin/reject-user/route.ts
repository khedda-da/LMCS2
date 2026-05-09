import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit-logger'

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
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // First delete from students table if exists
    await supabase
      .from('students')
      .delete()
      .eq('user_id', userId)

    // Delete user from users table
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error(' Error deleting user:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to reject user' },
        { status: 500 }
      )
    }

    console.log(' User rejected and deleted:', userId)

    // Get current admin user and log the action
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (adminUser?.id) {
      await logAuditEvent({
        userId: adminUser.id,
        action: 'REJECT',
        entityType: 'user',
        entityId: userId,
        changes: {
          action: 'deleted',
          reason: 'user_rejected',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'User rejected and removed',
    })
  } catch (error) {
    console.error(' Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
