import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { supervisionId, supervisorIds } = body

    if (!supervisionId || !supervisorIds || !Array.isArray(supervisorIds)) {
      return NextResponse.json(
        { error: 'Invalid request: supervisionId and supervisorIds array required' },
        { status: 400 }
      )
    }

    const { data: supervision, error: fetchError } = await supabase
      .from('supervisions')
      .select('supervisors')
      .eq('id', supervisionId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Supervision not found' }, { status: 404 })
    }

    const existingSupervisors = supervision?.supervisors || []
    const updatedSupervisors = Array.from(new Set([...existingSupervisors, ...supervisorIds]))

    const { data: updated, error: updateError } = await supabase
      .from('supervisions')
      .update({ supervisors: updatedSupervisors })
      .eq('id', supervisionId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ 
      success: true, 
      supervision: updated,
      message: `${supervisorIds.length} supervisor(s) assigned successfully`
    })
  } catch (error) {
    console.error(' Supervisor assignment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Assignment failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { supervisionId, supervisorId } = body

    if (!supervisionId || !supervisorId) {
      return NextResponse.json(
        { error: 'Invalid request: supervisionId and supervisorId required' },
        { status: 400 }
      )
    }

    const { data: supervision, error: fetchError } = await supabase
      .from('supervisions')
      .select('supervisors')
      .eq('id', supervisionId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Supervision not found' }, { status: 404 })
    }

    const updatedSupervisors = (supervision?.supervisors || []).filter(
      (id: string) => id !== supervisorId
    )

    const { data: updated, error: updateError } = await supabase
      .from('supervisions')
      .update({ supervisors: updatedSupervisors })
      .eq('id', supervisionId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ 
      success: true, 
      supervision: updated,
      message: 'Supervisor removed from supervision'
    })
  } catch (error) {
    console.error(' Supervisor removal error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Removal failed' },
      { status: 500 }
    )
  }
}
