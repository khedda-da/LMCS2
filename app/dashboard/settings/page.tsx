'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LogOut, User, Bell, Lock, Moon, Sun, Globe, Loader2 } from 'lucide-react'
import { useTheme, useLanguage } from '@/components/providers'
import { useTranslation, type Language } from '@/lib/i18n'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'

interface PasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  })
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [updatingPassword, setUpdatingPassword] = useState(false)
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
        setFormData({
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
        })
      }
      
      setLoading(false)
    }

    getUser()
  }, [supabase, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      // Update auth user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        },
      })

      if (error) throw error

      // Also update application users table so server-side and other components show the new name
      try {
        const { data: userRow, error: dbError } = await supabase
          .from('users')
          .update({ full_name: formData.full_name, phone: formData.phone })
          .eq('id', user.id)
        if (dbError) {
          console.error('Failed to update users table:', dbError)
        }
      } catch (e) {
        console.error('Users table update exception:', e)
      }

      // Notify other parts of the app and refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: { full_name: formData.full_name } }))
      }

      try {
        router.refresh()
      } catch (e) {
        if (typeof window !== 'undefined') window.location.reload()
      }

      setMessage(language === 'fr' ? 'Profil mis a jour avec succes!' : 'Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(error.message || (language === 'fr' ? 'Echec de la mise a jour du profil' : 'Failed to update profile'))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage(language === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill in all password fields')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage(language === 'fr' ? 'Les nouveaux mots de passe ne correspondent pas' : 'New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage(language === 'fr' ? 'Le mot de passe doit contenir au moins 8 caracteres' : 'Password must be at least 8 characters long')
      return
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      setMessage(language === 'fr' ? 'Le nouveau mot de passe doit etre different de l\'ancien' : 'New password must be different from old password')
      return
    }

    try {
      setUpdatingPassword(true)
      setMessage('')

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
        throw new Error(data.error || (language === 'fr' ? 'Echec du changement de mot de passe' : 'Failed to change password'))
      }

      setMessage(language === 'fr' ? 'Mot de passe change avec succes!' : 'Password changed successfully!')
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(error.message || (language === 'fr' ? 'Echec du changement de mot de passe' : 'Failed to change password'))
    } finally {
      setUpdatingPassword(false)
    }
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
              ? 'Connectez-vous pour acceder aux parametres du profil.' 
              : 'Sign in to your account to access profile settings and preferences.'}
          </p>
        </Card>
      )}

      {/* Profile Information */}
      {user && (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            {language === 'fr' ? 'Informations du Profil' : 'Profile Information'}
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === 'fr' ? 'Email' : 'Email'}
            </label>
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'fr' ? 'L\'email ne peut pas etre modifie' : 'Email cannot be changed'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === 'fr' ? 'Nom Complet' : 'Full Name'}
            </label>
            <Input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder={language === 'fr' ? 'Entrez votre nom complet' : 'Enter your full name'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === 'fr' ? 'Telephone' : 'Phone Number'}
            </label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder={language === 'fr' ? 'Entrez votre numero' : 'Enter your phone number'}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving 
              ? (language === 'fr' ? 'Enregistrement...' : 'Saving...') 
              : (language === 'fr' ? 'Enregistrer' : 'Save Changes')}
          </Button>
        </form>
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

      {/* Password Change */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            {language === 'fr' ? 'Changer le Mot de Passe' : 'Change Password'}
          </h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="oldPassword">
                {language === 'fr' ? 'Mot de Passe Actuel' : 'Current Password'}
              </FieldLabel>
              <Input
                id="oldPassword"
                name="oldPassword"
                type="password"
                value={passwordForm.oldPassword}
                onChange={handlePasswordInputChange}
                placeholder={language === 'fr' ? 'Entrez votre mot de passe actuel' : 'Enter your current password'}
                required
              />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="newPassword">
                {language === 'fr' ? 'Nouveau Mot de Passe' : 'New Password'}
              </FieldLabel>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordInputChange}
                placeholder={language === 'fr' ? 'Entrez votre nouveau mot de passe (min 8 caracteres)' : 'Enter your new password (min 8 characters)'}
                required
              />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="confirmPassword">
                {language === 'fr' ? 'Confirmer le Nouveau Mot de Passe' : 'Confirm New Password'}
              </FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordInputChange}
                placeholder={language === 'fr' ? 'Confirmez votre nouveau mot de passe' : 'Confirm your new password'}
                required
              />
            </Field>
          </FieldGroup>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'fr' ? 'Mise a jour...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {language === 'fr' ? 'Changer le Mot de Passe' : 'Change Password'}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })}
              disabled={updatingPassword}
            >
              {language === 'fr' ? 'Effacer' : 'Clear'}
            </Button>
          </div>
        </form>
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
