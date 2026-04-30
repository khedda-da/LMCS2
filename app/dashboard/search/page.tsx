'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search as SearchIcon } from 'lucide-react'

export default function SearchPage() {
  const [supervisions, setSupervisions] = useState<any[]>([])
  const [filteredSupervisions, setFilteredSupervisions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSupervisions()
  }, [])

  useEffect(() => {
    filterSupervisions()
  }, [searchTerm, filterType, filterStatus, supervisions])

  const fetchSupervisions = async () => {
    try {
      const { data, error } = await supabase
        .from('supervisions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSupervisions(data || [])
    } catch (error) {
      console.error('Error fetching supervisions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSupervisions = () => {
    let filtered = supervisions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (filterType) {
      filtered = filtered.filter((s) => s.type === filterType)
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter((s) => s.status === filterStatus)
    }

    setFilteredSupervisions(filtered)
  }

  const types = ['PFE', 'Masters', 'Doctorate', 'Internship', 'Research Project']
  const statuses = ['ongoing', 'completed', 'pending']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search Supervisions</h1>
        <p className="text-muted-foreground mt-1">Find supervisions using multiple criteria</p>
      </div>

      {/* Search Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Search
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Results */}
      {filteredSupervisions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {supervisions.length === 0
              ? 'No supervisions available'
              : 'No supervisions match your search criteria'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Found {filteredSupervisions.length} result{filteredSupervisions.length !== 1 ? 's' : ''}
          </p>
          {filteredSupervisions.map((supervision) => (
            <Card key={supervision.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {supervision.title}
                  </h3>
                  {supervision.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {supervision.description}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium text-foreground">{supervision.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          supervision.status === 'ongoing'
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : supervision.status === 'completed'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {supervision.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Academic Year</p>
                      <p className="font-medium text-foreground">{supervision.academic_year}</p>
                    </div>
                  </div>
                </div>
                <Link href={`/dashboard/supervisions/${supervision.id}`}>
                  <Button size="sm">View</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
