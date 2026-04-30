import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Secret code is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Check if the code exists and is not used
    const { data: secretCode, error } = await supabase
      .from('secret_codes')
      .select('*')
      .eq('code', code.trim())
      .eq('used', false)
      .single()

    if (error || !secretCode) {
      return NextResponse.json(
        { error: 'Invalid or already used secret code' },
        { status: 400 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Error verifying secret code:', error)
    return NextResponse.json(
      { error: 'Failed to verify secret code' },
      { status: 500 }
    )
  }
}
