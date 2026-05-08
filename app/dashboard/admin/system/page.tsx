'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, RefreshCw, Download, Trash2, AlertCircle, CheckCircle2, Clock, Users, FileText, Upload } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/components/providers'
import { toast } from 'sonner'

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
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
        console.log('[v0] Logs fetched:', data.logs)
        setLogs(data.logs || [])
      } else {
        console.error('[v0] Logs fetch error:', data)
      }
    } catch (err: any) {
      console.error('[v0] Failed to fetch logs:', err)
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
        toast.success('Backup created successfully')
      } else {
        setError(data.error)
        toast.error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setMaintenance(false)
    }
  }

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a valid JSON file')
      return
    }

    try {
      setRestoring(true)
      console.log('[v0] Starting database restore with file:', file.name)
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/system/restore', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      console.log('[v0] Restore response:', data)

      if (response.ok) {
        toast.success(`Database restored: ${data.restoredCount} records recovered`)
        setError(null)
        
        if (data.errors && data.errors.length > 0) {
          toast.warning(`${data.errors.length} errors occurred during restore`)
          console.error('[v0] Restore errors:', data.errors)
        }
        
        // Force page reload to ensure all cached data is cleared and new data is fetched
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setError(data.error)
        toast.error(data.error)
        console.error('[v0] Restore failed:', data.error)
      }
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      console.error('[v0] Restore error:', err)
    } finally {
      setRestoring(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
      restoreBackup: 'Restore from Backup',
      selectFile: 'Select JSON file',
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
      restoreBackup: 'Restaurer à partir d\'une Sauvegarde',
      selectFile: 'Sélectionner fichier JSON',
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
            {/* Backup Info Alert */}
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Password Recovery Enabled:</strong> Backups now include password hashes. When you restore deleted users, they can immediately login with their previous passwords.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Database Backup</CardTitle>
                <CardDescription>Create a full database backup including user passwords for recovery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Backup includes all database tables and user password hashes. Users can be restored with full access recovery.
                </p>
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
                <CardTitle>Database Restore</CardTitle>
                <CardDescription>Restore database from a previously created backup JSON file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                    Restoring will replace all database records. Deleted users will be restored and can login with their previous passwords.
                  </AlertDescription>
                </Alert>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                  disabled={restoring}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={restoring}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {restoring ? 'Restoring...' : t.restoreBackup}
                </Button>
                <p className="text-sm text-gray-500">{t.selectFile}</p>
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
