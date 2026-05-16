'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, LayoutDashboard, Upload, MessageSquare, BookOpen, Dumbbell, Clock, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/upload', icon: Upload, label: 'Upload' },
  { href: '/practice', icon: Dumbbell, label: 'Practice' },
  { href: '/timeline', icon: Clock, label: 'Timeline' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside className="w-56 border-r flex flex-col shrink-0" style={{ background: 'var(--card)' }}>
        <div className="px-4 py-5 border-b">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Study Companion</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t">
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full hover:bg-[var(--muted)] transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
