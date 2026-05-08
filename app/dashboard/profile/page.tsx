'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/providers'
import { Upload, Mail, User, Loader2, Lock, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  full_name: string
  first_name: string
  last_name: string
  role: string
  additional_roles?: string[]
  requested_role?: string
  profile_picture_url?: string
  phone?: string
  address?: string
  bio?: string
  department?: string
  specialization?: string
  is_approved?: boolean
}



export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { language } = useLanguage()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isViewingOtherProfile, setIsViewingOtherProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('')

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      loadingProfile: { en: 'Loading your profile...', fr: 'Chargement de votre profil...' },
      profileNotFound: { en: 'Profile Not Found', fr: 'Profil Non Trouve' },
      unableToLoad: { en: 'Unable to load your profile information', fr: 'Impossible de charger vos informations de profil' },
      backToDashboard: { en: 'Back to Dashboard', fr: 'Retour au Tableau de Bord' },
      pendingApproval: { en: 'Pending Approval', fr: 'En Attente d\'Approbation' },
      availableRoles: { en: 'Available Roles:', fr: 'Roles Disponibles:' },
      personalInfo: { en: 'Personal Information', fr: 'Informations Personnelles' },
      statistics: { en: 'Statistics', fr: 'Statistiques' },
      security: { en: 'Security', fr: 'Securite' },
      yourRolesDashboard: { en: 'Your Roles Dashboard', fr: 'Tableau de Bord de vos Roles' },
      firstName: { en: 'First Name', fr: 'Prenom' },
      lastName: { en: 'Last Name', fr: 'Nom' },
      email: { en: 'Email', fr: 'Email' },
      phone: { en: 'Phone', fr: 'Telephone' },
      department: { en: 'Department', fr: 'Departement' },
      specialization: { en: 'Specialization', fr: 'Specialisation' },
      address: { en: 'Address', fr: 'Adresse' },
      bio: { en: 'Bio', fr: 'Biographie' },
      notProvided: { en: 'Not provided', fr: 'Non fourni' },
    }
    return translations[key]?.[language] || key
  }

  useEffect(() => {
    loadProfile()
  }, [searchParams])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/auth/login')
        return
      }

      // Store current user info
      setCurrentUser(user)

      // Get current user's role for permission checks
      const { data: currentUserData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (currentUserData) {
        setUserRole(currentUserData.role)
      }

      // Check if viewing another user's profile
      const userId = searchParams.get('id')
      const isViewingOther = userId && userId !== user.id

      if (isViewingOther) {
        // Check if current user has permission to view other profiles
        if (!currentUserData || !['admin', 'director'].includes(currentUserData.role)) {
          toast.error('You do not have permission to view other profiles')
          setIsViewingOtherProfile(false)
          setLoading(false)
          return
        }
        setIsViewingOtherProfile(true)
      }

      // Load the requested profile
      const profileId = isViewingOther ? userId : user.id
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', profileId)
        .single()

      if (profileError) {
        toast.error('Failed to load profile')
        return
      }

      setProfile(profileData)
      if (profileData.profile_picture_url) {
        setProfilePhotoPreview(profileData.profile_picture_url)
      }
    } catch (error) {
      console.error('[v0] Error loading profile:', error)
      toast.error('Error loading profile')
    } finally {
      setLoading(false)
    }
  }



  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload photo')
      }

      const { photoUrl } = await response.json()

      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: photoUrl })
        .eq('id', profile?.id)

      if (updateError) throw updateError

      setProfile(prev => prev ? { ...prev, profile_picture_url: photoUrl } : null)
      toast.success('Profile photo updated successfully')
    } catch (error) {
      console.error('[v0] Error uploading photo:', error)
      toast.error('Failed to upload photo')
      setProfilePhotoPreview(profile?.profile_picture_url || '')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">{t('loadingProfile')}</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('profileNotFound')}</CardTitle>
            <CardDescription>{t('unableToLoad')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')}>{t('backToDashboard')}</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button for Viewing Other Profiles */}
        {isViewingOtherProfile && (
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'fr' ? 'Retour' : 'Back'}
          </Button>
        )}

        {/* Header with Profile Photo */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
            {/* Profile Photo Section */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                {profilePhotoPreview ? (
                  <Image
                    src={profilePhotoPreview}
                    alt={profile.full_name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>

              {!isViewingOtherProfile && (
                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4 animate-slide-up">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  {profile.full_name}
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-blue-600 dark:text-blue-400 font-semibold text-lg capitalize">
                    {profile.role}
                  </p>
                  {!profile.is_approved && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                      {t('pendingApproval')}
                    </Badge>
                  )}
                </div>
              </div>

              {profile.additional_roles && profile.additional_roles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('availableRoles')}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium capitalize">
                      {profile.role}
                    </span>
                    {profile.additional_roles.map((additionalRole) => (
                      <span key={additionalRole} className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium capitalize">
                        {additionalRole}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="truncate">{profile.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Tabs */}
        <Tabs defaultValue="info" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <TabsList className="w-full rounded-none border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-0">
            <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              {t('personalInfo')}
            </TabsTrigger>
            <TabsTrigger value="statistics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              {t('statistics')}
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              <Lock className="w-4 h-4 mr-2" />
              {t('security')}
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="info" className="p-6 space-y-6 animate-fade-in">
            {profile.additional_roles && profile.additional_roles.length > 0 && (
              <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Your Roles Dashboard</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[profile.role, ...(profile.additional_roles || [])].map((role) => (
                    <RoleCard key={role} role={role} userId={profile.id} />
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">First Name</label>
                <Input
                  value={profile.first_name}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
                <Input
                  value={profile.last_name}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <Input
                  value={profile.email}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Role</label>
                <Input
                  value={profile.role}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 capitalize"
                />
              </div>
            </div>

            <Button 
              onClick={() => router.push('/dashboard/profile/settings')}
              className="btn-primary rounded-lg"
            >
              Edit Profile
            </Button>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="p-6 animate-fade-in">
            <ProfileStatistics userId={profile.id} role={profile.role} />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="p-6 space-y-6 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Security Settings</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Manage your password and account security
                  </p>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  To change your password or manage other security settings, go to your Profile Settings page.
                </p>
                <Button 
                  onClick={() => router.push('/dashboard/profile/settings')}
                  className="btn-primary rounded-lg"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Go to Security Settings
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Other Settings</h4>
              <Button 
                onClick={() => router.push('/dashboard/settings')}
                variant="outline"
                className="rounded-lg"
              >
                Go to Full Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Role Card Component
function RoleCard({ role, userId }: { role: string; userId: string }) {
  const [roleStats, setRoleStats] = useState<Record<string, string | number> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoleStats()
  }, [role, userId])

  const loadRoleStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/profile/role-statistics?userId=${userId}&role=${role}`)
      if (!response.ok) throw new Error('Failed to load role statistics')
      const data = await response.json()
      setRoleStats(data)
    } catch (error) {
      console.error('[v0] Error loading role statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    'admin': { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
    'supervisor': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    'director': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  }

  const colors = roleColors[role] || roleColors['supervisor']

  return (
    <Card className={`${colors.bg} border ${colors.border} card-hover`}>
      <CardHeader className="pb-3">
        <CardTitle className={`capitalize text-lg ${colors.text}`}>{role} Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : roleStats ? (
          <div className="space-y-3">
            {Object.entries(roleStats).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center text-sm">
                <span className="text-slate-700 dark:text-slate-300 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className={`font-semibold ${colors.text}`}>
                  {typeof value === 'number' ? value : String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No data available</p>
        )}
      </CardContent>
    </Card>
  )
}

// Statistics Component
function ProfileStatistics({ userId, role }: { userId: string; role: string }) {
  const [stats, setStats] = useState<Record<string, string | number> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [userId, role])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/profile/statistics?userId=${userId}&role=${role}`)
      if (!response.ok) throw new Error('Failed to load statistics')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('[v0] Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">No statistics available</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {Object.entries(stats).map(([key, value]) => (
        <Card key={key} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 card-hover animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
              {key.replace(/_/g, ' ')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {typeof value === 'number' ? value : String(value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
