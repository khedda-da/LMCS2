import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { expiryDays = 7 } = body

    const supabase = await createClient()

    // Generate a unique code
    const code = `LMCS-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
    
    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    // Insert the code
    const { data, error } = await supabase
      .from('secret_codes')
      .insert([
        {
          code,
          expires_at: expiresAt.toISOString(),
          used: false,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('[v0] Error generating secret code:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to generate code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      code: data.code,
      expiresAt: data.expires_at
    })
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to generate secret code' },
      { status: 500 }
    )
  }
}
