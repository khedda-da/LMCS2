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

  const handleFilterChange = (key: keyof StatisticsFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const isFiltered = Object.values(filters).some(value => value !== '')

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowFilters(!showFilters)}
        variant="outline"
        className="gap-2"
        disabled={loading}
      >
        <Filter className="w-4 h-4" />
        Advanced Filters {isFiltered && <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">Active</span>}
      </Button>

      {showFilters && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="defended">Defended</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pfe">PFE Engineer</SelectItem>
                    <SelectItem value="master">Master Thesis</SelectItem>
                    <SelectItem value="doctorate">Doctorate Thesis</SelectItem>
                    <SelectItem value="spe">Academic Internship</SelectItem>
                    <SelectItem value="research">Research Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Supervisor Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Supervisor</label>
                <Select value={filters.supervisor} onValueChange={(value) => handleFilterChange('supervisor', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Supervisors</SelectItem>
                    {supervisors.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Academic Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Year</label>
                <Select value={filters.academicYear} onValueChange={(value) => handleFilterChange('academicYear', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.sort().reverse().map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year of Study Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Year of Study</label>
                <Select value={filters.yearOfStudy} onValueChange={(value) => handleFilterChange('yearOfStudy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
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
                <label className="text-sm font-medium">Start Date From</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              {/* End Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date To</label>
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
                  Reset Filters
                </Button>
              )}
              <Button onClick={() => setShowFilters(false)} size="sm">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
