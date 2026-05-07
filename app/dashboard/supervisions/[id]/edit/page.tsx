'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { useLanguage } from '@/components/providers'
import { toast } from 'sonner'

export default function EditSupervisionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    status: '',
    academic_year: '',
    description: '',
    objectives: '',
    start_date: '',
    end_date: '',
    teacher_id: '',
    co_advisor_id: '',
    student_id: '',
  })
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()

  const t = {
    back: language === 'fr' ? 'Retour' : 'Back',
    title: language === 'fr' ? 'Modifier l\'Encadrement' : 'Edit Supervision',
    subtitle: language === 'fr' ? 'Mettre a jour les details de l\'encadrement' : 'Update supervision details',
    cardTitle: language === 'fr' ? 'Details de l\'Encadrement' : 'Supervision Details',
    cardDesc: language === 'fr' ? 'Modifiez les informations de l\'encadrement' : 'Edit the supervision information',
    projectTitle: language === 'fr' ? 'Titre du Projet' : 'Project Title',
    projectTitlePlaceholder: language === 'fr' ? 'Entrez le titre du projet' : 'Enter project title',
    description: language === 'fr' ? 'Description' : 'Description',
    descriptionPlaceholder: language === 'fr' ? 'Description du projet' : 'Project description',
    objectives: language === 'fr' ? 'Objectifs' : 'Objectives',
    objectivesPlaceholder: language === 'fr' ? 'Objectifs du projet' : 'Project objectives',
    supervisionType: language === 'fr' ? 'Type d\'Encadrement' : 'Supervision Type',
    selectType: language === 'fr' ? 'Selectionner le type' : 'Select type',
    status: language === 'fr' ? 'Statut' : 'Status',
    selectStatus: language === 'fr' ? 'Selectionner le statut' : 'Select status',
    academicYear: language === 'fr' ? 'Annee Academique' : 'Academic Year',
    mainSupervisor: language === 'fr' ? 'Encadrant Principal' : 'Main Supervisor',
    coSupervisor: language === 'fr' ? 'Co-Encadrant' : 'Co-Supervisor',
    student: language === 'fr' ? 'Etudiant' : 'Student',
    selectSupervisor: language === 'fr' ? 'Selectionner un encadrant' : 'Select supervisor',
    selectStudent: language === 'fr' ? 'Selectionner un etudiant' : 'Select student',
    noCoSupervisor: language === 'fr' ? 'Pas de co-encadrant' : 'No co-supervisor',
    startDate: language === 'fr' ? 'Date de Debut' : 'Start Date',
    endDate: language === 'fr' ? 'Date de Fin Prevue' : 'Expected End Date',
    saving: language === 'fr' ? 'Enregistrement...' : 'Saving...',
    saveChanges: language === 'fr' ? 'Enregistrer les Modifications' : 'Save Changes',
    cancel: language === 'fr' ? 'Annuler' : 'Cancel',
    successMsg: language === 'fr' ? 'Encadrement mis a jour avec succes!' : 'Supervision updated successfully!',
    errorMsg: language === 'fr' ? 'Erreur lors de la mise a jour' : 'Failed to update supervision',
    // Types
    pfe: language === 'fr' ? 'PFE Ingenieur' : 'PFE Engineer',
    master: language === 'fr' ? 'Memoire de Master' : 'Master Thesis',
    doctorate: language === 'fr' ? 'These de Doctorat' : 'Doctorate Thesis',
    spe: language === 'fr' ? 'Stage Academique (SPE)' : 'Academic Internship (SPE)',
    research: language === 'fr' ? 'Projet de Recherche' : 'Research Project',
    // Status
    active: language === 'fr' ? 'Actif' : 'Active',
    pending: language === 'fr' ? 'En attente' : 'Pending',
    completed: language === 'fr' ? 'Termine' : 'Completed',
    onHold: language === 'fr' ? 'En pause' : 'On Hold',
    suspended: language === 'fr' ? 'Suspendu' : 'Suspended',
    defended: language === 'fr' ? 'Soutenu' : 'Defended',
    abandoned: language === 'fr' ? 'Abandonne' : 'Abandoned',
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch supervision
      const { data, error } = await supabase
        .from('supervisions')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      
      // Handle both new students array and legacy student_id
      const studentsToSelect = data.students && Array.isArray(data.students) ? data.students : (data.student_id ? [data.student_id] : [])
      setSelectedStudents(studentsToSelect)
      
      setFormData({
        title: data.title || '',
        type: data.type || '',
        status: data.status || '',
        academic_year: data.academic_year || '',
        description: data.description || '',
        objectives: data.objectives || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        teacher_id: data.teacher_id || '',
        co_advisor_id: data.co_advisor_id || '',
        student_id: data.student_id || '',
      })

      // Fetch supervisors
      const { data: supervisorsData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'supervisor')
        .eq('is_approved', true)
        .order('full_name', { ascending: true })

      if (supervisorsData) {
        setSupervisors(supervisorsData)
      }

      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name, email, registration_number, level')
        .order('full_name', { ascending: true })

      if (studentsData) {
        setStudents(studentsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (selectedStudents.length === 0) {
        toast.error(language === 'fr' ? 'Selectionnez au moins un etudiant' : 'Please select at least one student')
        setSaving(false)
        return
      }

      const updateData = {
        title: formData.title,
        type: formData.type,
        status: formData.status,
        academic_year: formData.academic_year,
        description: formData.description,
        objectives: formData.objectives,
        start_date: formData.start_date,
        end_date: formData.end_date,
        teacher_id: formData.teacher_id,
        students: selectedStudents,
        co_advisor_id: formData.co_advisor_id === 'none' ? null : formData.co_advisor_id || null,
      }

      const { error } = await supabase
        .from('supervisions')
        .update(updateData)
        .eq('id', params.id)

      if (error) throw error
      
      toast.success(t.successMsg)
      router.push(`/dashboard/supervisions/${params.id}`)
    } catch (error: any) {
      console.error('Error updating supervision:', error.message)
      toast.error(t.errorMsg)
    } finally {
      setSaving(false)
    }
  }

  // Filter co-supervisors to exclude main supervisor
  const availableCoSupervisors = supervisors.filter(s => s.id !== formData.teacher_id)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/supervisions/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.cardTitle}</CardTitle>
          <CardDescription>{t.cardDesc}</CardDescription>
        </CardHeader>
        <CardContent>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <FieldLabel>{t.status} *</FieldLabel>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectStatus} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t.active}</SelectItem>
                      <SelectItem value="pending">{t.pending}</SelectItem>
                      <SelectItem value="completed">{t.completed}</SelectItem>
                      <SelectItem value="on_hold">{t.onHold}</SelectItem>
                      <SelectItem value="suspended">{t.suspended}</SelectItem>
                      <SelectItem value="defended">{t.defended}</SelectItem>
                      <SelectItem value="abandoned">{t.abandoned}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
            </div>

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

            <FieldGroup>
              <Field>
                <FieldLabel>{t.mainSupervisor} *</FieldLabel>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectSupervisor} />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map((sup) => (
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
                <FieldLabel>{t.coSupervisor}</FieldLabel>
                <Select
                  value={formData.co_advisor_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, co_advisor_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectSupervisor} />
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
                <FieldLabel>{language === 'fr' ? 'Etudiants' : 'Students'} *</FieldLabel>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-input rounded-lg p-3">
                    {students.map((student) => (
                      <label key={student.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-muted rounded">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id])
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                            }
                          }}
                          className="rounded border-input"
                        />
                        <span className="text-sm">
                          {student.full_name}
                          {student.registration_number && <span className="block text-xs text-muted-foreground">({student.registration_number})</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                  {selectedStudents.length === 0 && (
                    <p className="text-sm text-destructive">{t.selectStudent} *</p>
                  )}
                  {selectedStudents.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedStudents.length} {language === 'fr' ? 'etudiant(s) selectionne(s)' : 'student(s) selected'}
                    </p>
                  )}
                </div>
              </Field>
            </FieldGroup>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="start_date">{t.startDate}</FieldLabel>
                  <Input
                    id="start_date"
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                  />
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="end_date">{t.endDate}</FieldLabel>
                  <Input
                    id="end_date"
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                </Field>
              </FieldGroup>
            </div>

            <div className="flex gap-3 pt-6 border-t border-border">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t.saveChanges}
                  </>
                )}
              </Button>
              <Link href={`/dashboard/supervisions/${params.id}`}>
                <Button type="button" variant="outline">
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
