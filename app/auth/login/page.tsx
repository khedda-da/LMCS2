'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/components/providers'
import { useTranslation } from '@/lib/i18n'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const { language } = useLanguage()
  const { t } = useTranslation(language)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError

      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_approved, role, requested_role')
          .eq('id', authData.user.id)
          .single()

        if (userError) throw userError

        if (!userData.is_approved) {
          setError(language === 'fr' 
            ? 'Votre compte n\'est pas encore approuve. Veuillez contacter l\'administrateur.'
            : 'Your account is not yet approved. Please contact the administrator.')
          await supabase.auth.signOut()
          return
        }

        // Redirect based on role
        if (userData.role === 'admin') {
          router.push('/dashboard/admin')
        } else if (userData.role === 'supervisor') {
          router.push('/dashboard/supervisor')
        } else if (userData.role === 'director') {
          router.push('/dashboard/director')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          setError(language === 'fr' 
            ? 'Email ou mot de passe incorrect'
            : 'Invalid email or password')
        } else {
          setError(error.message)
        }
      } else {
        setError(language === 'fr' ? 'Une erreur est survenue' : 'An error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center gap-3 mb-12 group">
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-md">
                <Image
                  src="/lmcs-logo.png"
                  alt="LMCS"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-2xl font-bold text-primary">LMCS</span>
            </Link>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {language === 'fr' ? 'Bienvenue' : 'Welcome back'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              {language === 'fr'
                ? 'Connectez-vous pour acceder a votre espace de gestion des encadrements academiques.'
                : 'Sign in to access your academic supervision management dashboard.'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile back button */}
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {language === 'fr' ? 'Retour' : 'Back'}
          </Link>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-2 text-center pb-6">
              <div className="flex justify-center mb-2 lg:hidden">
                <div className="w-14 h-14 rounded-full overflow-hidden shadow-md">
                  <Image
                    src="/lmcs-logo.png"
                    alt="LMCS Logo"
                    width={56}
                    height={56}
                    className="w-full h-full object-cover rounded-full"
                    priority
                  />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {t('signIn')}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {language === 'fr' 
                  ? 'Entrez vos identifiants pour acceder a votre compte'
                  : 'Enter your credentials to access your account'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t('email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t('password')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    {language === 'fr' ? 'Se souvenir de moi' : 'Remember me'}
                  </Label>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-xl font-semibold" 
                  disabled={isLoading}
                >
                  {isLoading ? (language === 'fr' ? 'Connexion...' : 'Signing in...') : t('signIn')}
                </Button>

                <div className="pt-4 text-center text-sm text-muted-foreground">
                  <p>
                    {language === 'fr' 
                      ? 'Vous n\'avez pas de compte? Contactez votre administrateur.'
                      : 'Don\'t have an account? Contact your administrator.'}
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
