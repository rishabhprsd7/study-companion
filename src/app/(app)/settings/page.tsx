'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check } from 'lucide-react'
import type { ExplanationMode, LearnerType } from '@/types'
import { cn } from '@/lib/utils'

const MODES: { value: ExplanationMode; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'Simple analogies, no jargon' },
  { value: 'simple', label: 'Simple', desc: 'Clear and friendly (recommended)' },
  { value: 'exam', label: 'Exam', desc: 'Precise, exam-ready answers' },
  { value: 'advanced', label: 'Advanced', desc: 'Technical depth' },
]

const LEARNER_TYPES: { value: LearnerType; label: string }[] = [
  { value: 'school', label: '🏫 School student' },
  { value: 'university', label: '🎓 University student' },
  { value: 'language', label: '🌍 Language learner' },
  { value: 'professional', label: '💼 Professional' },
  { value: 'certification', label: '📜 Certification prep' },
]

export default function SettingsPage() {
  const [mode, setMode] = useState<ExplanationMode>('simple')
  const [learnerType, setLearnerType] = useState<LearnerType>('university')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setMode(data.default_mode ?? 'simple')
          setLearnerType(data.learner_type ?? 'university')
          setName(data.display_name ?? '')
        }
      })
    })
  }, [])

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ default_mode: mode, learner_type: learnerType, display_name: name }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Your name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ background: 'var(--card)' }} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">I am a...</label>
          <div className="grid gap-2">
            {LEARNER_TYPES.map(t => (
              <button key={t.value} onClick={() => setLearnerType(t.value)}
                className={cn('text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                  learnerType === t.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'hover:border-indigo-300')}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Default explanation mode</label>
          <div className="grid gap-2">
            {MODES.map(m => (
              <button key={m.value} onClick={() => setMode(m.value)}
                className={cn('text-left px-3 py-2.5 rounded-lg border text-sm transition-colors',
                  mode === m.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'hover:border-indigo-300')}>
                <span className="font-medium">{m.label}</span>
                <span className="ml-2" style={{ color: 'var(--muted-foreground)' }}>— {m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
