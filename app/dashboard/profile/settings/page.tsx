'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'

interface UserProfile {
  id: string
  email: string
  full_name: string
  first_name: string
  last_name: string
  phone?: string
  address?: string
  bio?: string
  department?: string
  specialization?: string
}

interface PasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfileSettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [updatingPassword, setUpdatingPassword] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        toast.error('Failed to load profile')
        return
      }

      setProfile(profileData)
      setFormData(profileData)
    } catch (error) {
      console.error('[v0] Error loading profile:', error)
      toast.error('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

const handleSave = async () => {
  if (!profile) return

  // Add validation
  if (!formData.first_name || !formData.last_name) {
    toast.error('First name and last name are required')
    return
  }

  try {
    setSaving(true)

    const updateData: UserProfile = {
      ...profile,
      first_name: formData.first_name?.trim() || profile.first_name,
      last_name: formData.last_name?.trim() || profile.last_name,
      full_name: `${formData.first_name?.trim()} ${formData.last_name?.trim()}`,
      phone: formData.phone?.trim() || null,
      address: formData.address?.trim() || null,
      bio: formData.bio?.trim() || null,
      department: formData.department?.trim() || null,
      specialization: formData.specialization?.trim() || null,
    }

    console.log('Updating profile with:', updateData) // Debug log

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', profile.id)

    if (error) {
      console.error('Update error:', error)
      throw error
    }

    // Update both profile and formData with the complete updated data
    setProfile(updateData)
    setFormData(updateData)
    toast.success('Profile updated successfully!')
  } catch (error) {
    console.error('[v0] Error saving profile:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to save profile changes')
  } finally {
    setSaving(false)
  }
}

const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validation
  if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    toast.error('Please fill in all password fields')
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error('New passwords do not match')
    return
  }

  if (passwordForm.newPassword.length < 8) {
    toast.error('New password must be at least 8 characters long')
    return
  }

  if (passwordForm.oldPassword === passwordForm.newPassword) {
    toast.error('New password must be different from old password')
    return
  }

  try {
    setUpdatingPassword(true)

    const response = await fetch('/api/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to change password')
    }

    // Clear the form
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    
    // Show success with more detail
    toast.success('Password changed successfully! Your new password is now active.')
    
    // Optional: Show a confirmation dialog
    setTimeout(() => {
      toast.info('Please use your new password on your next login.')
    }, 500)
    
  } catch (error) {
    console.error('[v0] Error changing password:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to change password')
  } finally {
    setUpdatingPassword(false)
  }
}

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
            <p className="text-slate-600 dark:text-slate-400">Update your personal information</p>
          </div>
        </div>

        {/* Profile Settings Form */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Edit your profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="first_name">First Name</FieldLabel>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email (Read-only)</FieldLabel>
                  <Input
                    id="email"
                    value={formData.email || ''}
                    readOnly
                    className="bg-slate-50 dark:bg-slate-900 cursor-not-allowed"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="department">Department</FieldLabel>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="specialization">Specialization</FieldLabel>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., AI/Machine Learning"
                  />
                </Field>
              </FieldGroup>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Input
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="bio">Bio</FieldLabel>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows={5}
                />
              </Field>
            </FieldGroup>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary rounded-lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setFormData(profile || {})}
                disabled={saving}
                className="rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Section */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="oldPassword">Current Password</FieldLabel>
                  <Input
                    id="oldPassword"
                    name="oldPassword"
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter your current password"
                    required
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter your new password (min 8 characters)"
                    required
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirm your new password"
                    required
                  />
                </Field>
              </FieldGroup>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={updatingPassword}
                  className="btn-primary rounded-lg"
                >
                  {updatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })}
                  disabled={updatingPassword}
                  className="rounded-lg"
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
