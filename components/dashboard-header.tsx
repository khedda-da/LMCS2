'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, X, BarChart3, BookOpen, User, Settings, Globe, Moon, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useLanguage, useTheme } from '@/components/providers'

interface DashboardHeaderProps {
  userRole: 'admin' | 'supervisor' | 'director'
}

export default function DashboardHeader({ userRole }: DashboardHeaderProps) {
  const [userName, setUserName] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || '')
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, profile_picture_url')
          .eq('id', user.id)
          .single()

        if (userData?.full_name) {
          setUserName(userData.full_name)
        }
        if (userData?.profile_picture_url) {
          setProfilePhotoUrl(userData.profile_picture_url)
        }
      }
    }

    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, Record<string, string>> = {
      admin: { en: 'System Administrator', fr: 'Administrateur Systeme' },
      supervisor: { en: 'Supervisor/Researcher', fr: 'Superviseur/Chercheur' },
      director: { en: 'Laboratory Director', fr: 'Directeur de Laboratoire' },
    }
    return labels[role]?.[language] || labels[role]?.en || role
  }

  const getNavItems = () => {
    switch (userRole) {
      case 'admin':
        return []
      case 'supervisor':
        return [
          { label: 'My Supervisions', href: '/dashboard/supervisor', icon: BookOpen },
        ]
      case 'director':
        return [
          { label: 'Statistics', href: '/dashboard/director', icon: BarChart3 },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <Link href={`/dashboard/${userRole}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-300">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full shadow-md overflow-hidden flex-shrink-0">
              <Image
                src="/lmcs-logo.png"
                alt="LMCS Logo"
                width={44}
                height={44}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">LMCS Laboratory</h1>
              <p className="text-xs text-muted-foreground">{getRoleLabel(userRole)}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User menu and logout */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'FR'}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem 
                    onClick={() => setLanguage('en')}
                    className={language === 'en' ? 'bg-muted' : ''}
                  >
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLanguage('fr')}
                    className={language === 'fr' ? 'bg-muted' : ''}
                  >
                    Francais
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Sun className="w-4 h-4 text-yellow-400" />
                )}
              </button>
            )}
            
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{userName || userEmail}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel(userRole)}</p>
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 hover:bg-muted rounded-full transition-colors duration-300">
                  <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
                    {profilePhotoUrl && <AvatarImage src={profilePhotoUrl} alt={userName} />}
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
                <DropdownMenuLabel className="px-4 py-2">
                  <p className="text-sm font-semibold text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="cursor-pointer">
                    <User className="w-4 h-4 mr-3" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile/settings" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-3" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-md"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-border/50 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}
