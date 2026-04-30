import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; description?: string }>
}) {
  const params = await searchParams

  const errorMessages: Record<string, string> = {
    'no_code': 'No authorization code received from OAuth provider',
    'session_error': 'Failed to establish a session',
    'no_user': 'No user information returned from OAuth provider',
    'db_error': 'Database error occurred',
    'user_creation_failed': 'Failed to create user account',
    'unexpected': 'An unexpected error occurred',
    'db_check_failed': 'Failed to verify user information',
  }

  const errorKey = params?.error as string || 'unexpected'
  const errorMessage = params?.description || errorMessages[errorKey] || 'An error occurred during authentication'

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center mb-2">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                  {errorMessage}
                </p>
                {errorKey && (
                  <p className="text-xs text-red-700 dark:text-red-400 mt-2 opacity-75">
                    Error Code: {errorKey}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">What you can do:</p>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
                  <li>Try signing in again</li>
                  <li>Clear your browser cookies</li>
                  <li>Use a different authentication method</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Link href="/auth/login" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Back to Login
                  </Button>
                </Link>
                <Link href="/auth/sign-up" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Create Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
