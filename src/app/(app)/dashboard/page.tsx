import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Upload, MessageSquare, Flame, TrendingUp, AlertCircle, Plus } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Session, Topic } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, sessionsRes, weakTopicsRes, streakRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('sessions').select('*').eq('user_id', user!.id).order('started_at', { ascending: false }).limit(5),
    supabase.from('topics').select('*').eq('user_id', user!.id).lt('mastery_score', 0.5).order('mastery_score').limit(5),
    supabase.from('sessions').select('started_at').eq('user_id', user!.id).order('started_at', { ascending: false }).limit(30),
  ])

  const profile = profileRes.data
  const sessions: Session[] = sessionsRes.data ?? []
  const weakTopics: Topic[] = weakTopicsRes.data ?? []

  // Streak calculation
  const sessionDates = new Set((streakRes.data ?? []).map((s: { started_at: string }) =>
    new Date(s.started_at).toDateString()
  ))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (sessionDates.has(d.toDateString())) streak++
    else break
  }

  const firstName = profile?.display_name?.split(' ')[0] ?? 'there'

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Hey, {firstName} 👋</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Ready to study? What are we learning today?
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New session
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border rounded-2xl p-4" style={{ background: 'var(--card)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Streak</span>
          </div>
          <p className="text-2xl font-bold">{streak}<span className="text-sm font-normal ml-1" style={{ color: 'var(--muted-foreground)' }}>days</span></p>
        </div>
        <div className="border rounded-2xl p-4" style={{ background: 'var(--card)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Sessions</span>
          </div>
          <p className="text-2xl font-bold">{sessions.length}</p>
        </div>
        <div className="border rounded-2xl p-4" style={{ background: 'var(--card)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Topics</span>
          </div>
          <p className="text-2xl font-bold">{weakTopics.length > 0 ? '📈' : '—'}</p>
        </div>
      </div>

      {/* Weak areas */}
      {weakTopics.length > 0 && (
        <div className="border rounded-2xl p-5 mb-6" style={{ background: 'var(--card)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-sm">Areas to revise</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map(t => (
              <span key={t.id} className="text-xs px-2.5 py-1 rounded-full border font-medium"
                style={{ background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' }}>
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div>
        <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>RECENT SESSIONS</h2>
        {sessions.length === 0 ? (
          <div className="border rounded-2xl p-8 text-center" style={{ background: 'var(--card)' }}>
            <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p className="font-medium mb-1">No sessions yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Upload your first study material to get started</p>
            <Link href="/upload" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Upload something
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <Link key={s.id} href={`/session/${s.id}`}
                className="flex items-center justify-between border rounded-xl px-4 py-3 hover:border-indigo-300 transition-colors"
                style={{ background: 'var(--card)' }}>
                <div>
                  <p className="text-sm font-medium">{s.title ?? s.subject ?? 'Untitled session'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {formatRelativeTime(s.started_at)}
                  </p>
                </div>
                <MessageSquare className="w-4 h-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
