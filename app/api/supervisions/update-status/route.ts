import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit-logger'
import { createNotificationsForUsers, createNotification } from '@/lib/real-notifications'

export async function PATCH(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const { supervisionId, status } = body

    if (!supervisionId || !status) {
      return NextResponse.json({ error: 'Supervision ID and status are required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['active', 'pending', 'completed', 'on_hold', 'cancelled', 'defended', 'abandoned']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

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

    // Get current user
    const { createClient } = await import('@/lib/supabase/server')
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get original supervision for comparison
    const { data: originalSupervision, error: fetchError } = await supabase
      .from('supervisions')
      .select('*, student:students(full_name)')
      .eq('id', supervisionId)
      .single()

    if (fetchError || !originalSupervision) {
      return NextResponse.json({ error: 'Supervision not found' }, { status: 404 })
    }

    const oldStatus = originalSupervision.status

    // Update supervision status
    const { error: updateError } = await supabase
      .from('supervisions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', supervisionId)

    if (updateError) {
      console.error('[v0] Error updating supervision status:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'UPDATE_STATUS',
      entityType: 'supervision',
      entityId: supervisionId,
      details: `Changed supervision status from ${oldStatus} to ${status}`,
      changes: {
        old_status: oldStatus,
        new_status: status,
        supervision_title: originalSupervision.title,
      },
    })

    // Notify relevant users about status change
    const notifyUsers: string[] = []
    if (originalSupervision.teacher_id) notifyUsers.push(originalSupervision.teacher_id)
    if (originalSupervision.co_advisor_id) notifyUsers.push(originalSupervision.co_advisor_id)
    
    // Remove the current user from notification list (they made the change)
    const filteredNotifyUsers = notifyUsers.filter(id => id !== user.id)

    const statusLabels: Record<string, string> = {
      active: 'Active',
      pending: 'Pending',
      completed: 'Completed',
      on_hold: 'On Hold',
      cancelled: 'Cancelled',
      defended: 'Defended',
      abandoned: 'Abandoned',
    }

    if (filteredNotifyUsers.length > 0) {
      await createNotificationsForUsers(
        filteredNotifyUsers,
        'Supervision Status Updated',
        `The supervision "${originalSupervision.title}" status has been changed from ${statusLabels[oldStatus] || oldStatus} to ${statusLabels[status] || status}`,
        'info',
        `/dashboard/supervisions/${supervisionId}`,
        'supervision',
        supervisionId
      )
    }

    // Also notify all admins and directors
    const { data: adminUsers } = await supabase
      .from('users')
      .select('id')
      .in('role', ['admin', 'director'])

    if (adminUsers && adminUsers.length > 0) {
      const adminUserIds = adminUsers.map(u => u.id).filter(id => id !== user.id)
      if (adminUserIds.length > 0) {
        await createNotificationsForUsers(
          adminUserIds,
          'Supervision Status Update',
          `Supervision "${originalSupervision.title}" status changed to ${statusLabels[status] || status}`,
          'info',
          `/dashboard/supervisions/${supervisionId}`,
          'supervision',
          supervisionId
        )
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Status updated successfully',
      oldStatus,
      newStatus: status
    })
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to update supervision status' }, { status: 500 })
  }
}
