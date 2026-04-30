'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { useLanguage } from '@/components/providers'

export default function NewStudentPage() {
  const router = useRouter()
  const [supabase, setSupabase] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    registration_number: '',
    level: '1cs',
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const t = {
    back: language === 'fr' ? 'Retour' : 'Back',
    title: language === 'fr' ? 'Ajouter un Nouvel Etudiant' : 'Add New Student',
    subtitle: language === 'fr' ? 'Enregistrer un nouvel etudiant dans le systeme' : 'Register a new student in the system',
    cardTitle: language === 'fr' ? 'Informations de l\'Etudiant' : 'Student Information',
    cardDesc: language === 'fr' ? 'Remplissez les details de l\'etudiant pour l\'enregistrer' : 'Fill in the student details to register them',
    fullName: language === 'fr' ? 'Nom Complet' : 'Full Name',
    fullNamePlaceholder: language === 'fr' ? 'Entrez le nom complet de l\'etudiant' : 'Enter student\'s full name',
    email: language === 'fr' ? 'Email' : 'Email',
    phone: language === 'fr' ? 'Telephone' : 'Phone',
    registrationNumber: language === 'fr' ? 'Numero de Matricule' : 'Registration Number',
    yearOfStudy: language === 'fr' ? 'Annee d\'Etude' : 'Year of Study',
    selectYear: language === 'fr' ? 'Selectionner l\'annee' : 'Select year',
    academicYear: language === 'fr' ? 'Annee Academique' : 'Academic Year',
    adding: language === 'fr' ? 'Ajout en cours...' : 'Adding...',
    addStudent: language === 'fr' ? 'Ajouter Etudiant' : 'Add Student',
    cancel: language === 'fr' ? 'Annuler' : 'Cancel',
    errorRequired: language === 'fr' ? 'Le nom complet et l\'email sont requis' : 'Full name and email are required',
    errorExists: language === 'fr' ? 'Un etudiant avec cet email existe deja' : 'A student with this email already exists',
    successMsg: language === 'fr' ? 'Etudiant ajoute avec succes!' : 'Student added successfully!',
    errorNotReady: language === 'fr' ? 'Application non prete. Veuillez rafraichir la page.' : 'Application not ready. Please refresh the page.',
    // Year levels
    year1cs: '1 CS',
    year2cs: '2 CS', 
    year3cs: '3 CS',
    master: language === 'fr' ? 'Master' : 'Master',
    doctorat: language === 'fr' ? 'Doctorat' : 'Doctorate',
  }

  // Initialize Supabase client and check authorization
  useEffect(() => {
    const client = createClient()
    setSupabase(client)
    
    async function checkAuth() {
      try {
        const { data: { user }, error: authError } = await client.auth.getUser()
        
        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        // Check user role - admin and director can add students
        const { data: userData, error: userError } = await client
          .from('users')
          .select('role, is_approved')
          .eq('id', user.id)
          .single()

        if (userError || !userData?.is_approved) {
          router.push('/dashboard')
          return
        }

        // Admin and director can add students
        if (userData.role !== 'director' && userData.role !== 'admin') {
          router.push('/dashboard')
          return
        }
        
        setPageLoading(false)
      } catch (err) {
        console.error('Auth check failed:', err)
        router.push('/dashboard')
      }
    }
    
    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) {
      setError(t.errorNotReady)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError(t.errorRequired)
      setLoading(false)
      return
    }

    try {
      // Check if email already exists in students table
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (existingStudent) {
        setError(t.errorExists)
        setLoading(false)
        return
      }

      // Insert into students table
      const { error: insertError } = await supabase
        .from('students')
        .insert([
          {
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            registration_number: formData.registration_number || null,
            level: formData.level,
            academic_year: formData.academic_year,
          },
        ])

      if (insertError) {
        throw new Error(insertError.message)
      }

      setSuccess(t.successMsg)

      // Reset form
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        registration_number: '',
        level: '1cs',
        academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      })

      // Redirect after delay
      setTimeout(() => {
        router.push('/dashboard/students')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.cardTitle}</CardTitle>
          <CardDescription>{t.cardDesc}</CardDescription>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="full_name">{t.fullName} *</FieldLabel>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder={t.fullNamePlaceholder}
                  required
                />
              </Field>
            </FieldGroup>

            <div className="grid md:grid-cols-2 gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">{t.email} *</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="student@esi.dz"
                    required
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="phone">{t.phone}</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+213 XXX XXX XXX"
                  />
                </Field>
              </FieldGroup>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="registration_number">{t.registrationNumber}</FieldLabel>
                <Input
                  id="registration_number"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleInputChange}
                  placeholder="e.g., 201931234"
                />
              </Field>
            </FieldGroup>

            <div className="grid md:grid-cols-2 gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="level">{t.yearOfStudy} *</FieldLabel>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectYear} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1cs">{t.year1cs}</SelectItem>
                      <SelectItem value="2cs">{t.year2cs}</SelectItem>
                      <SelectItem value="3cs">{t.year3cs}</SelectItem>
                      <SelectItem value="master">{t.master}</SelectItem>
                      <SelectItem value="doctorat">{t.doctorat}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="academic_year">{t.academicYear} *</FieldLabel>
                  <Input
                    id="academic_year"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleInputChange}
                    placeholder="2024-2025"
                    required
                  />
                </Field>
              </FieldGroup>
            </div>

            <div className="flex gap-3 pt-6 border-t border-border">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.adding}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t.addStudent}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                {t.cancel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
