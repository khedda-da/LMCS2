import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createNotificationsForUsers } from '@/lib/real-notifications'
import { logAuditEvent } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[v0] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
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

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current admin user from request headers
    const authHeader = request.headers.get('authorization')
    let adminUserId: string | null = null
    let adminEmail: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(token)
      if (currentUser) {
        adminUserId = currentUser.id
        adminEmail = currentUser.email || null
      }
    }

    // If we can't get from auth, try getting from session
    if (!adminUserId) {
      console.log('[v0] Using service role for delete operation')
    }
    
    // Get user info before deleting for notification
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, email, role')
      .eq('id', userId)
      .single()

    // Delete user from users table
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteUserError) {
      console.error('[v0] Delete user error:', deleteUserError)
      return NextResponse.json(
        { error: deleteUserError.message },
        { status: 500 }
      )
    }

    console.log('[v0] User deleted from database:', userId)

    // Try to delete user from auth as well
    try {
      await supabase.auth.admin.deleteUser(userId)
    } catch (authError) {
      console.log('[v0] Auth deletion warning:', authError)
      // Continue - user data is already deleted from database
    }

    // Notify all admins about user deletion (not directors)
    const { data: notifyUsers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    if (notifyUsers && notifyUsers.length > 0 && userData) {
      await createNotificationsForUsers(
        notifyUsers.map(u => u.id),
        'User Deleted',
        `${userData.role} account deleted: ${userData.full_name} (${userData.email})`,
        'warning'
      )
    }

    // Log the deletion in background (fire and forget) so it doesn't block the response
    const auditUserId = adminUserId || 'system'
    const auditUserEmail = adminEmail || 'system'
    
    logAuditEvent({
      userId: auditUserId,
      userEmail: auditUserEmail,
      action: 'DELETE',
      entityType: 'USER',
      entityId: userId,
      changes: {
        deleted_user: userData?.email,
        deleted_role: userData?.role,
        deleted_name: userData?.full_name,
      },
      details: `Deleted user: ${userData?.full_name} (${userData?.email})`,
    }).catch(err => console.error('[v0] Background audit log failed:', err))

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('[v0] Delete user error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    )
  }
}
