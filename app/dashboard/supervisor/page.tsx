'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Users, TrendingUp, AlertCircle, Search, Edit, Eye, History, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/components/providers'

interface Student {
  id: string
  registration_number: string
  program: string
}

interface Supervision {
  id: string
  title: string
  description: string
  type: string
  status: string
  academic_year: string
  start_date: string
  end_date: string | null
  created_at: string
  student_id: string | null
  student: Student | null
}

export default function SupervisorDashboard() {
  const [supervisions, setSupervisions] = useState<Supervision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const { language } = useLanguage()

  const t = {
    mySupervisions: language === 'fr' ? 'Mes Encadrements' : 'My Supervisions',
    manageSupervisions: language === 'fr' ? 'Gerez et suivez vos encadrements de recherche' : 'Manage and track your research supervisions',
    totalSupervisions: language === 'fr' ? 'Total Encadrements' : 'Total Supervisions',
    active: language === 'fr' ? 'En Cours' : 'Active',
    completed: language === 'fr' ? 'Termines' : 'Completed',
    supervisionHistory: language === 'fr' ? 'Historique des Encadrements' : 'Supervision History',
    allRecords: language === 'fr' ? 'Tous vos enregistrements d\'encadrement' : 'All your supervision records',
    searchPlaceholder: language === 'fr' ? 'Rechercher par titre...' : 'Search by title...',
    filterByStatus: language === 'fr' ? 'Filtrer par statut' : 'Filter by status',
    allStatuses: language === 'fr' ? 'Tous les statuts' : 'All Statuses',
    title: language === 'fr' ? 'Titre' : 'Title',
    type: language === 'fr' ? 'Type' : 'Type',
    status: language === 'fr' ? 'Statut' : 'Status',
    student: language === 'fr' ? 'Etudiant' : 'Student',
    academicYear: language === 'fr' ? 'Annee' : 'Year',
    actions: language === 'fr' ? 'Actions' : 'Actions',
    noSupervisions: language === 'fr' ? 'Aucun encadrement trouve' : 'No supervisions found',
    noSupervisionsYet: language === 'fr' ? 'Vous n\'avez pas encore d\'encadrements' : 'You don\'t have any supervisions yet',
    notAssigned: language === 'fr' ? 'Non affecte' : 'Not assigned',
    suspended: language === 'fr' ? 'Suspendu' : 'Suspended',
    pfe: language === 'fr' ? 'PFE Ingenieur' : 'PFE Engineer',
    master: language === 'fr' ? 'Memoire de Master' : 'Master Thesis',
    doctorate: language === 'fr' ? 'These de Doctorat' : 'Doctorate Thesis',
    spe: language === 'fr' ? 'Stage Academique (SPE)' : 'Academic Internship (SPE)',
    research: language === 'fr' ? 'Projet de Recherche' : 'Research Project',
  }

  const typeLabels: Record<string, string> = {
    pfe: t.pfe,
    master: t.master,
    doctorate: t.doctorate,
    spe: t.spe,
    research: t.research,
  }

  const statusLabels: Record<string, string> = {
    active: t.active,
    completed: t.completed,
    suspended: t.suspended,
    pending: language === 'fr' ? 'En attente' : 'Pending',
    'on-hold': language === 'fr' ? 'En pause' : 'On Hold',
    defended: language === 'fr' ? 'Soutenu' : 'Defended',
    abandoned: language === 'fr' ? 'Abandonne' : 'Abandoned',
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    defended: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    abandoned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    'on-hold': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
  }

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
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

        // Fetch supervisions for this supervisor
        const { data: supervisionsData, error: supervisionsError } = await supabase
          .from('supervisions')
          .select('*, student:students(id, registration_number, program)')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false })

        if (supervisionsError) throw supervisionsError

        setSupervisions(supervisionsData || [])

        // Calculate stats
        const active = supervisionsData?.filter(s => s.status === 'active').length || 0
        const completed = supervisionsData?.filter(s => s.status === 'completed').length || 0
        setStats({
          total: supervisionsData?.length || 0,
          active,
          completed,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [supabase, router])

  const handleUpdateStatus = async (supervisionId: string, newStatus: string) => {
    try {
      setError(null)
      console.log('[v0] Updating supervision status:', supervisionId, newStatus)
      
      const endDate = newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null
      const { error } = await supabase
        .from('supervisions')
        .update({ 
          status: newStatus,
          end_date: endDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', supervisionId)

      if (error) {
        console.error('[v0] Supabase error:', error)
        throw error
      }

      console.log('[v0] Status updated successfully')

      const updated = supervisions.map(s => 
        s.id === supervisionId 
          ? { ...s, status: newStatus, end_date: endDate }
          : s
      )
      
      setSupervisions(updated)

      // Update stats
      setStats({
        total: updated.length,
        active: updated.filter(s => s.status === 'active').length,
        completed: updated.filter(s => s.status === 'completed').length,
      })

      setEditingId(null)
      
      // Show success message
      const statusLabel = statusLabels[newStatus] || newStatus
      const message = language === 'fr' 
        ? `Statut mis a jour a: ${statusLabel}`
        : `Status updated to: ${statusLabel}`
      alert(message)
    } catch (err) {
      console.error('[v0] Error updating status:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to update status'
      setError(errorMsg)
      alert('Error: ' + errorMsg)
    }
  }

  const filteredSupervisions = supervisions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.mySupervisions}</h1>
        <p className="text-muted-foreground">{t.manageSupervisions}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.totalSupervisions}</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <BookOpen className="w-10 h-10 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.active}</p>
                    <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.completed}</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Supervisions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                {t.supervisionHistory}
              </CardTitle>
              <CardDescription>{t.allRecords}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t.filterByStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allStatuses}</SelectItem>
                    <SelectItem value="active">{t.active}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                    <SelectItem value="suspended">{t.suspended}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredSupervisions.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {supervisions.length === 0 ? t.noSupervisionsYet : t.noSupervisions}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">{t.title}</th>
                        <th className="text-left py-3 px-4 font-semibold">{t.type}</th>
                        <th className="text-left py-3 px-4 font-semibold">{t.student}</th>
                        <th className="text-left py-3 px-4 font-semibold">{t.status}</th>
                        <th className="text-left py-3 px-4 font-semibold">{t.academicYear}</th>
                        <th className="text-left py-3 px-4 font-semibold">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSupervisions.map(supervision => (
                        <tr key={supervision.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-medium">{supervision.title}</p>
                            {supervision.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {supervision.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{typeLabels[supervision.type] || supervision.type}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            {supervision.student ? (
                              <div>
                                <p className="text-sm">{supervision.student.registration_number}</p>
                                <p className="text-xs text-muted-foreground">{supervision.student.program}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">{t.notAssigned}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {editingId === supervision.id ? (
                              <Select 
                                value={supervision.status}
                                onValueChange={(value) => handleUpdateStatus(supervision.id, value)}
                              >
                                <SelectTrigger className="w-[120px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">{t.active}</SelectItem>
                                  <SelectItem value="completed">{t.completed}</SelectItem>
                                  <SelectItem value="defended">{statusLabels.defended}</SelectItem>
                                  <SelectItem value="on-hold">{statusLabels['on-hold']}</SelectItem>
                                  <SelectItem value="suspended">{t.suspended}</SelectItem>
                                  <SelectItem value="abandoned">{statusLabels.abandoned}</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={statusColors[supervision.status] || ''}>
                                {statusLabels[supervision.status] || supervision.status}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {supervision.academic_year}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingId(editingId === supervision.id ? null : supervision.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Link href={`/dashboard/supervisor/${supervision.id}`}>
                                <Button size="sm" variant="ghost">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
