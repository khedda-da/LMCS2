// Role Management Utilities

export type UserRole = 'supervisor' | 'director' | 'system_admin'

export interface RoleInfo {
  id: UserRole
  label: string
  description: string
  dashboardPath: string
  permissions: string[]
}

export const ROLE_INFO: Record<UserRole, RoleInfo> = {
  supervisor: {
    id: 'supervisor',
    label: 'Supervisor',
    description: 'Manage student supervisions and track progress',
    dashboardPath: '/dashboard/supervisor',
    permissions: ['view_supervisions', 'create_supervision', 'edit_own_supervision', 'view_students'],
  },
  director: {
    id: 'director',
    label: 'Director',
    description: 'Oversee laboratory operations and approvals',
    dashboardPath: '/dashboard/director',
    permissions: ['view_analytics', 'view_all_supervisions', 'approve_supervisions', 'view_reports'],
  },
  system_admin: {
    id: 'system_admin',
    label: 'System Administrator',
    description: 'Full system access and user management',
    dashboardPath: '/dashboard/admin',
    permissions: ['manage_users', 'manage_roles', 'view_audit_logs', 'system_settings', 'all_permissions'],
  },
}

export function getRoleInfo(role: UserRole): RoleInfo {
  return ROLE_INFO[role]
}

export function getRoleDashboardPath(role: UserRole): string {
  return ROLE_INFO[role].dashboardPath
}

export function getDashboardPathForRoles(roles: UserRole[]): string {
  // If user has system_admin role, go to admin dashboard
  if (roles.includes('system_admin')) return ROLE_INFO.system_admin.dashboardPath
  // If user has director role, go to director dashboard
  if (roles.includes('director')) return ROLE_INFO.director.dashboardPath
  // Default to supervisor dashboard
  return ROLE_INFO.supervisor.dashboardPath
}

export function hasPermission(userRoles: UserRole[], permission: string): boolean {
  return userRoles.some((role) => {
    const roleInfo = ROLE_INFO[role]
    return roleInfo.permissions.includes(permission) || roleInfo.permissions.includes('all_permissions')
  })
}

export function getAccessibleDashboards(userRoles: UserRole[]): RoleInfo[] {
  return userRoles
    .map((role) => ROLE_INFO[role])
    .sort((a, b) => {
      // Sort by hierarchy: system_admin > director > supervisor
      const hierarchy = { system_admin: 3, director: 2, supervisor: 1 }
      return (hierarchy[b.id as UserRole] || 0) - (hierarchy[a.id as UserRole] || 0)
    })
}
