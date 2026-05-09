'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Filter, X } from 'lucide-react'

interface StatisticsFilterProps {
  onFilterChange: (filters: StatisticsFilters) => void
  supervisors: Array<{ id: string; full_name: string }>
  years: string[]
  loading?: boolean
}

export interface StatisticsFilters {
  status: string
  type: string
  supervisor: string
  academicYear: string
  startDate: string
  endDate: string
  yearOfStudy: string
}

const defaultFilters: StatisticsFilters = {
  status: 'all',
  type: 'all',
  supervisor: 'all',
  academicYear: 'all',
  startDate: '',
  endDate: '',
  yearOfStudy: 'all',
}

export function StatisticsFilterPanel({ onFilterChange, supervisors, years, loading }: StatisticsFilterProps) {
  const [filters, setFilters] = useState<StatisticsFilters>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [language, setLanguage] = useState<'en' | 'fr'>('en')

  useEffect(() => {
    const savedLang = localStorage.getItem('lmcs-language') as 'en' | 'fr' | null
    if (savedLang) setLanguage(savedLang)
  }, [])

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      advancedFilters: { en: 'Advanced Filters', fr: 'Filtres Avances' },
      active: { en: 'Active', fr: 'Actif' },
      allStatuses: { en: 'All Statuses', fr: 'Tous les Statuts' },
      allTypes: { en: 'All Types', fr: 'Tous les Types' },
      allSupervisors: { en: 'All Supervisors', fr: 'Tous les Encadrants' },
      allYears: { en: 'All Years', fr: 'Toutes les Annees' },
      status: { en: 'Status', fr: 'Statut' },
      type: { en: 'Type', fr: 'Type' },
      supervisor: { en: 'Supervisor', fr: 'Encadrant' },
      academicYear: { en: 'Academic Year', fr: 'Annee Academique' },
      yearOfStudy: { en: 'Year of Study', fr: 'Annee d\'Etude' },
      startDate: { en: 'Start Date From', fr: 'Date de Debut' },
      endDate: { en: 'End Date To', fr: 'Date de Fin' },
      resetFilters: { en: 'Reset Filters', fr: 'Reinitialiser' },
      close: { en: 'Close', fr: 'Fermer' },
      pending: { en: 'Pending', fr: 'En attente' },
      completed: { en: 'Completed', fr: 'Termine' },
      defended: { en: 'Defended', fr: 'Soutenu' },
      onHold: { en: 'On Hold', fr: 'En pause' },
      suspended: { en: 'Suspended', fr: 'Suspendu' },
      abandoned: { en: 'Abandoned', fr: 'Abandonne' },
      pfe: { en: 'PFE Engineer', fr: 'PFE Ingenieur' },
      master: { en: 'Master Thesis', fr: 'Memoire de Master' },
      doctorate: { en: 'Doctorate Thesis', fr: 'These de Doctorat' },
      spe: { en: 'Academic Internship', fr: 'Stage Academique' },
      research: { en: 'Research Project', fr: 'Projet de Recherche' },
    }
    return translations[key]?.[language] || key
  }

  const handleFilterChange = (key: keyof StatisticsFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const isFiltered = Object.entries(filters).some(([key, value]) => {
    if (key === 'startDate' || key === 'endDate') return value !== ''
    return value !== 'all'
  })

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowFilters(!showFilters)}
        variant="outline"
        className="gap-2"
        disabled={loading}
      >
        <Filter className="w-4 h-4" />
        {t('advancedFilters')}
        {isFiltered && (
          <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">
            {language === 'fr' ? 'Actif' : 'Active'}
          </span>
        )}
      </Button>

      {showFilters && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('status')}</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="completed">{t('completed')}</SelectItem>
                    <SelectItem value="defended">{t('defended')}</SelectItem>
                    <SelectItem value="on_hold">{t('onHold')}</SelectItem>
                    <SelectItem value="suspended">{t('suspended')}</SelectItem>
                    <SelectItem value="abandoned">{t('abandoned')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('type')}</label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTypes')}</SelectItem>
                    <SelectItem value="pfe">{t('pfe')}</SelectItem>
                    <SelectItem value="master">{t('master')}</SelectItem>
                    <SelectItem value="doctorate">{t('doctorate')}</SelectItem>
                    <SelectItem value="spe">{t('spe')}</SelectItem>
                    <SelectItem value="research">{t('research')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Supervisor Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('supervisor')}</label>
                <Select value={filters.supervisor} onValueChange={(value) => handleFilterChange('supervisor', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allSupervisors')}</SelectItem>
                    {supervisors.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Academic Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('academicYear')}</label>
                <Select value={filters.academicYear} onValueChange={(value) => handleFilterChange('academicYear', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allYears')}</SelectItem>
                    {years.sort().reverse().map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year of Study Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('yearOfStudy')}</label>
                <Select value={filters.yearOfStudy} onValueChange={(value) => handleFilterChange('yearOfStudy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allYears')}</SelectItem>
                    <SelectItem value="1cs">1 CS</SelectItem>
                    <SelectItem value="2cs">2 CS</SelectItem>
                    <SelectItem value="3cs">3 CS</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                    <SelectItem value="doctorat">Doctorate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('startDate')}</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              {/* End Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('endDate')}</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              {isFiltered && (
                <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
                  <X className="w-4 h-4" />
                  {t('resetFilters')}
                </Button>
              )}
              <Button onClick={() => setShowFilters(false)} size="sm">
                {t('close')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}