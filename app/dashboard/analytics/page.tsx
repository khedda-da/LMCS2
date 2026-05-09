'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import DashboardNav from '@/components/dashboard/dashboard-nav'
import { useLanguage } from '@/components/providers'
import { Filter, RotateCcw, Users, BookOpen, TrendingUp, Calendar, User } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Supervision {
  id: string
  type: string
  status: string
  created_at: string
  academic_year: string
  teacher_id: string
  student_id: string | null
  title: string
}

interface Supervisor {
  id: string
  full_name: string
  email: string
}

export default function AnalyticsPage() {
  const { language } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [supervisions, setSupervisions] = useState<Supervision[]>([])
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Multi-criteria filters
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [supervisorFilter, setSupervisorFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      analyticsTitle: { en: 'Analytics & Statistics', fr: 'Analyses et Statistiques' },
      analyticsSubtitle: { en: 'Multi-criteria supervision insights and reports', fr: 'Statistiques multi-criteres et rapports d\'encadrement' },
      supervisionTypes: { en: 'Supervision Types', fr: 'Types d\'Encadrement' },
      typeDistribution: { en: 'Distribution of supervision types', fr: 'Repartition des types d\'encadrement' },
      statusDistribution: { en: 'Status Distribution', fr: 'Repartition par Statut' },
      statusBreakdown: { en: 'Breakdown by supervision status', fr: 'Repartition par statut d\'encadrement' },
      monthlyTrend: { en: 'Monthly Supervision Trend', fr: 'Tendance Mensuelle des Encadrements' },
      monthlyCreated: { en: 'Number of supervisions created over time', fr: 'Nombre d\'encadrements crees dans le temps' },
      supervisorWorkload: { en: 'Supervisor Workload', fr: 'Charge par Encadrant' },
      supervisorWorkloadDesc: { en: 'Supervisions per researcher', fr: 'Encadrements par chercheur' },
      noDataAvailable: { en: 'No data available', fr: 'Aucune donnee disponible' },
      supervisionsCreated: { en: 'Supervisions Created', fr: 'Encadrements Crees' },
      filters: { en: 'Filters', fr: 'Filtres' },
      resetFilters: { en: 'Reset Filters', fr: 'Reinitialiser les Filtres' },
      period: { en: 'Period', fr: 'Periode' },
      allPeriods: { en: 'All Periods', fr: 'Toutes les Periodes' },
      last30Days: { en: 'Last 30 Days', fr: 'Derniers 30 Jours' },
      last90Days: { en: 'Last 90 Days', fr: 'Derniers 90 Jours' },
      last6Months: { en: 'Last 6 Months', fr: 'Derniers 6 Mois' },
      lastYear: { en: 'Last Year', fr: 'Derniere Annee' },
      supervisor: { en: 'Supervisor', fr: 'Encadrant' },
      allSupervisors: { en: 'All Supervisors', fr: 'Tous les Encadrants' },
      type: { en: 'Type', fr: 'Type' },
      allTypes: { en: 'All Types', fr: 'Tous les Types' },
      status: { en: 'Status', fr: 'Statut' },
      allStatuses: { en: 'All Statuses', fr: 'Tous les Statuts' },
      academicYear: { en: 'Academic Year', fr: 'Annee Academique' },
      allYears: { en: 'All Years', fr: 'Toutes les Annees' },
      totalSupervisions: { en: 'Total Supervisions', fr: 'Total Encadrements' },
      activeSupervisions: { en: 'Active', fr: 'Actifs' },
      completedSupervisions: { en: 'Completed', fr: 'Termines' },
      pendingSupervisions: { en: 'Pending', fr: 'En Attente' },
      filtered: { en: 'filtered', fr: 'filtre(s)' },
      pfe: { en: 'PFE Engineer', fr: 'PFE Ingenieur' },
      master: { en: 'Master Thesis', fr: 'Memoire de Master' },
      doctorate: { en: 'Doctorate Thesis', fr: 'These de Doctorat' },
      spe: { en: 'Academic Internship (SPE)', fr: 'Stage Academique (SPE)' },
      research: { en: 'Research Project', fr: 'Projet de Recherche' },
      active: { en: 'Active', fr: 'Actif' },
      completed: { en: 'Completed', fr: 'Termine' },
      pending: { en: 'Pending', fr: 'En attente' },
      suspended: { en: 'Suspended', fr: 'Suspendu' },
      defended: { en: 'Defended', fr: 'Soutenu' },
      onHold: { en: 'On Hold', fr: 'En pause' },
      abandoned: { en: 'Abandoned', fr: 'Abandonne' },
      supervisions: { en: 'supervisions', fr: 'encadrements' },
    }
    return translations[key]?.[language] || key
  }

  const typeLabels: Record<string, string> = {
    pfe: t('pfe'),
    master: t('master'),
    doctorate: t('doctorate'),
    spe: t('spe'),
    research: t('research'),
  }

  const statusLabels: Record<string, string> = {
    active: t('active'),
    completed: t('completed'),
    pending: t('pending'),
    suspended: t('suspended'),
    defended: t('defended'),
    on_hold: t('onHold'),
    abandoned: t('abandoned'),
  }

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userProfile) {
        setUserRole(userProfile.role)
      }

      // Load supervisions data
      const { data: supervisionsData } = await supabase
        .from('supervisions')
        .select('*')
        .order('created_at', { ascending: false })

      if (supervisionsData) {
        setSupervisions(supervisionsData)
      }

      // Load supervisors
      const { data: supervisorsData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('role', 'supervisor')
        .eq('is_approved', true)

      if (supervisorsData) {
        setSupervisors(supervisorsData)
      }

      setLoading(false)
    }

    loadData()
  }, [supabase, router])

  // Get unique values for filters
  const academicYears = useMemo(() => {
    const years = new Set<string>()
    supervisions.forEach(s => {
      if (s.academic_year) years.add(s.academic_year)
    })
    return Array.from(years).sort().reverse()
  }, [supervisions])

  const supervisionTypes = useMemo(() => {
    const types = new Set<string>()
    supervisions.forEach(s => {
      if (s.type) types.add(s.type)
    })
    return Array.from(types)
  }, [supervisions])

  const supervisionStatuses = useMemo(() => {
    const statuses = new Set<string>()
    supervisions.forEach(s => {
      if (s.status) statuses.add(s.status)
    })
    return Array.from(statuses)
  }, [supervisions])

  // Apply filters
  const filteredSupervisions = useMemo(() => {
    let result = [...supervisions]

    // Period filter
    if (periodFilter !== 'all') {
      const now = new Date()
      let cutoffDate: Date

      switch (periodFilter) {
        case '30days':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90days':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '6months':
          cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          break
        case '1year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0)
      }

      result = result.filter(s => new Date(s.created_at) >= cutoffDate)
    }

    // Supervisor filter
    if (supervisorFilter !== 'all') {
      result = result.filter(s => s.teacher_id === supervisorFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(s => s.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter)
    }

    // Academic year filter
    if (yearFilter !== 'all') {
      result = result.filter(s => s.academic_year === yearFilter)
    }

    return result
  }, [supervisions, periodFilter, supervisorFilter, typeFilter, statusFilter, yearFilter])

  // Calculate statistics based on filtered data
  const stats = useMemo(() => {
    const total = filteredSupervisions.length
    const active = filteredSupervisions.filter(s => s.status === 'active').length
    const completed = filteredSupervisions.filter(s => s.status === 'completed' || s.status === 'defended').length
    const pending = filteredSupervisions.filter(s => s.status === 'pending').length

    return { total, active, completed, pending }
  }, [filteredSupervisions])

  // Type distribution
  const typeDistribution = useMemo(() => {
    const types: Record<string, number> = {}
    filteredSupervisions.forEach(s => {
      const type = s.type || 'Unknown'
      types[type] = (types[type] || 0) + 1
    })
    return Object.entries(types).map(([name, value]) => ({
      name: typeLabels[name] || name,
      value,
    }))
  }, [filteredSupervisions])

  // Status distribution
  const statusDistribution = useMemo(() => {
    const statuses: Record<string, number> = {}
    filteredSupervisions.forEach(s => {
      const status = s.status || 'Unknown'
      statuses[status] = (statuses[status] || 0) + 1
    })
    return Object.entries(statuses).map(([name, value]) => ({
      name: statusLabels[name] || name,
      value,
    }))
  }, [filteredSupervisions])

  // Monthly trend
  const monthlyData = useMemo(() => {
    const monthly: Record<string, number> = {}
    filteredSupervisions.forEach(s => {
      const date = new Date(s.created_at)
      const monthYear = date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      monthly[monthYear] = (monthly[monthYear] || 0) + 1
    })
    return Object.entries(monthly)
      .map(([month, count]) => ({ month, count }))
      .slice(-12)
  }, [filteredSupervisions, language])

  // Supervisor workload
  const supervisorWorkload = useMemo(() => {
    const workload: Record<string, number> = {}
    filteredSupervisions.forEach(s => {
      if (s.teacher_id) {
        workload[s.teacher_id] = (workload[s.teacher_id] || 0) + 1
      }
    })
    return supervisors
      .map(sup => ({
        name: sup.full_name || sup.email,
        count: workload[sup.id] || 0,
      }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [filteredSupervisions, supervisors])

  const resetFilters = () => {
    setPeriodFilter('all')
    setSupervisorFilter('all')
    setTypeFilter('all')
    setStatusFilter('all')
    setYearFilter('all')
  }

  const isFiltered = periodFilter !== 'all' || supervisorFilter !== 'all' || 
                     typeFilter !== 'all' || statusFilter !== 'all' || yearFilter !== 'all'

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav user={user} userRole={userRole} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} userRole={userRole} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('analyticsTitle')}</h1>
            <p className="text-muted-foreground mt-2">{t('analyticsSubtitle')}</p>
          </div>
          {isFiltered && (
            <Button variant="outline" onClick={resetFilters} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              {t('resetFilters')}
            </Button>
          )}
        </div>

        {/* Multi-Criteria Filters */}
        <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5 text-blue-600" />
              {t('filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Period Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('period')}
                </label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allPeriods')}</SelectItem>
                    <SelectItem value="30days">{t('last30Days')}</SelectItem>
                    <SelectItem value="90days">{t('last90Days')}</SelectItem>
                    <SelectItem value="6months">{t('last6Months')}</SelectItem>
                    <SelectItem value="1year">{t('lastYear')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Supervisor Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  <User className="w-4 h-4 inline mr-1" />
                  {t('supervisor')}
                </label>
                <Select value={supervisorFilter} onValueChange={setSupervisorFilter}>
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allSupervisors')}</SelectItem>
                    {supervisors.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.full_name || sup.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  {t('type')}
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTypes')}</SelectItem>
                    {supervisionTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {typeLabels[type] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  {t('status')}
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    {supervisionStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status] || status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Academic Year Filter */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {t('academicYear')}
                </label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="bg-white dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allYears')}</SelectItem>
                    {academicYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {isFiltered && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                <span className="text-sm text-muted-foreground">
                  {stats.total} {t('supervisions')} {t('filtered')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('totalSupervisions')}</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                </div>
                <BookOpen className="w-10 h-10 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">{t('activeSupervisions')}</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('completedSupervisions')}</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.completed}</p>
                </div>
                <Users className="w-10 h-10 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{t('pendingSupervisions')}</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.pending}</p>
                </div>
                <Calendar className="w-10 h-10 text-amber-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Supervision Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t('supervisionTypes')}</CardTitle>
              <CardDescription>{t('typeDistribution')}</CardDescription>
            </CardHeader>
            <CardContent>
              {typeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {t('noDataAvailable')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t('statusDistribution')}</CardTitle>
              <CardDescription>{t('statusBreakdown')}</CardDescription>
            </CardHeader>
            <CardContent>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {t('noDataAvailable')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monthlyTrend')}</CardTitle>
              <CardDescription>{t('monthlyCreated')}</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      name={t('supervisionsCreated')}
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {t('noDataAvailable')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supervisor Workload */}
          <Card>
            <CardHeader>
              <CardTitle>{t('supervisorWorkload')}</CardTitle>
              <CardDescription>{t('supervisorWorkloadDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {supervisorWorkload.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={supervisorWorkload} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {t('noDataAvailable')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
