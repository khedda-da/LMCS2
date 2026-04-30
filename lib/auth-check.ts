import { createClient } from '@/lib/supabase/client'

export async function checkUserRole(expectedRole: 'admin' | 'supervisor' | 'director'): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, is_approved')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return false
    }

    // Check if user is approved and has the expected role
    return userData.is_approved && userData.role === expectedRole
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

export async function checkUserApproved(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_approved')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return false
    }

    return userData.is_approved
  } catch (error) {
    console.error('Error checking user approval:', error)
    return false
  }
}

export async function getCurrentUserRole(): Promise<string | null> {
  const supabase = createClient()
  
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return null
    }

    return userData.role
  } catch (error) {
    console.error('Error getting current user role:', error)
    return null
  }
}
