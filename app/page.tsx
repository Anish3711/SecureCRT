'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">SecureCRT</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.email}</span>
            <Button
              variant="outline"
              onClick={() => {
                // Sign out logic will be implemented
                router.push('/auth/login')
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {userRole === 'admin' ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h2>
              <p className="text-slate-600">Manage exams, questions, and student enrollments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Exam</CardTitle>
                  <CardDescription>Setup a new exam or training</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/exams/new">
                    <Button className="w-full">Create New Exam</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manage Exams</CardTitle>
                  <CardDescription>View and edit your exams</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/exams">
                    <Button variant="outline" className="w-full">
                      View Exams
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>View student performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/analytics">
                    <Button variant="outline" className="w-full">
                      View Analytics
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Student Dashboard</h2>
              <p className="text-slate-600">Take exams and view your results</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Exams</CardTitle>
                  <CardDescription>Exams you can take</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/student/exams">
                    <Button className="w-full">View Exams</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Results</CardTitle>
                  <CardDescription>View your exam results</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/student/results">
                    <Button variant="outline" className="w-full">
                      View Results
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
