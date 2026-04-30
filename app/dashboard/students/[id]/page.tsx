'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Mail, Trash2, GraduationCap, Calendar, Hash } from 'lucide-react'
import { useLanguage } from '@/components/providers'

export default function StudentDetailPage() {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()

  const t = {
    backToStudents: language === 'fr' ? 'Retour aux Etudiants' : 'Back to Students',
    studentNotFound: language === 'fr' ? 'Etudiant non trouve' : 'Student not found',
    student: language === 'fr' ? 'Etudiant' : 'Student',
    delete: language === 'fr' ? 'Supprimer' : 'Delete',
    deleting: language === 'fr' ? 'Suppression...' : 'Deleting...',
    contactInfo: language === 'fr' ? 'Coordonnees' : 'Contact Information',
    email: language === 'fr' ? 'Email' : 'Email',
    academicInfo: language === 'fr' ? 'Informations Academiques' : 'Academic Information',
    program: language === 'fr' ? 'Programme' : 'Program',
    academicYear: language === 'fr' ? 'Annee Academique' : 'Academic Year',
    registrationNumber: language === 'fr' ? 'Numero de Matricule' : 'Registration Number',
    notSpecified: language === 'fr' ? 'Non specifie' : 'Not specified',
    details: language === 'fr' ? 'Details' : 'Details',
    createdAt: language === 'fr' ? 'Cree le' : 'Created At',
    updatedAt: language === 'fr' ? 'Mis a jour le' : 'Updated At',
    confirmDelete: language === 'fr' ? 'Etes-vous sur de vouloir supprimer cet etudiant? Cette action est irreversible.' : 'Are you sure you want to delete this student? This action cannot be undone.',
    deleteFailed: language === 'fr' ? 'Echec de la suppression' : 'Failed to delete student',
  }

  useEffect(() => {
    fetchStudent()
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(userData?.role || null)
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  const fetchStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setStudent(data)
    } catch (error) {
      console.error('Error fetching student:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t.confirmDelete)) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', params.id)

      if (error) throw error
      router.push('/dashboard/students')
    } catch (error) {
      console.error('Error deleting student:', error)
      alert(t.deleteFailed)
    } finally {
      setDeleting(false)
    }
  }

  const canDelete = userRole === 'admin' || userRole === 'director'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToStudents}
          </Button>
        </Link>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">{t.studentNotFound}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/students">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {student.full_name}
            </h1>
            <p className="text-muted-foreground mt-1">{student.program?.toUpperCase()} {t.student}</p>
          </div>
        </div>
        {canDelete && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? t.deleting : t.delete}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t.contactInfo}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">{t.email}</p>
                  <a href={`mailto:${student.email}`} className="text-primary hover:underline">
                    {student.email}
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Academic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t.academicInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">{t.program}</p>
                  <p className="font-medium text-foreground mt-1">{student.program?.toUpperCase() || t.notSpecified}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">{t.academicYear}</p>
                  <p className="font-medium text-foreground mt-1">
                    {student.academic_year || t.notSpecified}
                  </p>
                </div>
              </div>
              {student.registration_number && (
                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t.registrationNumber}</p>
                    <p className="font-mono text-sm text-foreground mt-1">{student.registration_number}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">{t.details}</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">ID</p>
                <p className="font-mono text-xs text-foreground break-all mt-1">
                  {student.id}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t.createdAt}</p>
                <p className="text-foreground text-xs mt-1">
                  {new Date(student.created_at).toLocaleString()}
                </p>
              </div>
              {student.updated_at && (
                <div>
                  <p className="text-muted-foreground">{t.updatedAt}</p>
                  <p className="text-foreground text-xs mt-1">
                    {new Date(student.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
