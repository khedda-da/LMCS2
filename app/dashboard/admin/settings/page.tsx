'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Lock, Shield } from 'lucide-react'
import { useLanguage } from '@/components/providers'

interface SystemSettings {
  maintenanceMode: boolean
  allowNewRegistrations: boolean
  autoApproveUsers: boolean
  enableNotifications: boolean
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowNewRegistrations: true,
    autoApproveUsers: false,
    enableNotifications: true
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()
  const supabase = createClient()

  const translations = {
    en: {
      title: 'Admin Settings',
      description: 'System configuration and security settings',
      systemConfiguration: 'System Configuration',
      maintenanceMode: 'Maintenance Mode',
      maintenanceModeDesc: 'When enabled, only admins can access the system',
      allowRegistrations: 'Allow New Registrations',
      allowRegistrationsDesc: 'Allow new users to register for accounts',
      autoApprove: 'Auto-Approve Users',
      autoApproveDesc: 'Automatically approve new user registrations',
      enableNotifications: 'Enable Notifications',
      enableNotificationsDesc: 'Send notifications to users',
      security: 'Security Settings',
      saveChanges: 'Save Changes',
      settingsSaved: 'Settings saved successfully',
      error: 'Error saving settings'
    },
    fr: {
      title: 'Paramètres Admin',
      description: 'Configuration du système et paramètres de sécurité',
      systemConfiguration: 'Configuration Système',
      maintenanceMode: 'Mode Maintenance',
      maintenanceModeDesc: 'Si activé, seuls les administrateurs peuvent accéder au système',
      allowRegistrations: 'Autoriser les Nouvelles Inscriptions',
      allowRegistrationsDesc: 'Autoriser les nouveaux utilisateurs à s\'inscrire',
      autoApprove: 'Approuver Automatiquement les Utilisateurs',
      autoApproveDesc: 'Approuver automatiquement les nouvelles inscriptions',
      enableNotifications: 'Activer les Notifications',
      enableNotificationsDesc: 'Envoyer des notifications aux utilisateurs',
      security: 'Paramètres de Sécurité',
      saveChanges: 'Enregistrer les Modifications',
      settingsSaved: 'Paramètres enregistrés avec succès',
      error: 'Erreur lors de l\'enregistrement des paramètres'
    }
  }

  const t = translations[language as keyof typeof translations] || translations.en

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Settings would normally be stored in a settings table
      // For now, we'll use localStorage as a fallback
      const stored = localStorage.getItem('adminSettings')
      if (stored) {
        setSettings(JSON.parse(stored))
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof SystemSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    try {
      // Save to localStorage for now
      localStorage.setItem('adminSettings', JSON.stringify(settings))

      // Log action
      await supabase.from('audit_logs').insert({
        action: 'SETTINGS_UPDATED',
        entity_type: 'SYSTEM',
        entity_id: 'settings',
        details: JSON.stringify(settings),
        status: 'success'
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-gray-500">{t.description}</p>
      </div>

      {saved && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{t.settingsSaved}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t.systemConfiguration}
            </CardTitle>
            <CardDescription>Configure system behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">{t.maintenanceMode}</Label>
                <p className="text-sm text-gray-500">{t.maintenanceModeDesc}</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={() => handleToggle('maintenanceMode')}
              />
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">{t.allowRegistrations}</Label>
                  <p className="text-sm text-gray-500">{t.allowRegistrationsDesc}</p>
                </div>
                <Switch
                  checked={settings.allowNewRegistrations}
                  onCheckedChange={() => handleToggle('allowNewRegistrations')}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">{t.autoApprove}</Label>
                  <p className="text-sm text-gray-500">{t.autoApproveDesc}</p>
                </div>
                <Switch
                  checked={settings.autoApproveUsers}
                  onCheckedChange={() => handleToggle('autoApproveUsers')}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">{t.enableNotifications}</Label>
                  <p className="text-sm text-gray-500">{t.enableNotificationsDesc}</p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={() => handleToggle('enableNotifications')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t.security}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Additional security features will be configured here.</p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full md:w-auto">
          {t.saveChanges}
        </Button>
      </div>
    </div>
  )
}
