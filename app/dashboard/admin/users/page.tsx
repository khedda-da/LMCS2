'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import DashboardNav from '@/components/dashboard/dashboard-nav'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/providers'
import { toast } from 'sonner'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()

  const t = {
    userManagement: language === 'fr' ? 'Gestion des Utilisateurs' : 'User Management',
    manageUsers: language === 'fr' ? 'Gerez les utilisateurs du systeme et leurs roles' : 'Manage system users and their roles',
    profile: language === 'fr' ? 'Profil' : 'Profile',
    name: language === 'fr' ? 'Nom' : 'Name',
    email: language === 'fr' ? 'Email' : 'Email',
    role: language === 'fr' ? 'Role' : 'Role',
    department: language === 'fr' ? 'Departement' : 'Department',
    phone: language === 'fr' ? 'Telephone' : 'Phone',
    joined: language === 'fr' ? 'Inscrit' : 'Joined',
    actions: language === 'fr' ? 'Actions' : 'Actions',
    view: language === 'fr' ? 'Voir' : 'View',
    delete: language === 'fr' ? 'Supprimer' : 'Delete',
    noUsers: language === 'fr' ? 'Aucun utilisateur trouve' : 'No users found',
    userSummary: language === 'fr' ? 'Resume des Utilisateurs' : 'User Summary',
    overviewByRole: language === 'fr' ? 'Apercu des utilisateurs par role' : 'Overview of users by role',
    totalUsers: language === 'fr' ? 'Total Utilisateurs' : 'Total Users',
    admins: language === 'fr' ? 'Administrateurs' : 'Admins',
    directors: language === 'fr' ? 'Directeurs' : 'Directors',
    supervisors: language === 'fr' ? 'Encadrants' : 'Supervisors',
    confirmDelete: language === 'fr' ? 'Etes-vous sur de vouloir supprimer ce compte? Cette action est irreversible.' : 'Are you sure you want to delete this account? This action cannot be undone.',
    na: language === 'fr' ? 'N/A' : 'N/A',
    admin: language === 'fr' ? 'administrateur' : 'admin',
    director: language === 'fr' ? 'directeur' : 'director',
    supervisor: language === 'fr' ? 'encadrant' : 'supervisor',
    user: language === 'fr' ? 'utilisateur' : 'user',
  }

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userProfile) {
        setUserRole(userProfile.role)

        if (userProfile.role !== 'admin' && userProfile.role !== 'director') {
          router.push('/dashboard')
          return
        }
      }

      // Load users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(usersData || [])
      setLoading(false)
    }

    loadData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav user={user} userRole={userRole} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'director':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'supervisor':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return t.admin
      case 'director':
        return t.director
      case 'supervisor':
        return t.supervisor
      default:
        return t.user
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t.confirmDelete)) {
      return
    }

    setDeleting(userId)
    
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Delete failed with status ${response.status}`)
      }

      // Remove from local state
      setUsers(users.filter(u => u.id !== userId))
      setError(null)
      toast.success('User deleted successfully')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete user'
      setError(errorMsg)
      toast.error(errorMsg)
      console.error('[v0] Delete user error:', err)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} userRole={userRole} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t.userManagement}</h1>
          <p className="text-muted-foreground mt-2">{t.manageUsers}</p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {users.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p>{t.noUsers}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">{t.profile}</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">{t.name}</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">{t.email}</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">{t.role}</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">{t.department}</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">{t.phone}</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">{t.joined}</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-muted/50 transition">
                        <td className="px-6 py-3">
                          <Link href={`/dashboard/profile?id=${u.id}`} className="inline-block hover:opacity-80 transition">
                            <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all rounded-full overflow-hidden">
                              {u.profile_picture_url && <AvatarImage src={u.profile_picture_url} alt={u.full_name} className="rounded-full object-cover" />}
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full">
                                {u.full_name?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-sm font-medium">{u.full_name || t.na}</td>
                        <td className="px-6 py-3 text-sm">{u.email}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm">{u.department || t.na}</td>
                        <td className="px-6 py-3 text-sm">{u.phone || t.na}</td>
                        <td className="px-6 py-3 text-sm">
                          {new Date(u.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                        </td>
                        <td className="px-6 py-3 text-sm flex gap-2">
                          <Link href={`/dashboard/profile?id=${u.id}`}>
                            <Button variant="outline" size="sm" className="gap-2" disabled={deleting === u.id}>
                              {t.view}
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </Link>
                          <Button 
                            onClick={() => handleDeleteUser(u.id)} 
                            variant="destructive" 
                            size="sm"
                            disabled={deleting === u.id}
                          >
                            {deleting === u.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t.delete}
                              </>
                            ) : (
                              t.delete
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t.userSummary}</CardTitle>
            <CardDescription>{t.overviewByRole}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t.totalUsers}</p>
                <p className="text-2xl font-bold text-primary">{users.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.admins}</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.directors}</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'director').length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.supervisors}</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'supervisor').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
