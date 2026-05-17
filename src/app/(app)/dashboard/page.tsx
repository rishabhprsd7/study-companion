import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ArrowRight, Sparkles, RotateCcw } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Session, Topic } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, sessionsRes, weakTopicsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('sessions').select('*').eq('user_id', user!.id).order('started_at', { ascending: false }).limit(6),
    supabase.from('topics').select('*').eq('user_id', user!.id).lt('mastery_score', 0.5).order('mastery_score').limit(6),
  ])

  const profile = profileRes.data
  const sessions: Session[] = sessionsRes.data ?? []
  const weakTopics: Topic[] = weakTopicsRes.data ?? []
  const firstName = profile?.display_name?.split(' ')[0] ?? 'there'
  const lastSession = sessions[0]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Greeting */}
      <div className="mb-8 animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight">{greeting}, {firstName}</h1>
        <p className="text-base mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
          What are we learning today?
        </p>
      </div>

      {/* Primary action */}
      <Link
        href="/upload"
        className="group block rounded-2xl p-6 mb-4 text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 animate-fade-up"
        style={{ background: 'linear-gradient(135deg, #6d5dfc, #8678ff)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5" />
              <span className="font-semibold text-lg">Start a new session</span>
            </div>
            <p className="text-sm text-white/80">Upload a screenshot, PDF, or paste your notes</p>
          </div>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </div>
      </Link>

      {/* Continue where you left off */}
      {lastSession && (
        <Link
          href={`/session/${lastSession.id}`}
          className="group flex items-center justify-between rounded-2xl p-5 mb-8 border transition-all hover:shadow-md hover:-translate-y-0.5 animate-fade-up"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-soft)' }}>
              <RotateCcw className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                CONTINUE WHERE YOU LEFT OFF
              </p>
              <p className="font-semibold">{lastSession.title ?? lastSession.subject ?? 'Untitled session'}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1"
            style={{ color: 'var(--muted-foreground)' }} />
        </Link>
      )}

      {/* Review chips */}
      {weakTopics.length > 0 && (
        <div className="mb-8 animate-fade-up">
          <p className="text-xs font-semibold mb-3 tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            WORTH REVIEWING
          </p>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map(t => (
              <Link key={t.id} href="/practice"
                className="text-sm px-3 py-1.5 rounded-full border font-medium transition-colors hover:shadow-sm"
                style={{ background: 'var(--card)', borderColor: 'var(--border-strong)' }}>
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div>
        <p className="text-xs font-semibold mb-3 tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
          RECENT SESSIONS
        </p>
        {sessions.length === 0 ? (
          <div className="rounded-2xl p-10 text-center border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--accent-soft)' }}>
              <Sparkles className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
            <p className="font-semibold mb-1">Your study space is ready</p>
            <p className="text-sm mb-5" style={{ color: 'var(--muted-foreground)' }}>
              Upload your first screenshot or notes to begin
            </p>
            <Link href="/upload"
              className="inline-flex items-center gap-2 text-sm text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md"
              style={{ background: 'var(--accent)' }}>
              <Plus className="w-4 h-4" /> Upload something
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <Link key={s.id} href={`/session/${s.id}`}
                className="group flex items-center justify-between rounded-xl px-4 py-3.5 border transition-all hover:shadow-sm hover:-translate-y-0.5"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.title ?? s.subject ?? 'Untitled session'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {s.subject ? `${s.subject} · ` : ''}{formatRelativeTime(s.started_at)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0 ml-3 transition-transform group-hover:translate-x-0.5"
                  style={{ color: 'var(--muted-foreground)' }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
