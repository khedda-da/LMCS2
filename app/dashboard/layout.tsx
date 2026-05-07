'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notification-bell'
import { createClient } from '@/lib/supabase/client'
import { useTheme, useLanguage } from '@/components/providers'
import { 
  LogOut, 
  Menu, 
  X, 
  Users, 
  ClipboardList, 
  Settings, 
  FileText,
  PlusCircle,
  TrendingUp,
  Shield,
  FileSpreadsheet,
  User,
  Globe,
  Moon,
  Sun,
  Bell
} from 'lucide-react'

type UserRole = 'admin' | 'supervisor' | 'director'

interface NavItem {
  href: string
  label: string
  labelFr: string
  icon: React.ComponentType<{ size?: number }>
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  director: [
    { href: '/dashboard/director', label: 'Statistics', labelFr: 'Statistiques', icon: TrendingUp },
    { href: '/dashboard/supervisions', label: 'All Supervisions', labelFr: 'Tous les Encadrements', icon: ClipboardList },
    { href: '/dashboard/supervisions/new', label: 'New Supervision', labelFr: 'Nouvel Encadrement', icon: PlusCircle },
    { href: '/dashboard/students', label: 'Students', labelFr: 'Etudiants', icon: Users },
    { href: '/dashboard/students/new', label: 'Add Student', labelFr: 'Ajouter Etudiant', icon: PlusCircle },
    { href: '/dashboard/reports', label: 'Annual Reports', labelFr: 'Bilans Annuels', icon: FileText },
    { href: '/dashboard/export', label: 'Export Data', labelFr: 'Exporter Donnees', icon: FileSpreadsheet },
    { href: '/dashboard/profile', label: 'Profile', labelFr: 'Profil', icon: User },
  ],
  supervisor: [
    { href: '/dashboard/supervisor', label: 'My Supervisions', labelFr: 'Mes Encadrements', icon: ClipboardList },
    { href: '/dashboard/supervisor/statistics', label: 'Statistics', labelFr: 'Statistiques', icon: TrendingUp },
    { href: '/dashboard/profile', label: 'Profile', labelFr: 'Profil', icon: User },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Admin Panel', labelFr: 'Panneau Admin', icon: Shield },
    { href: '/dashboard/admin/users', label: 'User Management', labelFr: 'Gestion Utilisateurs', icon: Users },
    { href: '/dashboard/admin/system', label: 'System Maintenance', labelFr: 'Maintenance Systeme', icon: Settings },
    { href: '/dashboard/settings', label: 'Settings', labelFr: 'Parametres', icon: Settings },
    { href: '/dashboard/profile', label: 'Profile', labelFr: 'Profil', icon: User },
  ],
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole>('supervisor')
  const [userName, setUserName] = useState<string>('')
  const [isApproved, setIsApproved] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      supervisionTracking: { en: 'Supervision Tracking', fr: 'Suivi des Encadrements' },
      systemTitle: { en: 'LMCS Supervision System', fr: 'Systeme de Suivi des Encadrements LMCS' },
      signOut: { en: 'Sign Out', fr: 'Se Deconnecter' },
      accountPending: { en: 'Account Pending Approval', fr: 'Compte en Attente d\'Approbation' },
      accountPendingDesc: { en: 'Your account is pending approval by an administrator. You will be notified once approved.', fr: 'Votre compte est en attente d\'approbation par un administrateur. Vous recevrez une notification une fois approuve.' },
      administrator: { en: 'Administrator', fr: 'Administrateur' },
      supervisor: { en: 'Supervisor', fr: 'Encadrant' },
      director: { en: 'Director', fr: 'Directeur' },
    }
    return translations[key]?.[language] || key
  }

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        setCurrentUser(user)

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, full_name, is_approved')
          .eq('id', user.id)
          .single()

        if (userError || !userData) {
          router.push('/auth/login')
          return
        }

        setUserRole(userData.role as UserRole)
        setUserName(userData.full_name || user.email || '')
        setIsApproved(userData.is_approved)
        setLoading(false)
      } catch (error) {
        console.error('Error loading user:', error)
        router.push('/auth/login')
      }
    }

    loadUser()
  }, [router])

  useEffect(() => {
    const onProfileUpdated = (e: any) => {
      const data = e.detail
      if (data?.full_name) setUserName(data.full_name)
    }

    window.addEventListener('profile-updated', onProfileUpdated)
    return () => window.removeEventListener('profile-updated', onProfileUpdated)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'fr' : 'en'
    setLanguage(newLang)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto">
            <Bell className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('accountPending')}
          </h1>
          <p className="text-muted-foreground">
            {t('accountPendingDesc')}
          </p>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            {t('signOut')}
          </Button>
        </div>
      </div>
    )
  }

  const navItems = roleNavItems[userRole] || roleNavItems.supervisor

  const getRoleLabel = () => {
    const labels: Record<UserRole, string> = {
      admin: t('administrator'),
      supervisor: t('supervisor'),
      director: t('director'),
    }
    return labels[userRole] || userRole
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-0 z-50 border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
              <Image
                src="/lmcs-logo.png"
                alt="LMCS Logo"
                width={32}
                height={32}
                className="h-full w-full object-cover rounded-full"
              />
            </div>
            <span className="font-bold text-primary">LMCS</span>
          </Link>
          <div className="flex items-center gap-2">
            {currentUser && (
              <NotificationBell userId={currentUser.id} language={language} />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="h-9 w-9"
            >
              <Globe className="w-4 h-4" />
            </Button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-accent rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="border-t border-border bg-card">
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <p className="font-medium text-sm text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 border-l-4 ${
                      isActive
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-transparent text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{language === 'fr' ? item.labelFr : item.label}</span>
                  </div>
                </Link>
              )
            })}
            <div className="px-4 py-3 border-t border-border">
              <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut size={20} className="mr-3" />
                {t('signOut')}
              </Button>
            </div>
          </div>
        )}
      </nav>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card sticky top-0 h-screen">
          <div className="p-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                <Image
                  src="/lmcs-logo.png"
                  alt="LMCS Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover rounded-full"
                />
              </div>
              <div>
                <h2 className="font-bold text-lg text-primary">LMCS</h2>
                <p className="text-xs text-muted-foreground">{t('supervisionTracking')}</p>
              </div>
            </Link>
          </div>

          {/* User Info */}
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="font-medium text-sm text-foreground truncate">{userName}</p>
            <p className="text-xs text-primary font-medium">{getRoleLabel()}</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{language === 'fr' ? item.labelFr : item.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-border">
            <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut size={20} className="mr-3" />
              {t('signOut')}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="hidden md:flex items-center justify-between p-6 border-b border-border bg-card sticky top-0 z-40">
            <h1 className="text-2xl font-bold text-foreground">
              {t('systemTitle')}
            </h1>
            <div className="flex items-center gap-2">
              {currentUser && (
                <NotificationBell userId={currentUser.id} language={language} />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="gap-2"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="gap-2"
              >
                <Globe className="w-4 h-4" />
                {language === 'en' ? 'FR' : 'EN'}
              </Button>
            </div>
          </div>

          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
