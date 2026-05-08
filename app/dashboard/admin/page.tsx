'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, Users, AlertCircle, Search, Shield, Database, RefreshCw, Edit, UserPlus, Settings } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useLanguage } from '@/components/providers'

interface User {
  id: string
  email: string
  full_name: string
  requested_role: string
  is_approved: boolean
  role: string | null
  created_at: string
}

interface Supervision {
  id: string
  title: string
  type: string
  status: string
  teacher_id: string
  student_id: string | null
  academic_year: string
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [supervisions, setSupervisions] = useState<Supervision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false)
  const [newUserData, setNewUserData] = useState({ 
    email: '', 
    password: '', 
    full_name: '', 
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    specialization: '',
    address: '',
    role: 'supervisor' 
  })
  const [creatingUser, setCreatingUser] = useState(false)
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null)
  const router = useRouter()
  const adminRouter = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      systemAdministration: { en: 'System Administration', fr: 'Administration Systeme' },
      manageUsersAndSystem: { en: 'Manage user accounts, validate data, and maintain the system', fr: 'Gerez les comptes, validez les donnees et maintenez le systeme' },
      adminOptions: { en: 'Admin Options', fr: 'Options Admin' },
      manageUsers: { en: 'Manage Users', fr: 'Gerer Utilisateurs' },
      systemMaintenance: { en: 'System Maintenance', fr: 'Maintenance Systeme' },
      viewSystemHealth: { en: 'Monitor database health, create backups, and run maintenance tasks', fr: 'Surveiller la sante de la base de donnees, creer des sauvegardes et executer des taches de maintenance' },
      totalUsers: { en: 'Total Users', fr: 'Total Utilisateurs' },
      pendingApproval: { en: 'Pending', fr: 'En Attente' },
      approvedUsers: { en: 'Approved', fr: 'Approuves' },
      totalSupervisions: { en: 'Supervisions', fr: 'Encadrements' },
      userManagement: { en: 'User Management', fr: 'Gestion Utilisateurs' },
      dataValidation: { en: 'Data Validation', fr: 'Validation Donnees' },
      searchUsers: { en: 'Search users...', fr: 'Rechercher utilisateurs...' },
      filterByRole: { en: 'Filter by role', fr: 'Filtrer par role' },
      allRoles: { en: 'All Roles', fr: 'Tous les roles' },
      name: { en: 'Name', fr: 'Nom' },
      email: { en: 'Email', fr: 'Email' },
      role: { en: 'Role', fr: 'Role' },
      status: { en: 'Status', fr: 'Statut' },
      actions: { en: 'Actions', fr: 'Actions' },
      approve: { en: 'Approve', fr: 'Approuver' },
      reject: { en: 'Reject', fr: 'Rejeter' },
      edit: { en: 'Edit', fr: 'Modifier' },
      approved: { en: 'Approved', fr: 'Approuve' },
      pending: { en: 'Pending', fr: 'En attente' },
      noUsers: { en: 'No users found', fr: 'Aucun utilisateur trouve' },
      supervisor: { en: 'Supervisor', fr: 'Encadrant' },
      director: { en: 'Director', fr: 'Directeur' },
      admin: { en: 'Admin', fr: 'Admin' },
      recentSupervisions: { en: 'Recent Supervisions', fr: 'Encadrements Recents' },
      validateData: { en: 'Review and validate supervision data', fr: 'Verifiez et validez les donnees d\'encadrement' },
      noSupervisions: { en: 'No supervisions to validate', fr: 'Aucun encadrement a valider' },
      refreshData: { en: 'Refresh', fr: 'Actualiser' },
      createUser: { en: 'Create User', fr: 'Creer Utilisateur' },
      createNewUser: { en: 'Create New User', fr: 'Creer Nouvel Utilisateur' },
      fullName: { en: 'Full Name', fr: 'Nom Complet' },
      password: { en: 'Password', fr: 'Mot de passe' },
      selectRole: { en: 'Select Role', fr: 'Selectionner Role' },
      creating: { en: 'Creating...', fr: 'Creation...' },
      userCreated: { en: 'User created successfully', fr: 'Utilisateur cree avec succes' },
      cancel: { en: 'Cancel', fr: 'Annuler' },
      save: { en: 'Save', fr: 'Enregistrer' },
      editUser: { en: 'Edit User', fr: 'Modifier Utilisateur' },
      editUserDesc: { en: 'Update user information', fr: 'Mettre a jour les informations utilisateur' },
      dismiss: { en: 'Dismiss', fr: 'Fermer' },
      firstName: { en: 'First Name', fr: 'Prenom' },
      lastName: { en: 'Last Name', fr: 'Nom' },
      phone: { en: 'Phone', fr: 'Telephone' },
      department: { en: 'Department', fr: 'Departement' },
      specialization: { en: 'Specialization', fr: 'Specialite' },
      address: { en: 'Address', fr: 'Adresse' },
    }
    return translations[key]?.[language] || key
  }

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, is_approved')
          .eq('id', user.id)
          .single()

        if (userError || !userData?.is_approved || userData?.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        await fetchData()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [supabase, router])

  const fetchData = async () => {
    try {
      const usersResponse = await fetch('/api/admin/users')
      if (usersResponse.ok) {
        const { users: usersData } = await usersResponse.json()
        setUsers(usersData || [])
      }

      // Fetch supervisions (exclude soft-deleted)
      const { data: supervisionsData } = await supabase
        .from('supervisions')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)

      setSupervisions(supervisionsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    }
  }

  const handleApproveUser = async (userId: string, requestedRole: string) => {
    setProcessingId(userId)
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: requestedRole })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to approve user')
      }

      setUsers(users.map(u => u.id === userId ? { ...u, is_approved: true, role: requestedRole } : u))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectUser = async (userId: string) => {
    setProcessingId(userId)
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reject user')
      }

      setUsers(users.filter(u => u.id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject user')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setProcessingId(userId)
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      setUsers(users.filter(u => u.id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setProcessingId(null)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    setProcessingId(editingUser.id)
    try {
      const response = await fetch('/api/admin/edit-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          full_name: editingUser.full_name,
          email: editingUser.email,
          role: editingUser.role,
          is_approved: editingUser.is_approved
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u))
      setEditDialogOpen(false)
      setEditingUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.first_name || !newUserData.last_name) {
      setError(language === 'fr' ? 'Le prenom, nom, email et mot de passe sont requis' : 'First name, last name, email and password are required')
      return
    }

    setCreatingUser(true)
    setError(null)
    setCreateUserSuccess(null)

    const full_name = `${newUserData.first_name} ${newUserData.last_name}`.trim()

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUserData, full_name })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create user')
      }

      const { user } = await response.json()
      
      setUsers([...users, {
        ...user,
        is_approved: true,
        requested_role: user.role,
        created_at: new Date().toISOString()
      }])

      setCreateUserSuccess(t('userCreated'))
      setNewUserData({ 
        email: '', 
        password: '', 
        full_name: '', 
        first_name: '',
        last_name: '',
        phone: '',
        department: '',
        specialization: '',
        address: '',
        role: 'supervisor' 
      })
      
      setTimeout(() => {
        setCreateUserDialogOpen(false)
        setCreateUserSuccess(null)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const pendingUsers = users.filter(u => !u.is_approved)
  const approvedUsers = users.filter(u => u.is_approved)

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter || u.requested_role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleColors: Record<string, string> = {
    supervisor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    director: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('systemAdministration')}</h1>
        <p className="text-gray-600 mt-2">{t('manageUsersAndSystem')}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {t('refreshData')}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="pt-6 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-600">{error}</p>
              <Button size="sm" variant="outline" onClick={() => setError(null)} className="mt-2">
                {t('dismiss')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalUsers')}</p>
                    <p className="text-3xl font-bold">{users.length}</p>
                  </div>
                  <Users className="w-10 h-10 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('approvedUsers')}</p>
                    <p className="text-3xl font-bold text-green-600">{approvedUsers.length}</p>
                  </div>
                  <CheckCircle2 className="w-10 h-10 text-green-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalSupervisions')}</p>
                    <p className="text-3xl font-bold">{supervisions.length}</p>
                  </div>
                  <Database className="w-10 h-10 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                {t('userManagement')}
              </TabsTrigger>
            </TabsList>

            {/* User Management Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('userManagement')}</CardTitle>
                    <CardDescription>
                      {pendingUsers.length > 0 
                        ? `${pendingUsers.length} ${language === 'fr' ? 'utilisateurs en attente d\'approbation' : 'users pending approval'}`
                        : language === 'fr' ? 'Tous les utilisateurs sont approuves' : 'All users are approved'}
                    </CardDescription>
                  </div>

                  {/* Create User Dialog */}
                  <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        {t('createUser')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="flex flex-col max-h-[90vh]">
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle>{t('createNewUser')}</DialogTitle>
                        <DialogDescription>
                          {language === 'fr' 
                            ? 'Creez un nouveau compte utilisateur avec email et mot de passe'
                            : 'Create a new user account with email and password'}
                        </DialogDescription>
                      </DialogHeader>

                      {/* Scrollable fields area */}
                      <div className="flex-1 overflow-y-auto pr-1 space-y-3 py-2 min-h-0">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="new-first-name">{t('firstName')}</Label>
                            <Input
                              id="new-first-name"
                              placeholder="John"
                              value={newUserData.first_name}
                              onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="new-last-name">{t('lastName')}</Label>
                            <Input
                              id="new-last-name"
                              placeholder="Doe"
                              value={newUserData.last_name}
                              onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="new-email">{t('email')}</Label>
                          <Input
                            id="new-email"
                            type="email"
                            placeholder="user@example.com"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="new-password">{t('password')}</Label>
                          <Input
                            id="new-password"
                            type="password"
                            placeholder="********"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="new-phone">{t('phone')}</Label>
                            <Input
                              id="new-phone"
                              type="tel"
                              placeholder="+1234567890"
                              value={newUserData.phone}
                              onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="new-department">{t('department')}</Label>
                            <Input
                              id="new-department"
                              placeholder="e.g., Computer Science"
                              value={newUserData.department}
                              onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="new-specialization">{t('specialization')}</Label>
                          <Input
                            id="new-specialization"
                            placeholder="e.g., AI/Machine Learning"
                            value={newUserData.specialization}
                            onChange={(e) => setNewUserData({ ...newUserData, specialization: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="new-address">{t('address')}</Label>
                          <Input
                            id="new-address"
                            placeholder="123 Main St..."
                            value={newUserData.address}
                            onChange={(e) => setNewUserData({ ...newUserData, address: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="new-role">{t('role')}</Label>
                          <Select 
                            value={newUserData.role} 
                            onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectRole')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="supervisor">{t('supervisor')}</SelectItem>
                              <SelectItem value="director">{t('director')}</SelectItem>
                              <SelectItem value="admin">{t('admin')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {createUserSuccess && (
                          <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex gap-2 items-center">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <p className="text-sm text-green-600">{createUserSuccess}</p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons — always visible, pinned at bottom */}
                      <div className="flex-shrink-0 flex gap-2 justify-end pt-3 border-t mt-1">
                        <Button variant="outline" onClick={() => setCreateUserDialogOpen(false)}>
                          {t('cancel')}
                        </Button>
                        <Button onClick={handleCreateUser} disabled={creatingUser}>
                          {creatingUser ? t('creating') : t('createUser')}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={t('searchUsers')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('filterByRole')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('allRoles')}</SelectItem>
                        <SelectItem value="supervisor">{t('supervisor')}</SelectItem>
                        <SelectItem value="director">{t('director')}</SelectItem>
                        <SelectItem value="admin">{t('admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">{t('name')}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">{t('email')}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">{t('role')}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">{t('status')}</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                              {t('noUsers')}
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-muted/50">
                              <td className="px-4 py-3 text-sm font-medium">{user.full_name}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                              <td className="px-4 py-3">
                                <Badge className={roleColors[user.role || user.requested_role] || 'bg-gray-100'}>
                                  {user.role || user.requested_role}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {user.is_approved ? (
                                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                    {t('approved')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                    {t('pending')}
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  {!user.is_approved ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveUser(user.id, user.requested_role)}
                                        disabled={processingId === user.id}
                                      >
                                        {t('approve')}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleRejectUser(user.id)}
                                        disabled={processingId === user.id}
                                      >
                                        {t('reject')}
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingUser(user)
                                        setEditDialogOpen(true)
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit User Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('editUser')}</DialogTitle>
                <DialogDescription>{t('editUserDesc')}</DialogDescription>
              </DialogHeader>
              {editingUser && (
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>{t('fullName')}</Label>
                    <Input
                      value={editingUser.full_name}
                      onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('email')}</Label>
                    <Input
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('role')}</Label>
                    <Select
                      value={editingUser.role || ''}
                      onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supervisor">{t('supervisor')}</SelectItem>
                        <SelectItem value="director">{t('director')}</SelectItem>
                        <SelectItem value="admin">{t('admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button onClick={handleEditUser} disabled={processingId === editingUser.id}>
                      {t('save')}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
