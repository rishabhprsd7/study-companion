import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, TrendingUp, BookOpen, AlertCircle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Session, Topic } from '@/types'

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [sessionsRes, topicsRes] = await Promise.all([
    supabase.from('sessions').select('*').eq('user_id', user!.id)
      .order('started_at', { ascending: false }).limit(30),
    supabase.from('topics').select('*').eq('user_id', user!.id)
      .order('mastery_score', { ascending: false }),
  ])

  const sessions: Session[] = sessionsRes.data ?? []
  const topics: Topic[] = topicsRes.data ?? []

  const strongTopics = topics.filter(t => t.mastery_score >= 0.6)
  const weakTopics = topics.filter(t => t.mastery_score < 0.4)

  // Group sessions by date
  const grouped: Record<string, Session[]> = {}
  for (const s of sessions) {
    const date = new Date(s.started_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(s)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Learning Timeline</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          Your study history and progress overview
        </p>
      </div>

      {/* Topic mastery */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="border rounded-2xl p-4" style={{ background: 'var(--card)' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <h2 className="font-semibold text-sm">Strong topics</h2>
          </div>
          {strongTopics.length === 0
            ? <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Keep studying to build mastery!</p>
            : <div className="space-y-2">
              {strongTopics.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between">
                  <span className="text-sm">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 rounded-full" style={{ background: 'var(--muted)' }}>
                      <div className="h-full rounded-full bg-green-400" style={{ width: `${t.mastery_score * 100}%` }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{Math.round(t.mastery_score * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        <div className="border rounded-2xl p-4" style={{ background: 'var(--card)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-sm">Needs revision</h2>
          </div>
          {weakTopics.length === 0
            ? <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nothing flagged — great work!</p>
            : <div className="space-y-2">
              {weakTopics.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between">
                  <span className="text-sm">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 rounded-full" style={{ background: 'var(--muted)' }}>
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${t.mastery_score * 100}%` }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{Math.round(t.mastery_score * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      {/* Sessions timeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--muted-foreground)' }}>SESSION HISTORY</h2>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12 border rounded-2xl" style={{ background: 'var(--card)' }}>
            <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p className="font-medium mb-1">No sessions yet</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Start studying to build your timeline.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, daySessions]) => (
              <div key={date}>
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{date}</p>
                <div className="space-y-2">
                  {daySessions.map(s => (
                    <Link key={s.id} href={`/session/${s.id}`}
                      className="flex items-start gap-3 border rounded-xl px-4 py-3 hover:border-indigo-300 transition-colors"
                      style={{ background: 'var(--card)' }}>
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.title ?? s.subject ?? 'Study session'}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                          {formatRelativeTime(s.started_at)}
                          {s.recap && ' · Recap available'}
                        </p>
                        {s.recap && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {s.recap.topics_covered?.slice(0, 3).map((t: string) => (
                              <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
