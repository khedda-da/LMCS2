import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit-logger'
import { createNotification } from '@/lib/real-notifications'

export async function POST(request: NextRequest) {
  try {
    // Create admin client using service role key to bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {},
        },
      }
    )

    // Get request body
    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['admin', 'supervisor', 'director', 'student']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get current admin user
    const { data: { user: adminUser } } = await supabase.auth.getUser()

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_approved: true,
        role,
        approval_date: new Date().toISOString(),
        approved_by: adminUser?.id,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[v0] Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Log audit event
    if (adminUser?.id) {
      await logAuditEvent({
        userId: adminUser.id,
        action: 'APPROVE',
        entityType: 'user',
        entityId: userId,
        changes: {
          is_approved: true,
          role,
        },
      })
    }

    // Notify the approved user
    await createNotification({
      userId,
      title: 'Account Approved',
      message: `Your account has been approved with role: ${role}. You can now access the platform.`,
      type: 'success',
      link: '/dashboard',
    })

    // Get the approved user's full name for notification
    const { data: approvedUserData } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    // Notify all admins about the approval (not directors)
    const { data: notifyUsers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    if (notifyUsers && notifyUsers.length > 0) {
      const userFullName = approvedUserData?.full_name || approvedUserData?.email || 'Unknown User'
      await Promise.all(
        notifyUsers.map(user =>
          createNotification({
            userId: user.id,
            title: 'User Account Approved',
            message: `${userFullName} has been approved as ${role}.`,
            type: 'info',
            link: '/dashboard/admin/users',
          })
        )
      )
    }

    return NextResponse.json({ success: true, message: 'User approved successfully' })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
