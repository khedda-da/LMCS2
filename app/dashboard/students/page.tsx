'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Mail, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/components/providers'

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const supabase = createClient()
  const { language } = useLanguage()

  const t = {
    title: language === 'fr' ? 'Etudiants' : 'Students',
    subtitle: language === 'fr' ? 'Gerer les dossiers des etudiants' : 'Manage student records',
    addStudent: language === 'fr' ? 'Ajouter Etudiant' : 'Add Student',
    searchPlaceholder: language === 'fr' ? 'Rechercher par nom ou email...' : 'Search by name or email...',
    noStudentsSearch: language === 'fr' ? 'Aucun etudiant trouve correspondant a votre recherche' : 'No students found matching your search',
    noStudentsYet: language === 'fr' ? 'Aucun etudiant pour le moment' : 'No students yet',
    addFirstStudent: language === 'fr' ? 'Ajouter le Premier Etudiant' : 'Add First Student',
    registration: language === 'fr' ? 'Matricule' : 'Registration',
    yearOfStudy: language === 'fr' ? 'Annee d\'Etude' : 'Year of Study',
    academicYear: language === 'fr' ? 'Annee Academique' : 'Academic Year',
    viewDetails: language === 'fr' ? 'Voir Details' : 'View Details',
  }

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      '1cs': '1 CS',
      '2cs': '2 CS',
      '3cs': '3 CS',
      'master': 'Master',
      'doctorat': language === 'fr' ? 'Doctorat' : 'Doctorate',
    }
    return labels[level] || level
  }

  useEffect(() => {
    fetchStudents()
    checkUserRole()
  }, [])

  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        student.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        student.email?.toLowerCase().includes(search.toLowerCase()) ||
        student.registration_number?.toLowerCase().includes(search.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [search, students])

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

  const fetchStudents = async () => {
    try {
      // Fetch students (exclude soft-deleted)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .is('deleted_at', null)
        .order('full_name', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const canAddStudent = userRole === 'admin' || userRole === 'director'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        {canAddStudent && (
          <Link href="/dashboard/students/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t.addStudent}
            </Button>
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {search ? t.noStudentsSearch : t.noStudentsYet}
          </p>
          {!search && canAddStudent && (
            <Link href="/dashboard/students/new">
              <Button>{t.addFirstStudent}</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {student.full_name}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${student.email}`} className="hover:text-primary">
                      {student.email}
                    </a>
                  </div>
                  {student.registration_number && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">{t.registration}:</span> {student.registration_number}
                    </div>
                  )}
                  {student.level && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">{t.yearOfStudy}:</span> {getLevelLabel(student.level)}
                    </div>
                  )}
                  {student.academic_year && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">{t.academicYear}:</span> {student.academic_year}
                    </div>
                  )}
                </div>
                <Link href={`/dashboard/students/${student.id}`}>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    {t.viewDetails}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
