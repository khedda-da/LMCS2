'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardNav from '@/components/dashboard/dashboard-nav'
import { useLanguage } from '@/components/providers'
import { FileSpreadsheet, FileJson, FileText, Download, CheckCircle2, AlertCircle, Printer } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ExportPage() {
  const { language } = useLanguage()

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      exportTitle: { en: 'Export & Reports', fr: 'Export et Rapports' },
      exportSubtitle: { en: 'Download supervision data in various formats', fr: 'Telecharger les donnees d\'encadrement dans differents formats' },
      success: { en: 'Success', fr: 'Succes' },
      error: { en: 'Error', fr: 'Erreur' },
      pdfReport: { en: 'PDF Report', fr: 'Rapport PDF' },
      pdfDesc: { en: 'Generate a formatted PDF report with all supervision details', fr: 'Generer un rapport PDF formate avec tous les details d\'encadrement' },
      csvSpreadsheet: { en: 'CSV Spreadsheet', fr: 'Feuille de calcul CSV' },
      csvDesc: { en: 'Export data as CSV for use in Excel or Google Sheets', fr: 'Exporter les donnees en CSV pour Excel ou Google Sheets' },
      jsonData: { en: 'JSON Data', fr: 'Donnees JSON' },
      jsonDesc: { en: 'Export structured JSON for API integration', fr: 'Exporter des donnees JSON structurees pour integration API' },
      professionalFormatting: { en: 'Professional formatting', fr: 'Formatage professionnel' },
      printReadyLayout: { en: 'Print-ready layout', fr: 'Mise en page prete a imprimer' },
      summaryStatistics: { en: 'Summary statistics', fr: 'Statistiques resumees' },
      excelCompatible: { en: 'Excel compatible', fr: 'Compatible Excel' },
      easyDataAnalysis: { en: 'Easy data analysis', fr: 'Analyse de donnees facile' },
      pivotTableReady: { en: 'Pivot table ready', fr: 'Pret pour tableau croise' },
      structuredFormat: { en: 'Structured format', fr: 'Format structure' },
      apiReady: { en: 'API ready', fr: 'Pret pour API' },
      fullDataExport: { en: 'Full data export', fr: 'Export complet des donnees' },
      generatePDF: { en: 'Generate PDF', fr: 'Generer PDF' },
      exportCSV: { en: 'Export CSV', fr: 'Exporter CSV' },
      exportJSON: { en: 'Export JSON', fr: 'Exporter JSON' },
      exporting: { en: 'Exporting...', fr: 'Exportation...' },
      aboutExports: { en: 'About Exports', fr: 'A propos des Exports' },
      whatDataIncluded: { en: 'What data is included?', fr: 'Quelles donnees sont incluses?' },
      dataIncludedDesc: { en: 'All supervision records you have access to, including title, type, status, student information, research theme, dates, and supervisor details.', fr: 'Tous les enregistrements d\'encadrement auxquels vous avez acces, y compris le titre, le type, le statut, les informations sur l\'etudiant, le theme de recherche, les dates et les details du superviseur.' },
      privacyAccess: { en: 'Privacy & Access', fr: 'Confidentialite et Acces' },
      privacyDesc: { en: 'Only supervisions you have permission to view (based on your role) will be included. Admins and directors can export all records.', fr: 'Seuls les encadrements que vous etes autorise a consulter (selon votre role) seront inclus. Les administrateurs et directeurs peuvent exporter tous les enregistrements.' },
    }
    return translations[key]?.[language] || key
  }
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

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

      setLoading(false)
    }

    getUser()
  }, [supabase, router])

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(format)
    setMessage(null)

    try {
      const response = await fetch(`/api/export/supervisions?format=${format}`)

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `supervisions.${format === 'csv' ? 'csv' : 'json'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: `Successfully exported as ${format.toUpperCase()}` })
    } catch (error) {
      console.error('Export error:', error)
      setMessage({ type: 'error', text: 'Failed to export data' })
    } finally {
      setExporting(null)
    }
  }

  const handlePDFExport = async () => {
    setExporting('pdf')
    setMessage(null)

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
        
        setMessage({ type: 'success', text: 'PDF report opened. Use your browser\'s print dialog to save as PDF.' })
      } else {
        // If popup is blocked, try downloading the HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'lmcs-supervision-report.html'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        setMessage({ type: 'success', text: 'Report downloaded as HTML. Open it in your browser and use Print to save as PDF.' })
      }
    } catch (error) {
      console.error('PDF export error:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to generate PDF' })
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav user={user} userRole={userRole} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const exportOptions = [
    {
      id: 'pdf',
      title: t('pdfReport'),
      description: t('pdfDesc'),
      icon: FileText,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      hoverColor: 'hover:border-red-400 dark:hover:border-red-600',
      features: [t('professionalFormatting'), t('printReadyLayout'), t('summaryStatistics')],
      action: handlePDFExport,
      format: 'pdf'
    },
    {
      id: 'csv',
      title: t('csvSpreadsheet'),
      description: t('csvDesc'),
      icon: FileSpreadsheet,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      hoverColor: 'hover:border-green-400 dark:hover:border-green-600',
      features: [t('excelCompatible'), t('easyDataAnalysis'), t('pivotTableReady')],
      action: () => handleExport('csv'),
      format: 'csv'
    },
    {
      id: 'json',
      title: t('jsonData'),
      description: t('jsonDesc'),
      icon: FileJson,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      hoverColor: 'hover:border-blue-400 dark:hover:border-blue-600',
      features: [t('structuredFormat'), t('apiReady'), t('fullDataExport')],
      action: () => handleExport('json'),
      format: 'json'
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} userRole={userRole} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{t('exportTitle')}</h1>
            <p className="text-muted-foreground mt-2">{t('exportSubtitle')}</p>
          </div>

          {/* Message Alert */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  message.type === 'success' 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {message.type === 'success' ? t('success') : t('error')}
                </p>
                <p className={`text-sm ${
                  message.type === 'success'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {message.text}
                </p>
              </div>
            </motion.div>
          )}

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {exportOptions.map((option, index) => {
              const Icon = option.icon
              const isExporting = exporting === option.format
              
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className={`h-full transition-all duration-300 ${option.borderColor} ${option.hoverColor} hover:shadow-lg`}>
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-xl ${option.bgColor} flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${option.color}`} />
                      </div>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {option.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={option.action}
                        disabled={exporting !== null}
                        className="w-full gap-2"
                        variant={option.id === 'pdf' ? 'default' : 'outline'}
                      >
                        {isExporting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            {t('exporting')}
                          </>
                        ) : (
                          <>
                            {option.id === 'pdf' ? <Printer className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            {option.id === 'pdf' ? t('generatePDF') : option.id === 'csv' ? t('exportCSV') : t('exportJSON')}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('aboutExports')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">{t('whatDataIncluded')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('dataIncludedDesc')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">{t('privacyAccess')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('privacyDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
