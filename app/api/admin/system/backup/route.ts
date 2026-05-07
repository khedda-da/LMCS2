import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all data from critical tables
    const tables = ['users', 'students', 'supervisions', 'documents', 'notifications', 'audit_logs']
    const backup: any = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    }

    for (const table of tables) {
      const { data } = await supabase.from(table).select('*')
      backup.data[table] = data || []
    }

    // Log backup action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'SYSTEM_BACKUP',
      entity_type: 'SYSTEM',
      entity_id: 'database',
      details: `Database backup created with ${Object.values(backup.data).flat().length} records`,
      status: 'success'
    })

    return NextResponse.json({
      success: true,
      message: 'Database backup created successfully',
      backup: backup,
      recordCount: Object.values(backup.data).flat().length
    })
  } catch (error: any) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { error: 'Failed to create backup', details: error.message },
      { status: 500 }
    )
  }
}
