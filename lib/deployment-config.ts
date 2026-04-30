/**
 * Deployment Configuration
 * Detects and manages deployment environment (Vercel or Local)
 */

export type DeploymentEnv = 'vercel' | 'local'

/**
 * Get the current deployment environment
 */
export function getDeploymentEnv(): DeploymentEnv {
  const env = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV as DeploymentEnv | undefined
  return env || 'local'
}

/**
 * Check if running on Vercel
 */
export function isVercelDeployment(): boolean {
  return getDeploymentEnv() === 'vercel'
}

/**
 * Check if running locally
 */
export function isLocalDeployment(): boolean {
  return getDeploymentEnv() === 'local'
}

/**
 * Get the app URL based on deployment environment
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Check if using Supabase
 */
export function isUsingSupabase(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Get database configuration based on deployment
 */
export interface DatabaseConfig {
  type: 'supabase' | 'postgresql'
  url?: string
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
}

export function getDatabaseConfig(): DatabaseConfig {
  // If Supabase is configured, use it
  if (isUsingSupabase()) {
    return {
      type: 'supabase',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    }
  }

  // Otherwise use local PostgreSQL
  return {
    type: 'postgresql',
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'lmcs_db',
  }
}

/**
 * Get deployment information (useful for debugging)
 */
export function getDeploymentInfo() {
  return {
    environment: getDeploymentEnv(),
    appUrl: getAppUrl(),
    isVercel: isVercelDeployment(),
    isLocal: isLocalDeployment(),
    usingSupabase: isUsingSupabase(),
    database: getDatabaseConfig().type,
    nodeEnv: process.env.NODE_ENV,
  }
}

/**
 * Validate deployment configuration
 */
export function validateDeploymentConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check deployment environment
  if (!['vercel', 'local'].includes(getDeploymentEnv())) {
    errors.push('NEXT_PUBLIC_DEPLOYMENT_ENV must be "vercel" or "local"')
  }

  // Check app URL
  if (!getAppUrl()) {
    errors.push('NEXT_PUBLIC_APP_URL is not configured')
  }

  // Check database configuration
  if (isUsingSupabase()) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is required for Supabase')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required for Supabase')
    }
  } else {
    if (!process.env.DATABASE_URL && !process.env.DATABASE_HOST) {
      errors.push('DATABASE_URL or DATABASE_HOST is required for local PostgreSQL')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
