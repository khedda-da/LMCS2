'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/components/providers'
import {
  PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { Download, FileText, TrendingUp, Users, BookOpen, CheckCircle2 } from 'lucide-react'

interface Statistics {
  summary: {
    totalUsers: number
    activeSuperVisions: number
    completedSupervisions: number
    totalStudents: number
    pendingApprovals: number
  }
  charts: {
    supervisionTypes: Array<{ type: string; count: number }>
    academicYears: Array<{ year: string; count: number }>
    userRoles: Array<{ role: string; count: number }>
    sessionStatus: Array<{ status: string; count: number }>
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ReportsPage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguage()

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      reportsTitle: { en: 'Reports & Analytics', fr: 'Rapports et Analyses' },
      reportsSubtitle: { en: 'Comprehensive supervision and system statistics', fr: 'Statistiques completes des encadrements et du systeme' },
      exportCSV: { en: 'Export CSV', fr: 'Exporter CSV' },
      exportPDF: { en: 'Export PDF', fr: 'Exporter PDF' },
      totalUsers: { en: 'Total Users', fr: 'Total Utilisateurs' },
      activeSupervisions: { en: 'Active Supervisions', fr: 'Encadrements Actifs' },
      completed: { en: 'Completed', fr: 'Termines' },
      students: { en: 'Students', fr: 'Etudiants' },
      pending: { en: 'Pending', fr: 'En Attente' },
      supervisionTypesDistribution: { en: 'Supervision Types Distribution', fr: 'Repartition des Types d\'Encadrement' },
      breakdownByType: { en: 'Breakdown by type of supervision', fr: 'Repartition par type d\'encadrement' },
      userRolesDistribution: { en: 'User Roles Distribution', fr: 'Repartition des Roles Utilisateurs' },
      breakdownByRole: { en: 'Breakdown by user role', fr: 'Repartition par role utilisateur' },
      supervisionsByYear: { en: 'Supervisions by Academic Year', fr: 'Encadrements par Annee Academique' },
      distributionByYear: { en: 'Distribution across academic years', fr: 'Repartition par annees academiques' },
      sessionStatusOverview: { en: 'Session Status Overview', fr: 'Apercu des Statuts de Session' },
      sessionDistribution: { en: 'Distribution of session statuses', fr: 'Repartition des statuts de session' },
      noDataTypes: { en: 'No supervision types data available', fr: 'Aucune donnee de type d\'encadrement disponible' },
      noDataRoles: { en: 'No user roles data available', fr: 'Aucune donnee de role utilisateur disponible' },
      noDataYears: { en: 'No academic year data available', fr: 'Aucune donnee d\'annee academique disponible' },
      noDataSessions: { en: 'No session data available', fr: 'Aucune donnee de session disponible' },
      refreshStats: { en: 'Refresh Statistics', fr: 'Actualiser les Statistiques' },
      loadingStats: { en: 'Loading statistics...', fr: 'Chargement des statistiques...' },
      retry: { en: 'Retry', fr: 'Reessayer' },
      error: { en: 'Error', fr: 'Erreur' },
    }
    return translations[key]?.[language] || key
  }

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/statistics')
      if (!response.ok) throw new Error('Failed to fetch statistics')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!stats) return

    const data = [
      ['LMCS Laboratory - Statistics Report'],
      ['Generated:', new Date().toLocaleString()],
      [],
      ['SUMMARY STATISTICS'],
      ['Total Users', stats.summary.totalUsers],
      ['Active Supervisions', stats.summary.activeSuperVisions],
      ['Completed Supervisions', stats.summary.completedSupervisions],
      ['Total Students', stats.summary.totalStudents],
      ['Pending Approvals', stats.summary.pendingApprovals],
      [],
      ['SUPERVISION TYPES'],
      ['Type', 'Count'],
      ...stats.charts.supervisionTypes.map(item => [item.type, item.count]),
      [],
      ['ACADEMIC YEARS'],
      ['Year', 'Count'],
      ...stats.charts.academicYears.map(item => [item.year, item.count]),
      [],
      ['USER ROLES'],
      ['Role', 'Count'],
      ...stats.charts.userRoles.map(item => [item.role, item.count]),
    ]

    const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `LMCS-Statistics-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleExportPDF = async () => {
    try {
      // Fetch the HTML content from the API
      const response = await fetch('/api/export/pdf')
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDF content')
      }

      const htmlContent = await response.text()
      
      // Create a new window and write the HTML content
      const printWindow = window.open('', '_blank')
      
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
          }, 300)
        }
        
        // Fallback: trigger print after a delay if onload doesn't fire
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.print()
          }
        }, 1000)
      } else {
        // If popup is blocked, try downloading the HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'lmcs-statistics-report.html'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('PDF export error:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate PDF')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loadingStats')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 font-medium">{t('error')}: {error}</p>
          <Button onClick={fetchStatistics} className="mt-4">{t('retry')}</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-blue-600" />
            {t('reportsTitle')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('reportsSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            {t('exportCSV')}
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            {t('exportPDF')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('totalUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats?.summary.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {t('activeSupervisions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats?.summary.activeSuperVisions || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t('completed')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats?.summary.completedSupervisions || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('students')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats?.summary.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">{t('pending')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">{stats?.summary.pendingApprovals || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supervision Types */}
        <Card>
          <CardHeader>
            <CardTitle>{t('supervisionTypesDistribution')}</CardTitle>
            <CardDescription>{t('breakdownByType')}</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.charts.supervisionTypes && stats.charts.supervisionTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.charts.supervisionTypes.map((item, idx) => ({
                      name: item.type || 'Unknown',
                      value: item.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.charts.supervisionTypes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                {t('noDataTypes')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Roles */}
        <Card>
          <CardHeader>
            <CardTitle>{t('userRolesDistribution')}</CardTitle>
            <CardDescription>{t('breakdownByRole')}</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.charts.userRoles && stats.charts.userRoles.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.charts.userRoles.map(item => ({
                  name: item.role || 'Unknown',
                  count: item.count,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                {t('noDataRoles')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Years */}
        <Card>
          <CardHeader>
            <CardTitle>{t('supervisionsByYear')}</CardTitle>
            <CardDescription>{t('distributionByYear')}</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.charts.academicYears && stats.charts.academicYears.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.charts.academicYears.map(item => ({
                  year: item.year || 'Unknown',
                  count: item.count,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                {t('noDataYears')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sessionStatusOverview')}</CardTitle>
            <CardDescription>{t('sessionDistribution')}</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.charts.sessionStatus && stats.charts.sessionStatus.length > 0 ? (
              <div className="space-y-4">
                {stats.charts.sessionStatus.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm capitalize">{item.status}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(item.count * 20, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                {t('noDataSessions')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refresh Data */}
      <div className="flex justify-center">
        <Button onClick={fetchStatistics} variant="outline" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          {t('refreshStats')}
        </Button>
      </div>
    </div>
  )
}
