'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Shield, BookOpen, Users } from 'lucide-react'

interface RoleSelectorProps {
  selectedRoles: string[]
  onChange: (roles: string[]) => void
  disabled?: boolean
}

export function RoleSelector({ selectedRoles, onChange, disabled = false }: RoleSelectorProps) {
  const roles = [
    {
      id: 'supervisor',
      label: 'Teachers/Researchers',
      description: 'Manage student supervisions and track research progress',
      icon: Users,
    },
    {
      id: 'director',
      label: 'Laboratory Director',
      description: 'Oversee laboratory operations and approve supervisions',
      icon: BookOpen,
    },
    {
      id: 'admin',
      label: 'System Administrator',
      description: 'Full system access and user management',
      icon: Shield,
    },
  ]

  const handleToggleRole = (roleId: string) => {
    try {
      // Allow up to 2 roles to be selected
      if (selectedRoles.includes(roleId)) {
        // Remove the role if already selected
        onChange(selectedRoles.filter(r => r !== roleId))
      } else {
        // Add the role if less than 2 are selected
        if (selectedRoles.length < 2) {
          onChange([...selectedRoles, roleId])
        }
      }
    } catch (error) {
      console.error(' Error toggling role:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Select Your Roles</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-6">
          Select up to 2 roles. Your selection will require approval from an administrator.
        </p>
      </div>

      <div className="space-y-3">
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRoles.includes(role.id)
          return (
            <label
              key={role.id}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="pt-1">
                <Checkbox
                  id={role.id}
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    if (!disabled) {
                      handleToggleRole(role.id)
                    }
                  }}
                  disabled={disabled}
                  className="h-5 w-5 border-blue-300 dark:border-blue-600"
                  aria-label={`Select ${role.label}`}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-base font-semibold text-blue-900 dark:text-blue-100">
                    {role.label}
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">{role.description}</p>
              </div>
            </label>
          )
        })}
      </div>

      {selectedRoles.length === 0 && (
        <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> You must select at least one role to proceed. You can select up to 2 roles.
          </p>
        </div>
      )}
      {selectedRoles.length === 2 && (
        <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">
            <strong>Maximum reached:</strong> You have selected 2 roles. Your dashboard will show features for both roles.
          </p>
        </div>
      )}
    </div>
  )
}
