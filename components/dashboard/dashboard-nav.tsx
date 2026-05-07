'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Moon, Sun, Globe } from 'lucide-react'
import { useTheme, useLanguage } from '@/components/providers'

export default function DashboardNav({
  user,
  userRole,
}: {
  user: any
  userRole: string | null
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en')
  }


  const adminItems = [
    { label: language === 'fr' ? 'Panneau Admin' : 'Admin Panel', href: '/dashboard/admin' },
    { label: language === 'fr' ? 'Utilisateurs' : 'Users', href: '/dashboard/admin/users' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity duration-300">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-full shadow-md overflow-hidden flex-shrink-0">
              <Image
                src="/lmcs-logo.png"
                alt="LMCS Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:inline">LMCS</span>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" size="sm">
                  {item.label}
                </Button>
              </Link>
            ))}
            {userRole === 'admin' && (
              <>
                <div className="w-px h-6 bg-border mx-2" />
                {adminItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" size="sm">
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="gap-1"
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'FR' : 'EN'}
            </Button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-foreground">{user?.email?.split('@')[0]}</div>
                  <div className="text-xs text-muted-foreground capitalize">{userRole || 'user'}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                  {user?.email?.[0].toUpperCase()}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border">
                  <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-foreground hover:bg-muted">
                    {language === 'fr' ? 'Parametres du Profil' : 'Profile Settings'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    {language === 'fr' ? 'Deconnexion' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
