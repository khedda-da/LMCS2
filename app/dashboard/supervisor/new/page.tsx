'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DashboardHeader from '@/components/dashboard-header'
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/components/providers'
import { useTranslation } from '@/lib/i18n'

interface Student {
  id: string
  user_id: string
  full_name: string
  email: string
  registration_number?: string
  program?: string
  level?: string
}

export default function NewSupervisionPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [supervisorId, setSupervisorId] = useState<string>('')
  const { language } = useLanguage()
  const { t } = useTranslation(language)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    student_id: '',
    type: 'master',
    start_date: new Date().toISOString().split('T')[0],
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  })
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const initialize = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        // Check if user is supervisor
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, is_approved')
          .eq('id', user.id)
          .single()

        if (userError || !userData?.is_approved || userData?.role !== 'supervisor') {
          router.push('/dashboard')
          return
        }

        setSupervisorId(user.id)

        // Fetch available students
        const response = await fetch('/api/admin/students')
        if (response.ok) {
          const data = await response.json()
          setStudents(data.students || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    if (!formData.student_id) {
      setError('Please select a student')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/supervisor/supervisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          supervisor_id: supervisorId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create supervision')
      }

      setSuccess('Supervision created successfully!')
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/supervisor')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supervision')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userRole="supervisor" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/dashboard/supervisor" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('backTo')} {t('mySupervisions')}
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{t('createNewSupervision')}</CardTitle>
            <CardDescription>
              {t('assignStudent')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="title">{t('projectTitle')} *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder={language === 'fr' ? 'Entrez le titre du projet de recherche' : 'Enter the research project title'}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    placeholder={language === 'fr' ? 'Breve description du projet' : 'Brief description of the supervision project'}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="student">{t('selectStudent')} *</Label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                    disabled={students.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={students.length === 0 ? t('noStudentsAvailable') : t('chooseStudent')} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} {student.registration_number ? `(${student.registration_number})` : ''} - {student.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {students.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {language === 'fr' ? 'Aucun etudiant disponible. Contactez un administrateur.' : 'No students are currently available. Please contact an administrator.'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">{t('supervisionType')} *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'fr' ? 'Selectionner le type' : 'Select type'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="license">License (L3)</SelectItem>
                        <SelectItem value="master">Master (M2)</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                        <SelectItem value="internship">{language === 'fr' ? 'Stage' : 'Internship'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="start_date">{t('startDate')} *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="academic_year">{t('academicYear')} *</Label>
                  <Input
                    id="academic_year"
                    type="text"
                    placeholder="2024-2025"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Link href="/dashboard/supervisor">
                    <Button type="button" variant="outline">
                      {t('cancel')}
                    </Button>
                  </Link>
                  <Button type="submit" disabled={submitting || !formData.student_id}>
                    {submitting ? t('creating') : t('createSupervision')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
