'use client'

import { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FilterOptions {
  searchTerm: string
  status: string
  type: string
  sortBy: string
  academicYear: string
  searchIn: {
    title: boolean
    description: boolean
    studentName: boolean
    supervisorName: boolean
    location: boolean
    keywords: boolean
  }
}

interface AdvancedSearchProps {
  onFilter: (options: FilterOptions) => void
  loading?: boolean
  academicYears?: string[]
}

export function AdvancedSupervisionSearch({ onFilter, loading, academicYears = [] }: AdvancedSearchProps) {
  const [language, setLanguage] = useState<'en' | 'fr'>('en')
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    status: 'all',
    type: 'all',
    sortBy: 'newest',
    academicYear: 'all',
    searchIn: {
      title: true,
      description: true,
      studentName: true,
      supervisorName: true,
      location: true,
      keywords: true,
    },
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showSearchCriteria, setShowSearchCriteria] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem('lmcs-language') as 'en' | 'fr' | null
    if (savedLang) setLanguage(savedLang)
  }, [])

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      searchPlaceholder: { en: 'Search supervisions...', fr: 'Rechercher des encadrements...' },
      advanced: { en: 'Advanced', fr: 'Avance' },
      reset: { en: 'Reset', fr: 'Reinitialiser' },
      status: { en: 'Status', fr: 'Statut' },
      type: { en: 'Type', fr: 'Type' },
      sortBy: { en: 'Sort By', fr: 'Trier par' },
      academicYear: { en: 'Academic Year', fr: 'Annee Academique' },
      searchCriteria: { en: 'Search Criteria', fr: 'Criteres de Recherche' },
      allStatuses: { en: 'All Statuses', fr: 'Tous les Statuts' },
      active: { en: 'Active', fr: 'Actif' },
      pending: { en: 'Pending', fr: 'En attente' },
      completed: { en: 'Completed', fr: 'Termine' },
      onHold: { en: 'On Hold', fr: 'En pause' },
      suspended: { en: 'Suspended', fr: 'Suspendu' },
      allTypes: { en: 'All Types', fr: 'Tous les Types' },
      pfe: { en: 'PFE Engineer', fr: 'PFE Ingenieur' },
      master: { en: 'Master Thesis', fr: 'Memoire de Master' },
      doctorate: { en: 'Doctorate Thesis', fr: 'These de Doctorat' },
      spe: { en: 'Academic Internship (SPE)', fr: 'Stage Academique (SPE)' },
      research: { en: 'Research Project', fr: 'Projet de Recherche' },
      newestFirst: { en: 'Newest First', fr: 'Plus recent' },
      oldestFirst: { en: 'Oldest First', fr: 'Plus ancien' },
      titleAZ: { en: 'Title (A-Z)', fr: 'Titre (A-Z)' },
      progressHigh: { en: 'Progress (High to Low)', fr: 'Progression (decroissant)' },
      allYears: { en: 'All Years', fr: 'Toutes les Annees' },
      title: { en: 'Title', fr: 'Titre' },
      description: { en: 'Description', fr: 'Description' },
      studentName: { en: 'Student Name', fr: 'Nom Etudiant' },
      supervisorName: { en: 'Supervisor Name', fr: 'Nom Encadrant' },
      location: { en: 'Location', fr: 'Lieu' },
      keywords: { en: 'Keywords', fr: 'Mots-cles' },
      searchIn: { en: 'Search in:', fr: 'Rechercher dans:' },
      search: { en: 'Search:', fr: 'Recherche:' },
    }
    return translations[key]?.[language] || key
  }

  const handleFilterChange = useCallback(
    (key: keyof FilterOptions, value: string | FilterOptions['searchIn']) => {
      const newFilters = { ...filters, [key]: value }
      setFilters(newFilters)
      onFilter(newFilters)
    },
    [filters, onFilter]
  )

  const handleSearchInChange = useCallback(
    (field: keyof FilterOptions['searchIn'], checked: boolean) => {
      const newSearchIn = { ...filters.searchIn, [field]: checked }
      const newFilters = { ...filters, searchIn: newSearchIn }
      setFilters(newFilters)
      onFilter(newFilters)
    },
    [filters, onFilter]
  )

  const handleReset = useCallback(() => {
    const resetFilters: FilterOptions = {
      searchTerm: '',
      status: 'all',
      type: 'all',
      sortBy: 'newest',
      academicYear: 'all',
      searchIn: {
        title: true,
        description: true,
        studentName: true,
        supervisorName: true,
        location: true,
        keywords: true,
      },
    }
    setFilters(resetFilters)
    onFilter(resetFilters)
  }, [onFilter])

  const isFiltered =
    filters.searchTerm ||
    filters.status !== 'all' ||
    filters.type !== 'all' ||
    filters.sortBy !== 'newest' ||
    filters.academicYear !== 'all'

  const activeSearchCriteria = Object.entries(filters.searchIn)
    .filter(([_, v]) => v)
    .map(([k]) => t(k))

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
      <div className="space-y-4">
        {/* Main Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={filters.searchTerm}
              onChange={e => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 rounded-xl"
            />
          </div>
          <Button
            variant={showAdvanced ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2 rounded-xl"
          >
            <Filter className="w-4 h-4" />
            {t('advanced')}
          </Button>
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2 rounded-xl"
            >
              <X className="w-4 h-4" />
              {t('reset')}
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-3 border-t border-blue-200 dark:border-blue-800">
            {/* Search Criteria Toggle */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearchCriteria(!showSearchCriteria)}
                className="gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  {t('searchCriteria')}
                </span>
                {showSearchCriteria ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              {showSearchCriteria && (
                <div className="mt-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900">
                  <p className="text-sm font-medium text-muted-foreground mb-3">{t('searchIn')}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(filters.searchIn).map(([key, checked]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`search-${key}`}
                          checked={checked}
                          onCheckedChange={(val) => handleSearchInChange(key as keyof FilterOptions['searchIn'], !!val)}
                        />
                        <Label 
                          htmlFor={`search-${key}`}
                          className="text-sm cursor-pointer"
                        >
                          {t(key)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  {t('status')}
                </label>
                <Select value={filters.status} onValueChange={v => handleFilterChange('status', v)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="completed">{t('completed')}</SelectItem>
                    <SelectItem value="on-hold">{t('onHold')}</SelectItem>
                    <SelectItem value="suspended">{t('suspended')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  {t('type')}
                </label>
                <Select value={filters.type} onValueChange={v => handleFilterChange('type', v)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 rounded-xl">
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

              {/* Academic Year Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  {t('academicYear')}
                </label>
                <Select value={filters.academicYear} onValueChange={v => handleFilterChange('academicYear', v)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 rounded-xl">
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

              {/* Sort Filter */}
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  {t('sortBy')}
                </label>
                <Select value={filters.sortBy} onValueChange={v => handleFilterChange('sortBy', v)}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('newestFirst')}</SelectItem>
                    <SelectItem value="oldest">{t('oldestFirst')}</SelectItem>
                    <SelectItem value="title">{t('titleAZ')}</SelectItem>
                    <SelectItem value="progress">{t('progressHigh')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {isFiltered && (
          <div className="flex flex-wrap gap-2 text-xs pt-2">
            {filters.searchTerm && (
              <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full">
                {t('search')} {filters.searchTerm}
                <X
                  className="w-3 h-3 cursor-pointer hover:opacity-70 ml-1"
                  onClick={() => handleFilterChange('searchTerm', '')}
                />
              </div>
            )}
            {filters.status !== 'all' && (
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full">
                {t('status')}: {t(filters.status)}
                <X
                  className="w-3 h-3 cursor-pointer hover:opacity-70 ml-1"
                  onClick={() => handleFilterChange('status', 'all')}
                />
              </div>
            )}
            {filters.type !== 'all' && (
              <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full">
                {t('type')}: {t(filters.type)}
                <X
                  className="w-3 h-3 cursor-pointer hover:opacity-70 ml-1"
                  onClick={() => handleFilterChange('type', 'all')}
                />
              </div>
            )}
            {filters.academicYear !== 'all' && (
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-full">
                {t('academicYear')}: {filters.academicYear}
                <X
                  className="w-3 h-3 cursor-pointer hover:opacity-70 ml-1"
                  onClick={() => handleFilterChange('academicYear', 'all')}
                />
              </div>
            )}
            {filters.sortBy !== 'newest' && (
              <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full">
                {t('sortBy')}: {t(filters.sortBy === 'oldest' ? 'oldestFirst' : filters.sortBy === 'title' ? 'titleAZ' : 'progressHigh')}
                <X
                  className="w-3 h-3 cursor-pointer hover:opacity-70 ml-1"
                  onClick={() => handleFilterChange('sortBy', 'newest')}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
