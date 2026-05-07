'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Settings, Database } from 'lucide-react'
import { useLanguage } from '@/components/providers'

export function AdminNav() {
  const pathname = usePathname()
  const { language } = useLanguage()

  const navItems = [
    {
      label: language === 'fr' ? 'Utilisateurs' : 'Users',
      href: '/dashboard/admin/users',
      icon: Users
    },
    {
      label: language === 'fr' ? 'Système' : 'System',
      href: '/dashboard/admin/system',
      icon: Database
    },
    {
      label: language === 'fr' ? 'Paramètres' : 'Settings',
      href: '/dashboard/admin/settings',
      icon: Settings
    }
  ]

  return (
    <div className="flex gap-2 border-b">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
