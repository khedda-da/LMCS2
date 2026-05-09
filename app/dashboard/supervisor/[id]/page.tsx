'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, User, Calendar, BookOpen, Edit2, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/components/providers'

export default function SupervisorSupervisionDetailPage() {
  const [supervision, setSupervision] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [studentList, setStudentList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()

  const t = {
    back: language === 'fr' ? 'Retour' : 'Back',
    edit: language === 'fr' ? 'Modifier' : 'Edit',
    save: language === 'fr' ? 'Enregistrer' : 'Save',
    cancel: language === 'fr' ? 'Annuler' : 'Cancel',
    notFound: language === 'fr' ? 'Encadrement non trouve' : 'Supervision not found',
    backToList: language === 'fr' ? 'Retour a mes Encadrements' : 'Back to My Supervisions',
    details: language === 'fr' ? 'Details de l\'Encadrement' : 'Supervision Details',
    title: language === 'fr' ? 'Titre' : 'Title',
    type: language === 'fr' ? 'Type' : 'Type',
    status: language === 'fr' ? 'Statut' : 'Status',
    academicYear: language === 'fr' ? 'Annee Academique' : 'Academic Year',
    startDate: language === 'fr' ? 'Date de Debut' : 'Start Date',
    endDate: language === 'fr' ? 'Date de Fin' : 'End Date',
    description: language === 'fr' ? 'Description' : 'Description',
    objectives: language === 'fr' ? 'Objectifs' : 'Objectives',
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
    statusUpdated: language === 'fr' ? 'Statut mis a jour avec succes' : 'Status updated successfully',
    errorUpdating: language === 'fr' ? 'Erreur lors de la mise a jour du statut' : 'Error updating status',
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
      'on-hold': t.onHold,
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
      'on-hold': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      suspended: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      abandoned: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    }
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
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

        // Load supervision
        const { data: supervisionData, error: supervisionError } = await supabase
          .from('supervisions')
          .select('*')
          .eq('id', params.id as string)
          .eq('teacher_id', user.id)
          .single()

        if (supervisionError || !supervisionData) {
          setError(t.notFound)
          setLoading(false)
          return
        }

        setSupervision(supervisionData)

        // Load students if assigned - handle both students array and legacy student_id
        let studentIds: string[] = []
        if (supervisionData.students && Array.isArray(supervisionData.students)) {
          studentIds = supervisionData.students
        } else if (supervisionData.student_id) {
          studentIds = [supervisionData.student_id]
        }

        if (studentIds.length > 0) {
          const { data: studentsData, error: studentError } = await supabase
            .from('students')
            .select('*')
            .in('id', studentIds)

          if (!studentError && studentsData && studentsData.length > 0) {
            setStudentList(studentsData)
            setStudent(studentsData[0]) // Set the first student for backward compatibility
          }
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load supervision')
        setLoading(false)
      }
    }

    loadData()
  }, [params.id, supabase, router])

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true)
      const { error } = await supabase
        .from('supervisions')
        .update({ 
          status: newStatus,
          end_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', params.id as string)

      if (error) throw error

      setSupervision({
        ...supervision,
        status: newStatus,
        end_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null
      })
      
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorUpdating)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!supervision) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/supervisor">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t.backToList}
          </Button>
        </Link>
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error || t.notFound}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/supervisor">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{supervision.title}</h1>
            <p className="text-muted-foreground mt-1">{t.details}</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Supervision Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.details}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-foreground">{t.title}</label>
                <p className="mt-2 text-foreground">{supervision.title}</p>
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-semibold text-foreground">{t.type}</label>
                <div className="mt-2">
                  <Badge variant="outline">{getTypeLabel(supervision.type)}</Badge>
                </div>
              </div>

              {/* Status - with edit capability */}
              <div>
                <label className="text-sm font-semibold text-foreground">{t.status}</label>
                {isEditing ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Select defaultValue={supervision.status} onValueChange={handleStatusChange} disabled={updating}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t.active}</SelectItem>
                        <SelectItem value="completed">{t.completed}</SelectItem>
                        <SelectItem value="defended">{t.defended}</SelectItem>
                        <SelectItem value="on-hold">{t.onHold}</SelectItem>
                        <SelectItem value="suspended">{t.suspended}</SelectItem>
                        <SelectItem value="abandoned">{t.abandoned}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      disabled={updating}
                    >
                      {t.cancel}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={getStatusColor(supervision.status)}>
                      {getStatusLabel(supervision.status)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Academic Year */}
              <div>
                <label className="text-sm font-semibold text-foreground">{t.academicYear}</label>
                <p className="mt-2 text-foreground">{supervision.academic_year || t.na}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground">{t.startDate}</label>
                  <p className="mt-2 text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {supervision.start_date ? new Date(supervision.start_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : t.na}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">{t.endDate}</label>
                  <p className="mt-2 text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {supervision.end_date ? new Date(supervision.end_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : t.na}
                  </p>
                </div>
              </div>

              {/* Description */}
              {supervision.description && (
                <div>
                  <label className="text-sm font-semibold text-foreground">{t.description}</label>
                  <p className="mt-2 text-foreground text-sm leading-relaxed">{supervision.description}</p>
                </div>
              )}

              {/* Objectives */}
              {supervision.objectives && (
                <div>
                  <label className="text-sm font-semibold text-foreground">{t.objectives}</label>
                  <p className="mt-2 text-foreground text-sm leading-relaxed">{supervision.objectives}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Student(s) Info */}
          {studentList.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{studentList.length === 1 ? t.student : language === 'fr' ? 'Etudiants' : 'Students'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentList.map((s) => (
                  <div key={s.id} className="space-y-2 pb-4 last:pb-0 border-b last:border-0">
                    <div>
                      <p className="text-xs text-muted-foreground">{language === 'fr' ? 'Nom' : 'Name'}</p>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {s.full_name || t.na}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{language === 'fr' ? 'Numero' : 'Registration'}</p>
                      <p className="font-semibold text-foreground">{s.registration_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{language === 'fr' ? 'Programme' : 'Program'}</p>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        {s.program || t.na}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">{language === 'fr' ? 'Aucun etudiant assigne' : 'No student assigned'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
