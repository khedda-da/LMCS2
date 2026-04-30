import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total supervisions count
    const { count: totalSupervisions } = await supabase
      .from('supervisions')
      .select('*', { count: 'exact' })

    // Get supervisions by status
    const { data: statusData } = await supabase
      .from('supervisions')
      .select('status', { count: 'exact' })

    const statusCounts = {
      active: statusData?.filter((s: any) => s.status === 'active').length || 0,
      completed: statusData?.filter((s: any) => s.status === 'completed').length || 0,
      pending: statusData?.filter((s: any) => s.status === 'pending').length || 0,
    }

    // Get average progress
    const { data: progressData } = await supabase
      .from('supervisions')
      .select('progress_percentage')

    const avgProgress = progressData?.length
      ? Math.round(progressData.reduce((acc: number, s: any) => acc + (s.progress_percentage || 0), 0) / progressData.length)
      : 0

    return NextResponse.json({
      total: totalSupervisions || 0,
      byStatus: statusCounts,
      averageProgress: avgProgress,
    })
  } catch (error) {
    console.error('[v0] Supervision statistics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
