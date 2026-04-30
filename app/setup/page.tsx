'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Loader2, CheckCircle2, AlertCircle, Lock, Sun, Moon, Globe } from 'lucide-react'
import { useTheme, useLanguage } from '@/components/providers'

export default function SetupPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [setupAllowed, setSetupAllowed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    setupKey: ''
  })

  // Translations
  const text = {
    setupKey:       language === 'fr' ? 'Cle de configuration'        : 'Setup Key',
    setupKeyHint:   language === 'fr' ? 'Entrez la cle secrete pour autoriser cette action' : 'Enter the secret setup key to authorize this action',
    fullName:       language === 'fr' ? 'Nom complet'                 : 'Full Name',
    email:          language === 'fr' ? 'Email'                       : 'Email',
    password:       language === 'fr' ? 'Mot de passe'                : 'Password',
    passwordHint:   language === 'fr' ? 'Minimum 8 caracteres'        : 'Minimum 8 characters',
    confirmPwd:     language === 'fr' ? 'Confirmer le mot de passe'   : 'Confirm Password',
    confirmPwdHint: language === 'fr' ? 'Repetez votre mot de passe'  : 'Confirm your password',
    creating:       language === 'fr' ? 'Creation du compte...'       : 'Creating Account...',
    createBtn:      language === 'fr' ? 'Creer le compte administrateur' : 'Create Administrator Account',
    note:           language === 'fr'
      ? 'Cette page deviendra automatiquement inaccessible une fois qu\'un administrateur est cree.'
      : 'This setup page will automatically become inaccessible once an administrator account is created.',
    title:          language === 'fr' ? 'Configuration Initiale'      : 'Initial Setup',
    subtitle:       language === 'fr'
      ? 'Creez le premier compte administrateur pour LMCS Laboratory'
      : 'Create the first administrator account for LMCS Laboratory',
    notAvailableTitle: language === 'fr' ? 'Configuration Indisponible' : 'Setup Not Available',
    notAvailableDesc:  language === 'fr'
      ? 'Un compte administrateur existe deja. Cette page n\'est plus accessible.'
      : 'An administrator account already exists. This setup page is no longer accessible.',
    goToLogin:      language === 'fr' ? 'Aller a la connexion'        : 'Go to Login',
    successTitle:   language === 'fr' ? 'Configuration Terminee !'    : 'Setup Complete!',
    successDesc:    language === 'fr'
      ? 'Votre compte administrateur a ete cree. Redirection vers la connexion...'
      : 'Your administrator account has been created successfully. Redirecting to login...',
  }

  // Secret setup key - change this in production or use env variable
  const SETUP_KEY = process.env.NEXT_PUBLIC_SETUP_KEY || 'LMCS-INIT-2026'

  useEffect(() => {
    checkIfSetupAllowed()
  }, [])

  const checkIfSetupAllowed = async () => {
    try {
      const supabase = createClient()
      
      // Check if any admin or director exists
      const { data: admins, error } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'director'])
        .limit(1)

      if (error) {
        console.error('Error checking admins:', error)
        setSetupAllowed(false)
      } else {
        // Setup is only allowed if NO admin/director exists
        setSetupAllowed(!admins || admins.length === 0)
      }
    } catch (err) {
      console.error('Setup check failed:', err)
      setSetupAllowed(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    // Validate setup key
    if (formData.setupKey !== SETUP_KEY) {
      setError(language === 'fr' ? 'Cle de configuration invalide' : 'Invalid setup key')
      setSubmitting(false)
      return
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(language === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match')
      setSubmitting(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError(language === 'fr' ? 'Le mot de passe doit contenir au moins 8 caracteres' : 'Password must be at least 8 characters')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          setupKey: formData.setupKey
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin account')
      }

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // Shared top-right toggle buttons — same pattern as the rest of the site
  const TopBarButtons = () => (
    <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
        className="gap-1.5 rounded-xl h-9 px-3 text-xs font-medium"
      >
        <Globe className="w-3.5 h-3.5" />
        {language === 'en' ? 'FR' : 'EN'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className="rounded-xl h-9 w-9 p-0"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <TopBarButtons />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!setupAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <TopBarButtons />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">{text.notAvailableTitle}</CardTitle>
            <CardDescription>{text.notAvailableDesc}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/auth/login')}>
              {text.goToLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <TopBarButtons />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">{text.successTitle}</CardTitle>
            <CardDescription>{text.successDesc}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <TopBarButtons />
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{text.title}</CardTitle>
          <CardDescription>{text.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="setupKey">{text.setupKey}</Label>
              <Input
                id="setupKey"
                type="password"
                placeholder="••••••••"
                value={formData.setupKey}
                onChange={(e) => setFormData({ ...formData, setupKey: e.target.value })}
                required
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">{text.setupKeyHint}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">{text.fullName}</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{text.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@lmcs.esi.dz"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{text.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder={text.passwordHint}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{text.confirmPwd}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={text.confirmPwdHint}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="h-11 rounded-xl"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {text.creating}
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  {text.createBtn}
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{language === 'fr' ? 'Note :' : 'Note:'}</strong>{' '}
              {text.note}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
