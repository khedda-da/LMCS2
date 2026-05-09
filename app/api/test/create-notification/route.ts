import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createNotification } from '@/lib/real-notifications'

/**
 * Test endpoint to create sample notifications
 * GET /api/test/create-notification?userId=<USER_ID>&role=<admin|director|supervisor>
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role') || 'supervisor'

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 })
    }

    const { data: userExists } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const notifications = [
      {
        title: 'Welcome to LMCS',
        message: `Welcome to the LMCS Supervision System. You have been set up as a ${role}.`,
        type: 'success',
      },
      {
        title: 'New Supervision Assignment',
        message: 'You have been assigned to a new supervision. Please review the details and accept or decline.',
        type: 'info',
      },
      {
        title: 'Supervision Status Update',
        message: 'A supervision you are involved with has been updated to "Active" status.',
        type: 'update',
      },
      {
        title: 'Document Review Needed',
        message: 'A new document has been uploaded and requires your review.',
        type: 'warning',
      },
    ]

    let createdCount = 0
    for (const notification of notifications) {
      const success = await createNotification({
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type as any,
      })
      if (success) createdCount++
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdCount} test notifications for user ${userId}`,
      notificationsCreated: createdCount,
      role,
    })
  } catch (error) {
    console.error(' Test notification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}
