'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { useLanguage } from '@/components/providers'

interface Supervisor {
  id: string
  full_name: string
  email: string
}

interface Student {
  id: string
  full_name: string
  email: string
  registration_number: string | null
  level: string | null
}

export default function NewSupervisionPage() {
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [coSupervisors, setCoSupervisors] = useState<Supervisor[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objectives: '',
    type: 'pfe',
    teacher_id: '',
    co_advisor_id: '',
    student_ids: [] as string[],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const t = {
    back: language === 'fr' ? 'Retour' : 'Back',
    title: language === 'fr' ? 'Creer un Nouvel Encadrement' : 'Create New Supervision',
    subtitle: language === 'fr' ? 'Ajouter un nouveau projet d\'encadrement au systeme' : 'Add a new supervision project to the system',
    cardTitle: language === 'fr' ? 'Details de l\'Encadrement' : 'Supervision Details',
    cardDesc: language === 'fr' ? 'Remplissez les details du nouveau projet d\'encadrement' : 'Fill in the details for the new supervision project',
    projectTitle: language === 'fr' ? 'Titre du Projet' : 'Project Title',
    projectTitlePlaceholder: language === 'fr' ? 'Entrez le titre du projet d\'encadrement' : 'Enter supervision project title',
    description: language === 'fr' ? 'Description' : 'Description',
    descriptionPlaceholder: language === 'fr' ? 'Breve description du projet d\'encadrement' : 'Brief description of the supervision project',
    objectives: language === 'fr' ? 'Objectifs' : 'Objectives',
    objectivesPlaceholder: language === 'fr' ? 'Objectifs du projet' : 'Project objectives',
    supervisionType: language === 'fr' ? 'Type d\'Encadrement' : 'Supervision Type',
    selectType: language === 'fr' ? 'Selectionner le type' : 'Select type',
    academicYear: language === 'fr' ? 'Annee Academique' : 'Academic Year',
    assignSupervisor: language === 'fr' ? 'Encadrant Principal' : 'Main Supervisor',
    assignCoSupervisor: language === 'fr' ? 'Co-Encadrant (Optionnel)' : 'Co-Supervisor (Optional)',
    noCoSupervisor: language === 'fr' ? 'Pas de co-encadrant' : 'No co-supervisor',
    selectCoSupervisor: language === 'fr' ? 'Selectionner un co-encadrant' : 'Select co-supervisor',
    noSupervisorsAvailable: language === 'fr' ? 'Aucun encadrant disponible' : 'No supervisors available',
    selectSupervisor: language === 'fr' ? 'Selectionner un encadrant' : 'Select supervisor',
    noApprovedSupervisors: language === 'fr' ? 'Aucun encadrant approuve disponible. Veuillez d\'abord approuver des encadrants.' : 'No approved supervisors available. Please approve supervisors first.',
    assignStudent: language === 'fr' ? 'Affecter un Etudiant' : 'Assign Student',
    noStudentsAvailable: language === 'fr' ? 'Aucun etudiant disponible' : 'No students available',
    selectStudent: language === 'fr' ? 'Selectionner un etudiant' : 'Select student',
    studentRequired: language === 'fr' ? 'Un etudiant doit etre affecte pour creer un encadrement.' : 'A student must be assigned to create a supervision.',
    startDate: language === 'fr' ? 'Date de Debut' : 'Start Date',
    endDate: language === 'fr' ? 'Date de Fin Prevue' : 'Expected End Date',
    creating: language === 'fr' ? 'Creation en cours...' : 'Creating...',
    createSupervision: language === 'fr' ? 'Creer l\'Encadrement' : 'Create Supervision',
    cancel: language === 'fr' ? 'Annuler' : 'Cancel',
    errorRequired: language === 'fr' ? 'Le titre, l\'encadrant et l\'etudiant sont requis' : 'Title, supervisor and student are required',
    successMsg: language === 'fr' ? 'Encadrement cree avec succes!' : 'Supervision created successfully!',
    // Supervision types - French academic system
    pfe: language === 'fr' ? 'PFE Ingenieur' : 'PFE Engineer',
    master: language === 'fr' ? 'Memoire de Master' : 'Master Thesis',
    doctorate: language === 'fr' ? 'These de Doctorat' : 'Doctorate Thesis',
    spe: language === 'fr' ? 'Stage Academique (SPE)' : 'Academic Internship (SPE)',
    research: language === 'fr' ? 'Projet de Recherche' : 'Research Project',
  }

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        // Check user role - admin and director can create supervisions
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, is_approved')
          .eq('id', user.id)
          .single()

        if (userError || !userData?.is_approved) {
          router.push('/dashboard')
          return
        }

        // Admin and director can create supervisions
        if (userData.role !== 'director' && userData.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        // Get all supervisors
        const { data: supervisorsData, error: supError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('role', 'supervisor')
          .eq('is_approved', true)
          .order('full_name', { ascending: true })

        if (supError) throw supError

        // Get all students that are not yet assigned to a supervision
        const { data: studentsData, error: studError } = await supabase
          .from('students')
          .select('id, full_name, email, registration_number, level')
          .order('full_name', { ascending: true })

        if (studError) throw studError

        setSupervisors(supervisorsData || [])
        setCoSupervisors(supervisorsData || [])
        setStudents(studentsData || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    // Validation: title, supervisor AND at least one student are required
    if (!formData.title.trim() || !formData.teacher_id || formData.student_ids.length === 0) {
      setError(t.errorRequired)
      setSubmitting(false)
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('supervisions')
        .insert([
          {
            title: formData.title,
            description: formData.description || null,
            objectives: formData.objectives || null,
            type: formData.type,
            teacher_id: formData.teacher_id,
            co_advisor_id: formData.co_advisor_id && formData.co_advisor_id !== 'none' ? formData.co_advisor_id : null,
            students: formData.student_ids,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            academic_year: formData.academic_year,
            status: 'active',
          },
        ])

      if (insertError) throw insertError

      setSuccess(t.successMsg)

      setTimeout(() => {
        router.push('/dashboard/supervisions')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supervision')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter co-supervisors to exclude the main supervisor
  const availableCoSupervisors = coSupervisors.filter(s => s.id !== formData.teacher_id)

  if (loading) {
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
        <Link href="/dashboard/supervisions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

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
                <FieldLabel htmlFor="title">{t.projectTitle} *</FieldLabel>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={t.projectTitlePlaceholder}
                  required
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="description">{t.description}</FieldLabel>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={t.descriptionPlaceholder}
                  rows={3}
                />
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="objectives">{t.objectives}</FieldLabel>
                <Textarea
                  id="objectives"
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleInputChange}
                  placeholder={t.objectivesPlaceholder}
                  rows={2}
                />
              </Field>
            </FieldGroup>

            <div className="grid md:grid-cols-2 gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel>{t.supervisionType} *</FieldLabel>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pfe">{t.pfe}</SelectItem>
                      <SelectItem value="master">{t.master}</SelectItem>
                      <SelectItem value="doctorate">{t.doctorate}</SelectItem>
                      <SelectItem value="spe">{t.spe}</SelectItem>
                      <SelectItem value="research">{t.research}</SelectItem>
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

            <FieldGroup>
              <Field>
                <FieldLabel>{t.assignSupervisor} *</FieldLabel>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={supervisors.length === 0 ? t.noSupervisorsAvailable : t.selectSupervisor} />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.full_name} - {sup.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {supervisors.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">{t.noApprovedSupervisors}</p>
                )}
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel>{t.assignCoSupervisor}</FieldLabel>
                <Select
                  value={formData.co_advisor_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, co_advisor_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectCoSupervisor} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.noCoSupervisor}</SelectItem>
                    {availableCoSupervisors.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.full_name} - {sup.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <FieldGroup>
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t.assignStudent} *
                </FieldLabel>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-input rounded-lg p-3">
                    {students.length === 0 ? (
                      <p className="text-sm text-muted-foreground col-span-full py-4 text-center">
                        {t.noStudentsAvailable}
                      </p>
                    ) : (
                      students.map((student) => (
                        <label key={student.id} className="flex items-start gap-2 p-2 hover:bg-accent rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.student_ids.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  student_ids: [...formData.student_ids, student.id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  student_ids: formData.student_ids.filter(id => id !== student.id)
                                })
                              }
                            }}
                            className="mt-1"
                          />
                          <span className="text-sm flex-1">
                            <div className="font-medium">{student.full_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {student.registration_number && `${student.registration_number} `}
                              {student.level && `- ${student.level}`}
                            </div>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.student_ids.length > 0 && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">
                      {formData.student_ids.length} student(s) selected
                    </div>
                  )}
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  At least one student must be selected
                </p>
              </Field>
            </FieldGroup>

            <div className="grid md:grid-cols-2 gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="start_date">{t.startDate} *</FieldLabel>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="end_date">{t.endDate}</FieldLabel>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                </Field>
              </FieldGroup>
            </div>

            <div className="flex gap-3 pt-6 border-t border-border">
              <Button 
                type="submit" 
                disabled={submitting || !formData.teacher_id || formData.student_ids.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.creating}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t.createSupervision}
                  </>
                )}
              </Button>
              <Link href="/dashboard/supervisions">
                <Button type="button" variant="outline" disabled={submitting}>
                  {t.cancel}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
