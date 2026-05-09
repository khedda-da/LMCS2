import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

    // Get table statistics
    const tables = [
      'users',
      'students',
      'supervisions',
      'themes',
      'sessions',
      'documents',
      'notifications',
      'audit_logs'
    ]

    const stats: any = {}
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      stats[table] = count || 0
    }

    
    const { data: sizeData } = await supabase.rpc('get_database_size')

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tables: stats,
      databaseSize: sizeData,
      totalRecords: Object.values(stats).reduce((a: any, b: any) => a + b, 0)
    })
  } catch (error: any) {
    console.error('DB health check error:', error)
    return NextResponse.json(
      { error: 'Failed to check database health', details: error.message },
      { status: 500 }
    )
  }
}
