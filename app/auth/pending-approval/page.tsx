'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, CheckCircle2, Info } from 'lucide-react'

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full shadow-lg overflow-hidden">
              <Image
                src="/lmcs-logo.png"
                alt="LMCS Logo"
                width={80}
                height={80}
                className="w-full h-full object-cover rounded-full hover:scale-110 transition-transform duration-300"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">LMCS Supervision</h1>
            <p className="text-sm text-muted-foreground">Account Registration</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-4">
                  <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Awaiting Approval</CardTitle>
              <CardDescription className="text-center">
                Your account is pending administrator review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Account Registration Submitted
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        Your request has been successfully submitted. The system administrator will review your application and enable your account accordingly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">What happens next:</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Administrator Review</p>
                        <p className="text-xs text-muted-foreground">The system administrator will verify your information</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Account Activation</p>
                        <p className="text-xs text-muted-foreground">Your account will be enabled once approved</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Access Granted</p>
                        <p className="text-xs text-muted-foreground">You can then login and use the platform according to your role</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-3 flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Please keep your registration details. You'll need them to access the system once approved.
                  </p>
                </div>

                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
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
