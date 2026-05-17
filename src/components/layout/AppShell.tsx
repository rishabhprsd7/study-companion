'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sparkles, LayoutDashboard, Plus, Dumbbell, Clock, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/upload', icon: Plus, label: 'New session' },
  { href: '/practice', icon: Dumbbell, label: 'Practice' },
  { href: '/timeline', icon: Clock, label: 'History' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [name, setName] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? '')
        supabase.from('profiles').select('display_name').eq('id', user.id).single()
          .then(({ data }) => setName(data?.display_name ?? ''))
      }
    })
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const initial = (name || email || '?').charAt(0).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className="w-60 flex flex-col shrink-0 border-r"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #6d5dfc, #8678ff)' }}>
              <Sparkles className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-sm">Study Companion</div>
              <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Upload. Understand.</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            const isPrimary = href === '/upload'
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                  isPrimary && !active && 'font-medium',
                  active
                    ? 'font-semibold shadow-sm'
                    : 'hover:translate-x-0.5'
                )}
                style={
                  active
                    ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
                    : { color: 'var(--muted-foreground)' }
                }
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Account footer */}
        <div className="p-3 mt-auto">
          <div
            className="rounded-xl p-3 border"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                style={{ background: 'linear-gradient(135deg, #6d5dfc, #8678ff)' }}
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{name || 'Learner'}</div>
                <div className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {email}
                </div>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center justify-center gap-2 w-full text-xs py-2 rounded-lg transition-colors hover:bg-[var(--card)]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
