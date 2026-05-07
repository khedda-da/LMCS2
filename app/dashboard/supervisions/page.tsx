'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit2, Trash2, Eye, Loader2, Save, X } from 'lucide-react'
import { AdvancedSupervisionSearch, FilterOptions } from '@/components/advanced-search'
import { ExportButton } from '@/components/export-button'
import { toast } from 'sonner'
import { useLanguage } from '@/components/providers'

export default function SupervisionsPage() {
  const [supervisions, setSupervisions] = useState<any[]>([])
  const [users, setUsers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const { language } = useLanguage()
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    status: 'all',
    type: 'all',
    sortBy: 'newest',
    academicYear: 'all',
    searchIn: {
      title: true,
      description: true,
      studentName: true,
      supervisorName: true,
      location: true,
      keywords: true,
    },
  })
  const supabase = createClient()

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      supervisions: { en: 'Supervisions', fr: 'Encadrements' },
      manage: { en: 'Manage', fr: 'Gerer' },
      records: { en: 'supervision record', fr: 'encadrement' },
      recordsPlural: { en: 'supervision records', fr: 'encadrements' },
      addSupervision: { en: 'Add Supervision', fr: 'Ajouter Encadrement' },
      noSupervisions: { en: 'No supervisions yet', fr: 'Aucun encadrement' },
      noMatch: { en: 'No supervisions match your filters', fr: 'Aucun encadrement ne correspond a vos filtres' },
      createFirst: { en: 'Create First Supervision', fr: 'Creer le Premier Encadrement' },
      clearFilters: { en: 'Clear Filters', fr: 'Effacer les Filtres' },
      type: { en: 'Type', fr: 'Type' },
      status: { en: 'Status', fr: 'Statut' },
      progress: { en: 'Progress', fr: 'Progression' },
      location: { en: 'Location', fr: 'Lieu' },
      supervisor: { en: 'Supervisor', fr: 'Encadrant' },
      student: { en: 'Student', fr: 'Etudiant' },
      academicYear: { en: 'Academic Year', fr: 'Annee Academique' },
      active: { en: 'Active', fr: 'Actif' },
      completed: { en: 'Completed', fr: 'Termine' },
      pending: { en: 'Pending', fr: 'En attente' },
      onHold: { en: 'On Hold', fr: 'En pause' },
      suspended: { en: 'Suspended', fr: 'Suspendu' },
      na: { en: 'N/A', fr: 'N/D' },
      confirmDelete: { en: 'Are you sure you want to delete this supervision?', fr: 'Etes-vous sur de vouloir supprimer cet encadrement ?' },
      deleted: { en: 'Supervision deleted successfully', fr: 'Encadrement supprime avec succes' },
      deleteFailed: { en: 'Failed to delete supervision', fr: 'Echec de la suppression' },
      loadFailed: { en: 'Failed to load supervisions', fr: 'Echec du chargement des encadrements' },
      // Supervision types
      pfe: { en: 'PFE Engineer', fr: 'PFE Ingenieur' },
      master: { en: 'Master Thesis', fr: 'Memoire de Master' },
      doctorate: { en: 'Doctorate Thesis', fr: 'These de Doctorat' },
      spe: { en: 'Academic Internship (SPE)', fr: 'Stage Academique (SPE)' },
      research: { en: 'Research Project', fr: 'Projet de Recherche' },
    }
    return translations[key]?.[language] || key
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pfe: t('pfe'),
      master: t('master'),
      doctorate: t('doctorate'),
      spe: t('spe'),
      research: t('research'),
    }
    return labels[type] || type
  }



  useEffect(() => {
    fetchSupervisions()
  }, [])

  const fetchSupervisions = async () => {
    try {
      setLoading(true)
      
      // Fetch supervisions
      const { data, error } = await supabase
        .from('supervisions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSupervisions(data || [])

      // Fetch all users for name lookups
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email')

      if (usersData) {
        const usersMap: Record<string, any> = {}
        usersData.forEach(u => {
          usersMap[u.id] = u
        })
        setUsers(usersMap)
      }

    } catch (error) {
      console.error('[v0] Error fetching supervisions:', error)
      toast.error(t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (supervisionId: string, status: string) => {
    setUpdatingStatus(true)
    try {
      const response = await fetch('/api/supervisions/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisionId,
          status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      // Update local state
      setSupervisions(prev =>
        prev.map(s => s.id === supervisionId ? { ...s, status } : s)
      )
      setEditingStatusId(null)
      setNewStatus('')
      toast.success(language === 'fr' ? 'Statut mis à jour!' : 'Status updated successfully!')
    } catch (error: any) {
      console.error('[v0] Error updating status:', error)
      toast.error(error.message || (language === 'fr' ? 'Erreur de mise à jour' : 'Failed to update status'))
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Get unique academic years
  const academicYears = useMemo(() => {
    const years = new Set<string>()
    supervisions.forEach(s => {
      if (s.academic_year) years.add(s.academic_year)
    })
    return Array.from(years).sort().reverse()
  }, [supervisions])

  // Apply filters with multicriteria search
  const filteredSupervisions = useMemo(() => {
    let result = [...supervisions]

    // Search filter with criteria selection
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      result = result.filter(s => {
        const checks: boolean[] = []
        
        if (filters.searchIn.title && s.title) {
          checks.push(s.title.toLowerCase().includes(term))
        }
        if (filters.searchIn.description && s.description) {
          checks.push(s.description.toLowerCase().includes(term))
        }
        if (filters.searchIn.studentName) {
          // Search in both new students array and legacy student_id
          if (s.students && Array.isArray(s.students)) {
            const studentMatches = s.students.some(sid => users[sid]?.full_name?.toLowerCase().includes(term))
            if (studentMatches) checks.push(true)
          }
          if (s.student_id && users[s.student_id]) {
            checks.push(users[s.student_id].full_name?.toLowerCase().includes(term))
          }
        }
        if (filters.searchIn.supervisorName && s.teacher_id && users[s.teacher_id]) {
          checks.push(users[s.teacher_id].full_name?.toLowerCase().includes(term))
        }
        if (filters.searchIn.location && s.location) {
          checks.push(s.location.toLowerCase().includes(term))
        }
        if (filters.searchIn.keywords) {
          // Search in type and other fields as keywords
          checks.push(s.type?.toLowerCase().includes(term))
          checks.push(s.academic_year?.toLowerCase().includes(term))
        }
        
        return checks.some(c => c)
      })
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(s => s.status === filters.status)
    }

    // Type filter
    if (filters.type !== 'all') {
      result = result.filter(s => s.type === filters.type)
    }

    // Academic year filter
    if (filters.academicYear !== 'all') {
      result = result.filter(s => s.academic_year === filters.academicYear)
    }

    // Sort
    switch (filters.sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'title':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break

      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return result
  }, [supervisions, filters, users])

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return

    try {
      const { error } = await supabase
        .from('supervisions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSupervisions(supervisions.filter(s => s.id !== id))
      toast.success(t('deleted'))
    } catch (error) {
      console.error('[v0] Error deleting supervision:', error)
      toast.error(t('deleteFailed'))
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: t('active'),
      completed: t('completed'),
      pending: t('pending'),
      'on-hold': t('onHold'),
      on_hold: t('onHold'),
      suspended: t('suspended'),
      defended: language === 'fr' ? 'Soutenu' : 'Defended',
      abandoned: language === 'fr' ? 'Abandonné' : 'Abandoned',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      defended: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      'on-hold': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
      on_hold: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      abandoned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  // Prepare data for export
  const exportData = filteredSupervisions.map(s => {
    // Get students names - support both new students array and legacy student_id
    let studentNames = t('na')
    if (s.students && Array.isArray(s.students) && s.students.length > 0) {
      studentNames = s.students.map(sid => users[sid]?.full_name || 'Unknown').join(', ')
    } else if (s.student_id) {
      studentNames = users[s.student_id]?.full_name || t('na')
    }
    
    return {
      [language === 'fr' ? 'Titre' : 'Title']: s.title,
      [language === 'fr' ? 'Type' : 'Type']: getTypeLabel(s.type),
      [language === 'fr' ? 'Statut' : 'Status']: getStatusLabel(s.status),
      [language === 'fr' ? 'Annee Academique' : 'Academic Year']: s.academic_year || t('na'),
      [language === 'fr' ? 'Encadrant' : 'Supervisor']: users[s.teacher_id]?.full_name || t('na'),
      [language === 'fr' ? 'Etudiant(s)' : 'Student(s)']: studentNames,
      [language === 'fr' ? 'Lieu' : 'Location']: s.location || t('na'),
      [language === 'fr' ? 'Date Debut' : 'Start Date']: s.start_date ? new Date(s.start_date).toLocaleDateString() : t('na'),
      [language === 'fr' ? 'Date Fin' : 'End Date']: s.end_date ? new Date(s.end_date).toLocaleDateString() : t('na'),
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('supervisions')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('manage')} {filteredSupervisions.length} {filteredSupervisions.length !== 1 ? t('recordsPlural') : t('records')}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={exportData}
            filename="supervisions"
            disabled={filteredSupervisions.length === 0}
          />
          <Link href="/dashboard/supervisions/new">
            <Button className="btn-primary rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              {t('addSupervision')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Advanced Search with Multi-Criteria */}
      <AdvancedSupervisionSearch
        onFilter={setFilters}
        loading={loading}
        academicYears={academicYears}
      />

      {filteredSupervisions.length === 0 ? (
        <Card className="p-12 text-center card-hover rounded-xl">
          <p className="text-muted-foreground mb-4">
            {supervisions.length === 0 ? t('noSupervisions') : t('noMatch')}
          </p>
          <div className="flex gap-2 justify-center">
            {supervisions.length === 0 ? (
              <Link href="/dashboard/supervisions/new">
                <Button className="btn-primary rounded-xl">{t('createFirst')}</Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    searchTerm: '',
                    status: 'all',
                    type: 'all',
                    sortBy: 'newest',
                    academicYear: 'all',
                    searchIn: {
                      title: true,
                      description: true,
                      studentName: true,
                      supervisorName: true,
                      location: true,
                      keywords: true,
                    },
                  })
                }
                className="rounded-xl"
              >
                {t('clearFilters')}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSupervisions.map((supervision, idx) => (
            <Card
              key={supervision.id}
              className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up card-hover rounded-xl"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2">
                    {supervision.title}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-medium">{t('type')}</p>
                      <p className="font-medium text-foreground mt-1">{supervision.type ? getTypeLabel(supervision.type) : t('na')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-medium">{t('status')}</p>
                      {editingStatusId === supervision.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <SelectValue placeholder={getStatusLabel(supervision.status)} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">{t('active')}</SelectItem>
                              <SelectItem value="pending">{t('pending')}</SelectItem>
                              <SelectItem value="completed">{t('completed')}</SelectItem>
                              <SelectItem value="on_hold">{t('onHold')}</SelectItem>
                              <SelectItem value="suspended">{t('suspended')}</SelectItem>
                              <SelectItem value="defended">{language === 'fr' ? 'Soutenu' : 'Defended'}</SelectItem>
                              <SelectItem value="abandoned">{language === 'fr' ? 'Abandonné' : 'Abandoned'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleStatusUpdate(supervision.id, newStatus)}
                            disabled={updatingStatus || !newStatus}
                          >
                            {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setEditingStatusId(null)
                              setNewStatus('')
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => {
                              setEditingStatusId(supervision.id)
                              setNewStatus(supervision.status)
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition ${getStatusColor(supervision.status)}`}
                          >
                            {getStatusLabel(supervision.status) || t('pending')}
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-medium">{t('supervisor')}</p>
                      <p className="font-medium text-foreground mt-1 truncate">
                        {users[supervision.teacher_id]?.full_name || t('na')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-medium">{t('academicYear')}</p>
                      <p className="font-medium text-foreground mt-1 truncate">{supervision.academic_year || t('na')}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/dashboard/supervisions/${supervision.id}`}>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/supervisions/${supervision.id}/edit`}>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(supervision.id)}
                    className="rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
