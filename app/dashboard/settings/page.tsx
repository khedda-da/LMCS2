'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LogOut, Bell, Lock, Moon, Sun, Globe } from 'lucide-react'
import { useTheme, useLanguage } from '@/components/providers'
import { useTranslation, type Language } from '@/lib/i18n'
import Link from 'next/link'

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation(language)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
      }
      
      setLoading(false)
    }

    getUser()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {language === 'fr' ? 'Parametres' : 'Settings'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'fr' ? 'Gerez votre compte et vos preferences' : 'Manage your account and preferences'}
        </p>
      </div>

      {message && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          {message}
        </div>
      )}

      {!user && (
        <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            {language === 'fr' 
              ? 'Connectez-vous pour acceder aux parametres.' 
              : 'Sign in to your account to access settings.'}
          </p>
        </Card>
      )}

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            {language === 'fr' ? 'Notifications' : 'Notifications'}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">
                {language === 'fr' ? 'Notifications par email' : 'Email Notifications'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'fr' 
                  ? 'Recevez des mises a jour sur vos encadrements' 
                  : 'Receive updates about your supervisions'}
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
        </div>
      </Card>

      {/* Theme Preferences */}
      {mounted && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sun className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              {language === 'fr' ? 'Preferences de Theme' : 'Theme Preferences'}
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'fr' 
                ? 'Choisissez votre theme prefere pour l\'application' 
                : 'Choose your preferred theme for the application'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  theme === 'light'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Sun className="w-4 h-4" />
                {language === 'fr' ? 'Mode Clair' : 'Light Mode'}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Moon className="w-4 h-4" />
                {language === 'fr' ? 'Mode Sombre' : 'Dark Mode'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Language Preferences */}
      {mounted && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              {language === 'fr' ? 'Preferences de Langue' : 'Language Preferences'}
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'fr' 
                ? 'Choisissez votre langue preferee pour l\'application' 
                : 'Choose your preferred language for the application'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  language === 'en'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  language === 'fr'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                Francais
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Security */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            {language === 'fr' ? 'Securite' : 'Security'}
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {language === 'fr' 
              ? 'Gerez votre mot de passe et les parametres de securite de votre compte.' 
              : 'Manage your password and account security settings.'}
          </p>
          <Link href="/dashboard/profile/settings">
            <Button variant="outline">
              <Lock className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Changer le Mot de Passe' : 'Change Password'}
            </Button>
          </Link>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 dark:border-red-800"> 
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-foreground mb-2">
              {language === 'fr' ? 'Deconnexion' : 'Logout'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'fr' ? 'Se deconnecter de ce compte' : 'Sign out from this account'}
            </p>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Deconnexion' : 'Logout'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
