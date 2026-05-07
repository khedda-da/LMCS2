'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminDebugPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-delete-' + Date.now() }),
      })
      const data = await response.json()
      setResult(data)
      toast.info('Test delete response: ' + (response.ok ? 'Success' : 'Failed'))
    } catch (err) {
      toast.error(String(err))
      setResult(err)
    } finally {
      setLoading(false)
    }
  }

  const testAuditLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/audit-logs')
      const data = await response.json()
      setResult(data)
      toast.info(`Audit logs: ${data.logs?.length || 0} entries`)
    } catch (err) {
      toast.error(String(err))
      setResult(err)
    } finally {
      setLoading(false)
    }
  }

  const testSystemLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/system/logs')
      const data = await response.json()
      setResult(data)
      toast.info(`System logs: ${data.logs?.length || 0} entries`)
    } catch (err) {
      toast.error(String(err))
      setResult(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Debug Panel</h1>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Test Delete User</CardTitle>
              <CardDescription>Tests the delete API endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testDelete} disabled={loading} className="w-full">
                {loading ? 'Testing...' : 'Test Delete'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Audit Logs</CardTitle>
              <CardDescription>Checks if audit logs are being created</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testAuditLogs} disabled={loading} className="w-full">
                {loading ? 'Testing...' : 'Test Audit Logs'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test System Logs</CardTitle>
              <CardDescription>Checks system logs endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testSystemLogs} disabled={loading} className="w-full">
                {loading ? 'Testing...' : 'Test System Logs'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
