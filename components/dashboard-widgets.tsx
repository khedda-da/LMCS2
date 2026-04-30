'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface StatisticCard {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

interface DashboardStatsProps {
  title: string
  description: string
  stats: StatisticCard[]
  loading?: boolean
  animated?: boolean
}

export function DashboardStats({
  title,
  description,
  stats,
  loading = false,
  animated = true,
}: DashboardStatsProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-sm card-hover">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-all duration-300 hover:shadow-md ${
                  animated ? 'animate-scale-in' : ''
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                      {stat.value}
                    </p>
                  </div>
                  {stat.icon && <div className="text-blue-600 dark:text-blue-400">{stat.icon}</div>}
                </div>
                {stat.trend && (
                  <div className={`text-xs mt-2 font-semibold ${
                    stat.trend === 'up' ? 'text-green-600' :
                    stat.trend === 'down' ? 'text-red-600' :
                    'text-slate-600'
                  }`}>
                    {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'} {stat.trend}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ActivityItem {
  id: string
  title: string
  description: string
  timestamp: Date
  type: 'success' | 'info' | 'warning' | 'error'
  icon: React.ReactNode
}

interface ActivityFeedProps {
  title: string
  activities: ActivityItem[]
  loading?: boolean
}

export function ActivityFeed({ title, activities, loading = false }: ActivityFeedProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg border ${getTypeColor(activity.type)} animate-slide-up`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 mt-1 ${getIconColor(activity.type)}`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      {activity.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500 dark:text-slate-400">No activities yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
