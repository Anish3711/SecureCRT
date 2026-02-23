'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      router.push('/')
    }
  }, [user, userRole, loading, router])

  if (loading || !user || userRole !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const navItems = [
    { href: '/admin/exams', label: 'Exams', icon: '📝' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="text-2xl font-bold text-slate-900">
              SecureCRT
            </Link>
            <Button variant="outline" onClick={() => router.push('/')}>
              Logout
            </Button>
          </div>
          <div className="flex gap-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname.startsWith(item.href) ? 'default' : 'ghost'}
                  className="flex gap-2"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
