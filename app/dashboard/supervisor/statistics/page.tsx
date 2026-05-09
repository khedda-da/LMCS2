'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/components/providers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react'

export default function SupervisorStatisticsPage() {
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSupervisions: 0,
    activeSupervisions: 0,
    completedSupervisions: 0,
    totalStudents: 0,
    supervisionsByStatus: [] as any[],
    supervisionsList: [] as any[],
  })
  const [userId, setUserId] = useState<string | null>(null)

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      mySupervisionStatistics: { en: 'My Supervision Statistics', fr: 'Mes Statistiques d\'Encadrement' },
      viewYourSupervisionData: { en: 'View your supervision statistics and metrics', fr: 'Voir vos statistiques et métriques d\'encadrement' },
      totalSupervisions: { en: 'Total Supervisions', fr: 'Total Encadrements' },
      activeSupervisions: { en: 'Active Supervisions', fr: 'Encadrements Actifs' },
      completedSupervisions: { en: 'Completed Supervisions', fr: 'Encadrements Termines' },
      totalStudents: { en: 'Total Students', fr: 'Total Etudiants' },
      supervisionsByStatus: { en: 'Supervisions by Status', fr: 'Encadrements par Statut' },
      recentSupervisions: { en: 'Recent Supervisions', fr: 'Encadrements Recents' },
      title: { en: 'Title', fr: 'Titre' },
      status: { en: 'Status', fr: 'Statut' },
      students: { en: 'Students', fr: 'Etudiants' },
      theme: { en: 'Theme', fr: 'Theme' },
      startDate: { en: 'Start Date', fr: 'Date Debut' },
      endDate: { en: 'End Date', fr: 'Date Fin' },
      noData: { en: 'No supervisions found', fr: 'Aucun encadrement trouve' },
      active: { en: 'Active', fr: 'Actif' },
      completed: { en: 'Completed', fr: 'Termine' },
      on_hold: { en: 'On Hold', fr: 'En Attente' },
      loading: { en: 'Loading...', fr: 'Chargement...' },
    }
    return translations[key]?.[language] || key
  }

  useEffect(() => {
    async function fetchSupervisionStats() {
      const supabase = createClient()
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        setUserId(user.id)

        // Fetch supervisions where user is teacher_id
        const { data: supervisions, error } = await supabase
          .from('supervisions')
          .select(`
            id,
            title,
            status,
            teacher_id,
            student_id,
            students,
            theme_id,
            start_date,
            end_date,
            academic_year,
            created_at
          `)
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Fetch related students and themes
        let enrichedSupervisions = supervisions || []
        
        if (supervisions && supervisions.length > 0) {
          // Get unique student IDs
          const studentIds = [
            ...new Set(
              supervisions
                .flatMap(s => {
                  const ids: string[] = []
                  if (s.students && Array.isArray(s.students)) {
                    ids.push(...s.students)
                  }
                  if (s.student_id) {
                    ids.push(s.student_id)
                  }
                  return ids
                })
                .filter(Boolean)
            )
          ]

          const themeIds = [...new Set(supervisions.map(s => s.theme_id).filter(Boolean))]

          // Fetch students and themes
          const { data: students } = studentIds.length > 0
            ? await supabase.from('students').select('id, full_name').in('id', studentIds)
            : { data: [] }

          const { data: themes } = themeIds.length > 0
            ? await supabase.from('themes').select('id, name').in('id', themeIds)
            : { data: [] }

          const studentMap = new Map((students || []).map(s => [s.id, s]))
          const themeMap = new Map((themes || []).map(t => [t.id, t]))

          enrichedSupervisions = supervisions.map(sup => {
            let studentList: any[] = []
            if (sup.students && Array.isArray(sup.students)) {
              studentList = sup.students.map(id => studentMap.get(id)).filter(Boolean)
            } else if (sup.student_id) {
              const student = studentMap.get(sup.student_id)
              if (student) studentList = [student]
            }
            return {
              ...sup,
              studentList,
              theme: themeMap.get(sup.theme_id),
            }
          })
        }

        // Calculate statistics
        const activeCount = (supervisions || []).filter(s => s.status === 'active').length
        const completedCount = (supervisions || []).filter(s => s.status === 'completed').length
        
        // Count unique students
        const uniqueStudents = new Set(
          (supervisions || [])
            .flatMap(s => {
              const ids: string[] = []
              if (s.students && Array.isArray(s.students)) {
                ids.push(...s.students)
              }
              if (s.student_id) {
                ids.push(s.student_id)
              }
              return ids
            })
            .filter(Boolean)
        ).size

        // Group by status
        const statusCounts = (supervisions || []).reduce((acc: any, sup) => {
          const existing = acc.find((s: any) => s.name === sup.status)
          if (existing) {
            existing.value += 1
          } else {
            acc.push({ name: sup.status, value: 1 })
          }
          return acc
        }, [])

        setStats({
          totalSupervisions: supervisions?.length || 0,
          activeSupervisions: activeCount,
          completedSupervisions: completedCount,
          totalStudents: uniqueStudents,
          supervisionsByStatus: statusCounts,
          supervisionsList: enrichedSupervisions,
        })
      } catch (error) {
        console.error('Error fetching supervision stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSupervisionStats()
  }, [])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader className="w-8 h-8 animate-spin" />
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('mySupervisionStatistics')}</h1>
        <p className="text-gray-600 mt-2">{t('viewYourSupervisionData')}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalSupervisions')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSupervisions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeSupervisions')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSupervisions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('completedSupervisions')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSupervisions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalStudents')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('supervisionsByStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.supervisionsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.supervisionsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.supervisionsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t('noData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('recentSupervisions')}</CardTitle>
            <CardDescription>Last 5 supervisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.supervisionsList.length > 0 ? (
                stats.supervisionsList.slice(0, 5).map((sup) => (
                  <div key={sup.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{sup.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {sup.studentList && sup.studentList.length > 0 
                          ? sup.studentList.map(s => s.full_name).join(', ')
                          : 'No students'
                        }
                      </p>
                    </div>
                    <Badge variant="outline">{sup.status}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">{t('noData')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Supervisions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentSupervisions')}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.supervisionsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-2">{t('title')}</th>
                    <th className="text-left py-2 px-2">{t('students')}</th>
                    <th className="text-left py-2 px-2">{t('theme')}</th>
                    <th className="text-left py-2 px-2">{t('status')}</th>
                    <th className="text-left py-2 px-2">{t('startDate')}</th>
                    <th className="text-left py-2 px-2">{t('endDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.supervisionsList.map((sup) => (
                    <tr key={sup.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">{sup.title}</td>
                      <td className="py-3 px-2">
                        {sup.studentList && sup.studentList.length > 0 
                          ? sup.studentList.map(s => s.full_name).join(', ')
                          : 'No students'
                        }
                      </td>
                      <td className="py-3 px-2">{sup.theme?.name || 'N/A'}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{sup.status}</Badge>
                      </td>
                      <td className="py-3 px-2">{sup.start_date || 'N/A'}</td>
                      <td className="py-3 px-2">{sup.end_date || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t('noData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
