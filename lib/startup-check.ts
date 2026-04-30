/**
 * Startup Validation
 * Runs on application startup to verify configuration
 */

import { validateDeploymentConfig, getDeploymentInfo } from './deployment-config'

/**
 * Run startup checks
 * Call this in your layout.tsx or main app component
 */
export function runStartupChecks() {
  if (typeof window !== 'undefined') {
    // Client-side checks
    return
  }

  // Server-side checks only
  try {
    const validation = validateDeploymentConfig()

    if (!validation.valid) {
      console.error('[STARTUP ERROR] Configuration validation failed:')
      validation.errors.forEach((error) => {
        console.error(`  - ${error}`)
      })
      throw new Error('Invalid deployment configuration')
    }

    const info = getDeploymentInfo()
    console.log('[STARTUP] Deployment Configuration:')
    console.log(`  Environment: ${info.environment}`)
    console.log(`  App URL: ${info.appUrl}`)
    console.log(`  Using Supabase: ${info.usingSupabase}`)
    console.log(`  Database: ${info.database}`)
    console.log(`  Node Env: ${info.nodeEnv}`)
  } catch (error) {
    console.error('[STARTUP ERROR]', error)
    // Don't throw in production, just log
    if (process.env.NODE_ENV === 'development') {
      throw error
    }
  }
}
