import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createNotificationsForUsers } from '@/lib/real-notifications'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    // Get all admins and directors
    const { data: admins } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .in('role', ['admin', 'director'])

    if (!admins || admins.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No admins or directors found',
      })
    }

    const adminIds = admins.filter(u => u.role === 'admin').map(u => u.id)
    const directorIds = admins.filter(u => u.role === 'director').map(u => u.id)

    // Send test notifications to admins
    if (adminIds.length > 0) {
      await createNotificationsForUsers(
        adminIds,
        'Test Admin Notification',
        'This is a test notification for admin users. Audit logs and user management events should appear here.',
        'info',
        '/dashboard/admin'
      )
    }

    // Send test notifications to directors
    if (directorIds.length > 0) {
      await createNotificationsForUsers(
        directorIds,
        'Test Director Notification',
        'This is a test notification for director users. Supervision updates and status changes should appear here.',
        'info',
        '/dashboard/director'
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test notifications sent',
      adminsNotified: adminIds.length,
      directorsNotified: directorIds.length,
      admins: admins.filter(u => u.role === 'admin').map(u => ({ id: u.id, email: u.email })),
      directors: admins.filter(u => u.role === 'director').map(u => ({ id: u.id, email: u.email })),
    })
  } catch (error) {
    console.error('[v0] Error sending test notifications:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
