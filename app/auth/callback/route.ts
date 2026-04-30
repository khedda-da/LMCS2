import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Get base URL
  const baseUrl = request.nextUrl.origin

  // Handle errors
  if (error) {
    console.error('[Auth Callback] Error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(errorDescription || error)}`, baseUrl)
    )
  }

  if (!code) {
    // No code means direct access - redirect to login
    return NextResponse.redirect(new URL('/auth/login', baseUrl))
  }

  try {
    const supabase = await createClient()
    
    // Exchange code for session (for email confirmation)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`, baseUrl)
      )
    }

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.redirect(new URL('/auth/login', baseUrl))
    }

    // Check user profile
    const { data: userData } = await supabase
      .from('users')
      .select('is_approved, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!userData || !userData.is_approved) {
      // User not approved - sign them out and show message
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login?message=not_approved', baseUrl))
    }

    // Redirect based on role
    const roleRoutes: Record<string, string> = {
      'admin': '/dashboard/admin',
      'supervisor': '/dashboard/supervisor',
      'director': '/dashboard/director',
    }

    const redirectUrl = roleRoutes[userData.role] || '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, baseUrl))

  } catch (error) {
    console.error('[Auth Callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/auth/login', baseUrl))
  }
}
