import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logAuditEvent } from '@/lib/audit-logger'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authError?.message 
      }, { status: 401 })
    }

    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        userRole: userData?.role 
      }, { status: 403 })
    }

    // Create service client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }, { status: 500 })
    }

    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    // Test 1: Check audit_logs table
    const { data: auditLogs, error: auditError, count: auditCount } = await serviceSupabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5)

    // Test 2: Check users table
    const { data: users, error: usersError, count: usersCount } = await serviceSupabase
      .from('users')
      .select('*', { count: 'exact' })

    // Test 3: Try creating an audit log
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'SYSTEM_TEST',
      entityType: 'DEBUG',
      details: 'System test run - checking audit logs functionality',
    })

    // Test 4: Fetch the log we just created
    const { data: newLogs, error: newLogsError } = await serviceSupabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'SYSTEM_TEST')
      .order('created_at', { ascending: false })
      .limit(1)

    return NextResponse.json({
      success: true,
      tests: {
        auth: {
          authenticated: !!user,
          userId: user.id,
          userEmail: user.email,
        },
        auditLogs: {
          error: auditError?.message,
          count: auditCount,
          latestLogs: auditLogs?.slice(0, 3) || [],
        },
        users: {
          error: usersError?.message,
          count: usersCount,
        },
        auditLogCreation: {
          created: newLogs && newLogs.length > 0,
          error: newLogsError?.message,
          sample: newLogs?.[0] || null,
        },
        environment: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
