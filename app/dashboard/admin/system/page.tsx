'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, RefreshCw, Download, Trash2, AlertCircle, CheckCircle2, Clock, Users, FileText } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/components/providers'

interface HealthStatus {
  status: string
  timestamp: string
  tables: { [key: string]: number }
  databaseSize?: string
  totalRecords: number
}

interface SystemLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  details: string
  created_at: string
}

export default function SystemManagementPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { language } = useLanguage()

  useEffect(() => {
    fetchHealthStatus()
    fetchLogs()
  }, [])

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/admin/system/db-health')
      const data = await response.json()
      if (response.ok) {
        setHealth(data)
      } else {
        setError(data.error || 'Failed to fetch health status')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/system/logs?limit=50')
      const data = await response.json()
      if (response.ok) {
        setLogs(data.logs)
      }
    } catch (err: any) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMaintenance = async (type: string) => {
    try {
      setMaintenance(true)
      const response = await fetch('/api/admin/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const data = await response.json()
      if (response.ok) {
        setError(null)
        fetchHealthStatus()
        fetchLogs()
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setMaintenance(false)
    }
  }

  const handleBackup = async () => {
    try {
      setMaintenance(true)
      const response = await fetch('/api/admin/system/backup', {
        method: 'POST'
      })

      const data = await response.json()
      if (response.ok) {
        // Download backup as JSON
        const element = document.createElement('a')
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data.backup, null, 2)))
        element.setAttribute('download', `backup-${new Date().toISOString()}.json`)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        setError(null)
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setMaintenance(false)
    }
  }

  const translations = {
    en: {
      title: 'System Management',
      description: 'Database health, backups, and system maintenance',
      health: 'Database Health',
      tables: 'Tables',
      records: 'Total Records',
      lastCheck: 'Last Check',
      backup: 'Backup & Recovery',
      createBackup: 'Create Backup',
      maintenance: 'Maintenance Tasks',
      cleanupSessions: 'Clean Expired Sessions',
      clearNotifications: 'Clear Old Notifications',
      optimize: 'Optimize Database',
      healthCheck: 'Health Check',
      logs: 'System Logs',
      action: 'Action',
      entity: 'Entity',
      timestamp: 'Timestamp',
      details: 'Details',
      status: 'Status',
      success: 'Success',
      failed: 'Failed'
    },
    fr: {
      title: 'Gestion du Système',
      description: 'Santé de la base de données, sauvegardes et maintenance',
      health: 'Santé de la Base de Données',
      tables: 'Tableaux',
      records: 'Nombre Total d\'Enregistrements',
      lastCheck: 'Dernier Contrôle',
      backup: 'Sauvegarde et Récupération',
      createBackup: 'Créer une Sauvegarde',
      maintenance: 'Tâches de Maintenance',
      cleanupSessions: 'Nettoyer les Sessions Expirées',
      clearNotifications: 'Effacer les Anciennes Notifications',
      optimize: 'Optimiser la Base de Données',
      healthCheck: 'Vérifier la Santé',
      logs: 'Journaux Système',
      action: 'Action',
      entity: 'Entité',
      timestamp: 'Horodatage',
      details: 'Détails',
      status: 'Statut',
      success: 'Succès',
      failed: 'Échec'
    }
  }

  const t = translations[language as keyof typeof translations] || translations.en

  if (loading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-gray-500">{t.description}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health">
            <Database className="w-4 h-4 mr-2" />
            {t.health}
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Download className="w-4 h-4 mr-2" />
            {t.backup}
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="w-4 h-4 mr-2" />
            {t.logs}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          {health && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t.records}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{health.totalRecords}</div>
                    <p className="text-xs text-gray-500">{t.tables}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t.lastCheck}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <Badge variant="outline">Healthy</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Table Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(health.tables).map(([table, count]) => (
                      <div key={table} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="font-medium capitalize">{table}</span>
                        <Badge variant="secondary">{count} records</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleMaintenance('health_check')}
                  disabled={maintenance}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t.healthCheck}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMaintenance('optimize_database')}
                  disabled={maintenance}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t.optimize}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="backup">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Backup</CardTitle>
                <CardDescription>Create a full database backup for recovery purposes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleBackup}
                  disabled={maintenance}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {maintenance ? 'Creating...' : t.createBackup}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => handleMaintenance('cleanup_expired_sessions')}
                  disabled={maintenance}
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t.cleanupSessions}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMaintenance('clear_notifications')}
                  disabled={maintenance}
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t.clearNotifications}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>System and administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-500">No logs found</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">{log.action}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
