import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createNotificationsForUsers } from '@/lib/real-notifications'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all directors
    const { data: directors } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'director')

    if (!directors || directors.length === 0) {
      return NextResponse.json({ notified: 0 })
    }

    // Get all supervisions with recent activity
    const { data: supervisions } = await supabase
      .from('supervisions')
      .select('id, title, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50)

    if (!supervisions || supervisions.length === 0) {
      return NextResponse.json({ notified: 0 })
    }

    // Create notifications for directors about supervisions
    const directorIds = directors.map(d => d.id)
    await createNotificationsForUsers(
      directorIds,
      'Supervision Updates',
      `There are ${supervisions.length} supervisions requiring attention. Latest update: ${supervisions[0]?.title}`,
      'info'
    )

    return NextResponse.json({
      notified: directorIds.length,
      count: supervisions.length
    })
  } catch (error) {
    console.error('[v0] Director supervisions notification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
