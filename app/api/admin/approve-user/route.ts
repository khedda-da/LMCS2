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

    return NextResponse.json({ success: true, message: 'User approved successfully' })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
