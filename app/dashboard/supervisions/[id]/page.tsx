'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, User, Users, Calendar, BookOpen, GraduationCap, Edit2, Save } from 'lucide-react'
import { useLanguage } from '@/components/providers'
import { toast } from 'sonner'

export default function SupervisionDetailPage() {
  const [supervision, setSupervision] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [supervisor, setSupervisor] = useState<any>(null)
  const [coSupervisor, setCoSupervisor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()

  const t = {
    back: language === 'fr' ? 'Retour' : 'Back',
    edit: language === 'fr' ? 'Modifier' : 'Edit',
    notFound: language === 'fr' ? 'Encadrement non trouve' : 'Supervision not found',
    backToList: language === 'fr' ? 'Retour aux Encadrements' : 'Back to Supervisions',
    details: language === 'fr' ? 'Details de l\'Encadrement' : 'Supervision Details',
    title: language === 'fr' ? 'Titre' : 'Title',
    type: language === 'fr' ? 'Type' : 'Type',
    status: language === 'fr' ? 'Statut' : 'Status',
    academicYear: language === 'fr' ? 'Annee Academique' : 'Academic Year',
    startDate: language === 'fr' ? 'Date de Debut' : 'Start Date',
    endDate: language === 'fr' ? 'Date de Fin Prevue' : 'Expected End Date',
    description: language === 'fr' ? 'Description' : 'Description',
    objectives: language === 'fr' ? 'Objectifs' : 'Objectives',
    supervisor: language === 'fr' ? 'Encadrant Principal' : 'Main Supervisor',
    coSupervisor: language === 'fr' ? 'Co-Encadrant' : 'Co-Supervisor',
    student: language === 'fr' ? 'Etudiant' : 'Student',
    noDescription: language === 'fr' ? 'Aucune description' : 'No description',
    noObjectives: language === 'fr' ? 'Aucun objectif defini' : 'No objectives defined',
    na: language === 'fr' ? 'N/D' : 'N/A',
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pfe: t.pfe,
      master: t.master,
      doctorate: t.doctorate,
      spe: t.spe,
      research: t.research,
    }
    return labels[type] || type
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: t.active,
      pending: t.pending,
      completed: t.completed,
      'on_hold': t.onHold,
      suspended: t.suspended,
      defended: t.defended,
      abandoned: t.abandoned,
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      defended: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      'on_hold': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      suspended: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      abandoned: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    }
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  }

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get supervision details
      const { data: supervisionData, error } = await supabase
        .from('supervisions')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !supervisionData) {
        setLoading(false)
        return
      }

      setSupervision(supervisionData)

      // Fetch students info - handle both students array and legacy student_id
      if (supervisionData.students && Array.isArray(supervisionData.students) && supervisionData.students.length > 0) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .in('id', supervisionData.students)
        setStudents(studentsData || [])
      } else if (supervisionData.student_id) {
        // Fallback for legacy single student_id
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('id', supervisionData.student_id)
          .single()
        if (studentData) setStudents([studentData])
      }

      // Fetch supervisor info
      if (supervisionData.teacher_id) {
        const { data: supervisorData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', supervisionData.teacher_id)
          .single()
        setSupervisor(supervisorData)
      }

      // Fetch co-supervisor info
      if (supervisionData.co_advisor_id) {
        const { data: coSupervisorData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', supervisionData.co_advisor_id)
          .single()
        setCoSupervisor(coSupervisorData)
      }

      setLoading(false)
    }

    loadData()
  }, [supabase, router, params.id])

  const handleStatusUpdate = async () => {
    if (!newStatus || !supervision) return

    setUpdatingStatus(true)
    try {
      const response = await fetch('/api/supervisions/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisionId: supervision.id,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      // Update local state
      setSupervision({ ...supervision, status: newStatus })
      setIsEditingStatus(false)
      setNewStatus('')
      toast.success(language === 'fr' ? 'Statut mis à jour avec succès!' : 'Status updated successfully!')
    } catch (error: any) {
      console.error('[v0] Error updating status:', error)
      toast.error(error.message || (language === 'fr' ? 'Erreur lors de la mise à jour du statut' : 'Failed to update status'))
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!supervision) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">{t.notFound}</p>
              <Link href="/dashboard/supervisions">
                <Button>{t.backToList}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/supervisions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{supervision.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {isEditingStatus ? (
                <div className="flex items-center gap-2">
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={getStatusLabel(supervision.status)} />
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
                  <Button
                    size="sm"
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus || !newStatus}
                  >
                    {updatingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingStatus(false)
                      setNewStatus('')
                    }}
                  >
                    {language === 'fr' ? 'Annuler' : 'Cancel'}
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditingStatus(true)
                      setNewStatus(supervision.status)
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition ${getStatusColor(supervision.status)}`}
                  >
                    {getStatusLabel(supervision.status)}
                  </button>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {getTypeLabel(supervision.type)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/supervisions/${supervision.id}/edit`}>
          <Button>
            <Edit2 className="w-4 h-4 mr-2" />
            {t.edit}
          </Button>
        </Link>
      </div>

      {/* Main Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t.details}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t.type}</p>
              <p className="font-semibold">{getTypeLabel(supervision.type)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t.status}</p>
              <p className="font-semibold capitalize">{getStatusLabel(supervision.status)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t.academicYear}</p>
              <p className="font-semibold">{supervision.academic_year || t.na}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t.startDate}</p>
              <p className="font-semibold">
                {supervision.start_date ? new Date(supervision.start_date).toLocaleDateString() : t.na}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t.endDate}</p>
              <p className="font-semibold">
                {supervision.end_date ? new Date(supervision.end_date).toLocaleDateString() : t.na}
              </p>
            </div>
          </div>

          {supervision.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t.description}</p>
              <p className="text-sm leading-relaxed bg-muted p-4 rounded-lg">
                {supervision.description}
              </p>
            </div>
          )}

          {supervision.objectives && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t.objectives}</p>
              <p className="text-sm leading-relaxed bg-muted p-4 rounded-lg">
                {supervision.objectives}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* People Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supervisor Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              {t.supervisor}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {supervisor ? (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{supervisor.full_name}</p>
                  <p className="text-sm text-muted-foreground">{supervisor.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.na}</p>
            )}
          </CardContent>
        </Card>

        {/* Co-Supervisor Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5" />
              {t.coSupervisor}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coSupervisor ? (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{coSupervisor.full_name}</p>
                  <p className="text-sm text-muted-foreground">{coSupervisor.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.na}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Students Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            {students.length === 1 ? t.student : language === 'fr' ? 'Etudiants' : 'Students'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-lg">{student.full_name}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                    {student.registration_number && (
                      <p className="text-sm text-muted-foreground">
                        {language === 'fr' ? 'Matricule' : 'Registration'}: {student.registration_number}
                      </p>
                    )}
                    {student.level && (
                      <p className="text-sm text-muted-foreground">
                        {language === 'fr' ? 'Niveau' : 'Level'}: {student.level.toUpperCase()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t.na}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
