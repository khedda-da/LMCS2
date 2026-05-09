'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, Users, BookOpen, TrendingUp, AlertCircle,
  FileText, PieChart, GraduationCap, CheckCircle2, Clock, Award
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { StatisticsFilterPanel, StatisticsFilters } from '@/components/statistics-filter'
import { useLanguage } from '@/components/providers'

export const dynamic = 'force-dynamic'

interface Supervision {
  id: string
  title: string
  type: string
  status: string
  academic_year: string
  teacher_id: string
  student_id: string
  created_at: string
}

interface Supervisor {
  id: string
  full_name: string
  email: string
  supervisionCount: number
}

interface SupervisionStats {
  total: number
  active: number
  completed: number
  suspended: number
  pending: number
  defended: number
  onHold: number
  abandoned: number
  byType: Record<string, number>
  byYear: Record<string, number>
}

export default function DirectorDashboard() {
  const [supervisions, setSupervisions] = useState<Supervision[]>([])
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [userId, setUserId] = useState<string>('')
  const [stats, setStats] = useState<SupervisionStats>({
    total: 0,
    active: 0,
    completed: 0,
    suspended: 0,
    pending: 0,
    defended: 0,
    onHold: 0,
    abandoned: 0,
    byType: {},
    byYear: {},
  })
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [advancedFilters, setAdvancedFilters] = useState<StatisticsFilters>({
    status: 'all',
    type: 'all',
    supervisor: 'all',
    academicYear: 'all',
    startDate: '',
    endDate: '',
    yearOfStudy: 'all',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const { language } = useLanguage()

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      globalStatistics: { en: 'Global Statistics', fr: 'Statistiques Globales' },
      laboratoryOverview: { en: 'Laboratory supervision overview and annual reports', fr: 'Apercu des encadrements du laboratoire et bilans annuels' },
      totalSupervisions: { en: 'Total Supervisions', fr: 'Total Encadrements' },
      activeSupervisions: { en: 'Active', fr: 'En cours' },
      completedSupervisions: { en: 'Completed', fr: 'Termines' },
      activeSupervisors: { en: 'Active Supervisors', fr: 'Encadrants Actifs' },
      supervisionWorkload: { en: 'Supervision Workload', fr: 'Charge d\'Encadrement' },
      workloadByTeacher: { en: 'Workload distribution by teacher/researcher', fr: 'Repartition de la charge par enseignant/chercheur' },
      supervisionsByType: { en: 'Supervisions by Type', fr: 'Encadrements par Type' },
      distributionByCategory: { en: 'Distribution by supervision category', fr: 'Repartition par categorie d\'encadrement' },
      annualReport: { en: 'Annual Report', fr: 'Bilan Annuel' },

      filterByYear: { en: 'Filter by Year', fr: 'Filtrer par Annee' },
      allYears: { en: 'All Years', fr: 'Toutes les Annees' },
      supervisorName: { en: 'Supervisor', fr: 'Encadrant' },
      numberOfSupervisions: { en: 'Supervisions', fr: 'Encadrements' },
      workloadPercentage: { en: 'Workload %', fr: '% Charge' },
      pfe: { en: 'PFE (Bachelor)', fr: 'PFE (Licence)' },
      master: { en: 'Master', fr: 'Master' },
      doctorate: { en: 'Doctorate', fr: 'Doctorat' },
      internship: { en: 'Internship', fr: 'Stage' },
      noData: { en: 'No supervision data available', fr: 'Aucune donnee d\'encadrement disponible' },
      avgPerSupervisor: { en: 'Avg. per Supervisor', fr: 'Moy. par Encadrant' },
      generatingReport: { en: 'Generating...', fr: 'Generation...' },
      successRate: { en: 'Success Rate', fr: 'Taux de Reussite' },
      averageLoad: { en: 'Average Load', fr: 'Charge Moyenne' },
      supervisionsPerTeacher: { en: 'supervisions per teacher', fr: 'encadrements par enseignant' },
      outOf: { en: 'out of', fr: 'sur' },
      teachers: { en: 'teachers', fr: 'enseignants' },
      completedOutOf: { en: 'completed out of', fr: 'termines sur' },
      summaryAllYears: { en: 'Summary of all years', fr: 'Resume de toutes les annees' },
      summaryForYear: { en: 'Summary for year', fr: 'Resume pour l\'annee' },
      suspended: { en: 'Suspended', fr: 'Suspendus' },
      statusDistribution: { en: 'Status Distribution', fr: 'Repartition par Statut' },
      bySupervisionType: { en: 'By Supervision Type', fr: 'Par Type d\'Encadrement' },
      performanceMetrics: { en: 'Performance Metrics', fr: 'Indicateurs de Performance' },
      pending: { en: 'Pending', fr: 'En attente' },
      active: { en: 'Active', fr: 'Actif' },
      completed: { en: 'Completed', fr: 'Termine' },
      defended: { en: 'Defended', fr: 'Soutenu' },
      onHold: { en: 'On Hold', fr: 'En pause' },
      abandoned: { en: 'Abandoned', fr: 'Abandonne' },
      activeRate: { en: 'Active Rate', fr: 'Taux d\'Activite' },
    }
    return translations[key]?.[language] || key
  }

  const typeLabels: Record<string, string> = {
    pfe: t('pfe'),
    master: t('master'),
    doctorate: t('doctorate'),
    internship: t('internship'),
  }

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, is_approved')
          .eq('id', user.id)
          .single()

        if (userError || !userData?.is_approved || userData?.role !== 'director') {
          router.push('/dashboard')
          return
        }

        // Fetch supervisions (exclude soft-deleted)
        const { data: supervisionsData, error: supervisionsError } = await supabase
          .from('supervisions')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (supervisionsError) throw supervisionsError

        setSupervisions(supervisionsData || [])

        const allSupervisions = supervisionsData || []
        const active = allSupervisions.filter(s => s.status === 'active').length
        const completed = allSupervisions.filter(s => s.status === 'completed').length
        const suspended = allSupervisions.filter(s => s.status === 'suspended').length
        const pending = allSupervisions.filter(s => s.status === 'pending').length
        const defended = allSupervisions.filter(s => s.status === 'defended').length
        const onHold = allSupervisions.filter(s => s.status === 'on_hold').length
        const abandoned = allSupervisions.filter(s => s.status === 'abandoned').length

        const byType: Record<string, number> = {}
        allSupervisions.forEach(s => {
          byType[s.type] = (byType[s.type] || 0) + 1
        })

        const byYear: Record<string, number> = {}
        allSupervisions.forEach(s => {
          const year = s.academic_year || 'Unknown'
          byYear[year] = (byYear[year] || 0) + 1
        })

        setStats({
          total: allSupervisions.length,
          active,
          completed,
          suspended,
          pending,
          defended,
          onHold,
          abandoned,
          byType,
          byYear,
        })

        // Fetch supervisors (exclude soft-deleted)
        const { data: supervisorsData, error: supervisorsError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('role', 'supervisor')
          .eq('is_approved', true)
          .is('deleted_at', null)

        if (supervisorsError) throw supervisorsError

        const supervisorCounts: Record<string, number> = {}
        allSupervisions.forEach(s => {
          supervisorCounts[s.teacher_id] = (supervisorCounts[s.teacher_id] || 0) + 1
        })

        const supervisorsWithCounts = (supervisorsData || []).map(sup => ({
          ...sup,
          supervisionCount: supervisorCounts[sup.id] || 0
        })).sort((a, b) => b.supervisionCount - a.supervisionCount)

        setSupervisors(supervisorsWithCounts)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [supabase, router])

  const filteredSupervisions = selectedYear === 'all' 
    ? supervisions 
    : supervisions.filter(s => s.academic_year === selectedYear)

  const years = Object.keys(stats.byYear).sort().reverse()

  const handleAdvancedFilter = (filters: StatisticsFilters) => {
    try {
      setError(null)
      
      // Apply filters client-side to the fetched data
      let filtered = [...supervisions]
      
      // Filter by status
      if (filters.status !== 'all') {
        filtered = filtered.filter(s => s.status === filters.status)
      }
      
      // Filter by type
      if (filters.type !== 'all') {
        filtered = filtered.filter(s => s.type === filters.type)
      }
      
      // Filter by supervisor
      if (filters.supervisor !== 'all') {
        filtered = filtered.filter(s => s.teacher_id === filters.supervisor)
      }
      
      // Filter by academic year
      if (filters.academicYear !== 'all') {
        filtered = filtered.filter(s => s.academic_year === filters.academicYear)
      }
      
      // Filter by date range if provided
      if (filters.startDate) {
        const startDate = new Date(filters.startDate)
        filtered = filtered.filter(s => new Date(s.created_at) >= startDate)
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        filtered = filtered.filter(s => new Date(s.created_at) <= endDate)
      }
      
      // Calculate stats from filtered data
      const active = filtered.filter(s => s.status === 'active').length
      const completed = filtered.filter(s => s.status === 'completed').length
      const suspended = filtered.filter(s => s.status === 'suspended').length
      const pending = filtered.filter(s => s.status === 'pending').length
      const defended = filtered.filter(s => s.status === 'defended').length
      const onHold = filtered.filter(s => s.status === 'on_hold').length
      const abandoned = filtered.filter(s => s.status === 'abandoned').length
      
      const byType: Record<string, number> = {}
      filtered.forEach(s => {
        byType[s.type] = (byType[s.type] || 0) + 1
      })
      
      const byYear: Record<string, number> = {}
      filtered.forEach(s => {
        const year = s.academic_year || 'Unknown'
        byYear[year] = (byYear[year] || 0) + 1
      })
      
      setStats({
        total: filtered.length,
        active,
        completed,
        suspended,
        pending,
        defended,
        onHold,
        abandoned,
        byType,
        byYear,
      })
      
      // Update supervisors list based on filtered supervisions
      const supervisorCounts: Record<string, number> = {}
      filtered.forEach(s => {
        supervisorCounts[s.teacher_id] = (supervisorCounts[s.teacher_id] || 0) + 1
      })
      
      const updatedSupervisors = supervisors.map(sup => ({
        ...sup,
        supervisionCount: supervisorCounts[sup.id] || 0
      })).sort((a, b) => b.supervisionCount - a.supervisionCount)
      
      setSupervisors(updatedSupervisors)
      setAdvancedFilters(filters)
    } catch (err) {
      console.error('[v0] Error applying advanced filters:', err)
      setError(err instanceof Error ? err.message : 'Failed to apply filters')
    }
  }



  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('globalStatistics')}</h1>
          <p className="text-muted-foreground mt-1">{t('laboratoryOverview')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue placeholder={t('filterByYear')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allYears')}</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Advanced Statistics Filter */}
      <motion.div variants={itemVariants}>
        <StatisticsFilterPanel 
          onFilterChange={handleAdvancedFilter}
          supervisors={supervisors}
          years={years}
          loading={false}
        />
      </motion.div>

      {loading ? (
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Enhanced Key Metrics */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Supervisions */}
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('totalSupervisions')}</p>
                    <p className="text-4xl font-bold mt-2 text-slate-900 dark:text-slate-100">{stats.total}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {stats.active} {t('activeSupervisions').toLowerCase()}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-slate-400 dark:text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Supervisions */}
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('activeSupervisions')}</p>
                    <p className="text-4xl font-bold mt-2 text-slate-900 dark:text-slate-100">{stats.active}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% {language === 'fr' ? 'du total' : 'of total'}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-slate-400 dark:text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completed Supervisions */}
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('completedSupervisions')}</p>
                    <p className="text-4xl font-bold mt-2 text-slate-900 dark:text-slate-100">{stats.completed}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% {t('successRate').toLowerCase()}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-slate-400 dark:text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Supervisors */}
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('activeSupervisors')}</p>
                    <p className="text-4xl font-bold mt-2 text-slate-900 dark:text-slate-100">{supervisors.filter(s => s.supervisionCount > 0).length}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {t('outOf')} {supervisors.length} {t('teachers')}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Users className="w-7 h-7 text-slate-400 dark:text-slate-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Advanced Multi-Criteria Statistics */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Distribution */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{t('statusDistribution')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('pending')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500" style={{width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`}}></div>
                    </div>
                    <span className="text-xs font-semibold w-8">{stats.pending}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('active')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%`}}></div>
                    </div>
                    <span className="text-xs font-semibold w-8">{stats.active}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('completed')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`}}></div>
                    </div>
                    <span className="text-xs font-semibold w-8">{stats.completed}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('defended')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{width: `${stats.total > 0 ? (stats.defended / stats.total) * 100 : 0}%`}}></div>
                    </div>
                    <span className="text-xs font-semibold w-8">{stats.defended}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('suspended')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{width: `${stats.total > 0 ? (stats.suspended / stats.total) * 100 : 0}%`}}></div>
                    </div>
                    <span className="text-xs font-semibold w-8">{stats.suspended}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('onHold')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{width: `${stats.total > 0 ? (stats.onHold / stats.total) * 100 : 0}%`}}></div>
                    </div>
                    <span className="text-xs font-semibold w-8">{stats.onHold}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('abandoned')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-500" style={{width: `${stats.total > 0 ? (stats.abandoned / stats.total) * 100 : 0}%`}}></div>
                    </div>
                    <span className="text-xs font-semibold w-8">{stats.abandoned}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Type Distribution */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{t('bySupervisionType')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground capitalize">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500" style={{width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`}}></div>
                      </div>
                      <span className="text-xs font-semibold w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{t('performanceMetrics')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="py-2 border-b">
                  <p className="text-xs text-muted-foreground mb-1">{t('successRate')}</p>
                  <p className="text-2xl font-bold">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</p>
                </div>
                <div className="py-2 border-b">
                  <p className="text-xs text-muted-foreground mb-1">{t('avgPerSupervisor')}</p>
                  <p className="text-2xl font-bold">{supervisors.length > 0 ? (stats.total / supervisors.length).toFixed(1) : 0}</p>
                </div>
                <div className="py-2">
                  <p className="text-xs text-muted-foreground mb-1">{t('activeRate')}</p>
                  <p className="text-2xl font-bold">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Section */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supervision Workload by Teacher */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  {t('supervisionWorkload')}
                </CardTitle>
                <CardDescription>{t('workloadByTeacher')}</CardDescription>
              </CardHeader>
              <CardContent>
                {supervisors.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('noData')}</p>
                ) : (
                  <div className="space-y-4">
                    {supervisors.slice(0, 8).map((supervisor, index) => {
                      const percentage = stats.total > 0 
                        ? Math.round((supervisor.supervisionCount / stats.total) * 100) 
                        : 0
                      const colors = [
                        'from-blue-500 to-blue-600',
                        'from-emerald-500 to-emerald-600',
                        'from-violet-500 to-violet-600',
                        'from-amber-500 to-amber-600',
                        'from-rose-500 to-rose-600',
                        'from-cyan-500 to-cyan-600',
                        'from-indigo-500 to-indigo-600',
                        'from-pink-500 to-pink-600',
                      ]
                      return (
                        <div key={supervisor.id} className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center text-white text-sm font-bold`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">{supervisor.full_name}</p>
                              <span className="text-sm font-bold text-foreground ml-2">{supervisor.supervisionCount}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div 
                                className={`bg-gradient-to-r ${colors[index % colors.length]} h-2.5 rounded-full transition-all duration-500`}
                                style={{ width: `${Math.max(percentage, 5)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">{percentage}%</span>
                        </div>
                      )
                    })}
                    {supervisors.length > 0 && (
                      <div className="pt-4 border-t border-border mt-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{t('avgPerSupervisor')}</span>
                          <span className="font-bold text-lg text-primary">
                            {(stats.total / supervisors.length).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supervisions by Type - Visual Chart */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <PieChart className="w-5 h-5 text-violet-600" />
                  </div>
                  {t('supervisionsByType')}
                </CardTitle>
                <CardDescription>{t('distributionByCategory')}</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.byType).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('noData')}</p>
                ) : (
                  <div className="space-y-6">
                    {/* Visual Bars */}
                    <div className="space-y-4">
                      {Object.entries(stats.byType).map(([type, count]) => {
                        const percentage = stats.total > 0 
                          ? Math.round((count / stats.total) * 100) 
                          : 0
                        const colors: Record<string, { bg: string; text: string; bar: string }> = {
                          pfe: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600', bar: 'from-blue-500 to-blue-600' },
                          master: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600', bar: 'from-emerald-500 to-emerald-600' },
                          doctorate: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600', bar: 'from-violet-500 to-violet-600' },
                          internship: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', bar: 'from-amber-500 to-amber-600' },
                        }
                        const style = colors[type] || { bg: 'bg-gray-100', text: 'text-gray-600', bar: 'from-gray-500 to-gray-600' }
                        return (
                          <div key={type} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center`}>
                                  <GraduationCap className={`w-5 h-5 ${style.text}`} />
                                </div>
                                <span className="font-medium text-foreground">{typeLabels[type] || type}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-foreground">{count}</span>
                                <span className="text-sm text-muted-foreground ml-2">({percentage}%)</span>
                              </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3">
                              <div 
                                className={`bg-gradient-to-r ${style.bar} h-3 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Annual Report Summary - Enhanced */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  {t('annualReport')}
                </CardTitle>
                <CardDescription>
                  {selectedYear === 'all' ? t('summaryAllYears') : `${t('summaryForYear')} ${selectedYear}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Success Rate */}
                  <div className="relative overflow-hidden p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{t('successRate')}</p>
                      </div>
                      <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                        {stats.completed} {t('completedOutOf')} {stats.total}
                      </p>
                    </div>
                  </div>

                  {/* Average Load */}
                  <div className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 dark:bg-blue-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{t('averageLoad')}</p>
                      </div>
                      <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                        {supervisors.length > 0 ? (stats.total / supervisors.length).toFixed(1) : 0}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        {t('supervisionsPerTeacher')}
                      </p>
                    </div>
                  </div>

                  {/* Active Supervisors */}
                  <div className="relative overflow-hidden p-6 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-2xl border border-violet-200 dark:border-violet-800">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-200/30 dark:bg-violet-700/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-violet-600" />
                        <p className="text-sm font-medium text-violet-800 dark:text-violet-200">{t('activeSupervisors')}</p>
                      </div>
                      <p className="text-4xl font-bold text-violet-600 dark:text-violet-400">
                        {supervisors.filter(s => s.supervisionCount > 0).length}
                      </p>
                      <p className="text-xs text-violet-700 dark:text-violet-300 mt-2">
                        {t('outOf')} {supervisors.length} {t('teachers')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
