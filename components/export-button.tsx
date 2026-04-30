'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Download, FileJson, File, Sheet } from 'lucide-react'

interface ExportButtonProps {
  data: any[]
  filename?: string
  disabled?: boolean
}

function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header]
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ''
        })
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename || 'export'}.csv`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

function downloadJSON(data: any[], filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename || 'export'}.json`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

function downloadExcel(data: any[], filename: string) {
  // For now, we'll export as CSV with .xlsx extension
  // In production, you'd use a library like xlsx
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join('\t'),
    ...data.map(row =>
      headers.map(header => row[header] ?? '').join('\t')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename || 'export'}.xlsx`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export function ExportButton({ data, filename = 'export', disabled }: ExportButtonProps) {
  const [language, setLanguage] = useState<'en' | 'fr'>('en')

  useEffect(() => {
    const savedLang = localStorage.getItem('lmcs-language') as 'en' | 'fr' | null
    if (savedLang) setLanguage(savedLang)
  }, [])

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      export: { en: 'Export', fr: 'Exporter' },
      exportFormat: { en: 'Export Format', fr: 'Format d\'Export' },
      exportAsCSV: { en: 'Export as CSV', fr: 'Exporter en CSV' },
      exportAsJSON: { en: 'Export as JSON', fr: 'Exporter en JSON' },
      exportAsExcel: { en: 'Export as Excel', fr: 'Exporter en Excel' },
    }
    return translations[key]?.[language] || key
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !data || data.length === 0}
          className="gap-2 rounded-xl"
        >
          <Download className="w-4 h-4" />
          {t('export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        <DropdownMenuLabel>{t('exportFormat')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => downloadCSV(data, filename)}
          className="cursor-pointer gap-2"
        >
          <Sheet className="w-4 h-4" />
          <span>{t('exportAsCSV')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadJSON(data, filename)}
          className="cursor-pointer gap-2"
        >
          <FileJson className="w-4 h-4" />
          <span>{t('exportAsJSON')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadExcel(data, filename)}
          className="cursor-pointer gap-2"
        >
          <File className="w-4 h-4" />
          <span>{t('exportAsExcel')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
