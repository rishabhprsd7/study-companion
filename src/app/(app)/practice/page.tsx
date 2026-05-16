'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, XCircle, RotateCcw, Zap } from 'lucide-react'
import type { Topic, PracticeItem, MCQPayload, FlashcardPayload, FillPayload } from '@/types'
import { cn } from '@/lib/utils'

export default function PracticePage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [items, setItems] = useState<PracticeItem[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState<string | number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('topics').select('*').eq('user_id', user.id)
        .order('last_seen_at', { ascending: false })
        .then(({ data }) => { setTopics(data ?? []); setLoading(false) })
    })
  }, [])

  async function generatePractice(topic: Topic) {
    setSelectedTopic(topic)
    setGenerating(true)
    setItems([])
    setCurrentIdx(0)
    setScore({ correct: 0, total: 0 })

    const res = await fetch('/api/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: topic.id, topicName: topic.name, kinds: ['mcq', 'flashcard'], count: 3 }),
    })
    const { items: newItems } = await res.json()
    setItems(newItems ?? [])
    setGenerating(false)
  }

  function handleAnswer(isCorrect: boolean) {
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }))
    setRevealed(true)

    // Log attempt
    const supabase = createClient()
    const item = items[currentIdx]
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !item) return
      supabase.from('practice_attempts').insert({
        user_id: user.id,
        item_id: item.id,
        correct: isCorrect,
        response: { answer },
      })
    })
  }

  function next() {
    setAnswer(null)
    setRevealed(false)
    setCurrentIdx(i => i + 1)
  }

  const currentItem = items[currentIdx]
  const done = items.length > 0 && currentIdx >= items.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Practice</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          Test yourself on your studied topics
        </p>
      </div>

      {!selectedTopic ? (
        <>
          {topics.length === 0 ? (
            <div className="text-center py-12 border rounded-2xl" style={{ background: 'var(--card)' }}>
              <Zap className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p className="font-medium mb-1">No topics yet</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Upload study material first to unlock practice mode.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {topics.map(t => (
                <button key={t.id} onClick={() => generatePractice(t)}
                  className="flex items-center justify-between border rounded-xl px-4 py-3 text-left hover:border-indigo-300 transition-colors"
                  style={{ background: 'var(--card)' }}>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{t.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full" style={{ background: 'var(--muted)' }}>
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(t.mastery_score ?? 0) * 100}%` }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{Math.round((t.mastery_score ?? 0) * 100)}%</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : generating ? (
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="font-medium">Generating questions for {selectedTopic.name}...</p>
        </div>
      ) : done ? (
        <div className="text-center py-12 border rounded-2xl" style={{ background: 'var(--card)' }}>
          <div className="text-4xl mb-3">{score.correct / score.total >= 0.7 ? '🎉' : '📚'}</div>
          <h2 className="text-xl font-bold mb-1">{score.correct}/{score.total} correct</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            {score.correct / score.total >= 0.7 ? 'Great work!' : 'Keep practicing — you\'re getting there!'}
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => generatePractice(selectedTopic)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
              <RotateCcw className="w-4 h-4" />
              Practice again
            </button>
            <button onClick={() => setSelectedTopic(null)}
              className="border px-4 py-2 rounded-lg text-sm hover:bg-[var(--muted)] transition-colors">
              Choose topic
            </button>
          </div>
        </div>
      ) : currentItem ? (
        <div>
          <div className="flex items-center justify-between mb-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <span>{selectedTopic.name}</span>
            <span>{currentIdx + 1} / {items.length}</span>
          </div>

          {currentItem.kind === 'mcq' && (
            <MCQCard item={currentItem} answer={answer as number | null} revealed={revealed}
              onAnswer={i => setAnswer(i)} onCheck={() => {
                const p = currentItem.payload as MCQPayload
                handleAnswer(answer === p.answer)
              }} onNext={next} />
          )}

          {currentItem.kind === 'flashcard' && (
            <FlashcardCard item={currentItem} revealed={revealed}
              onReveal={() => setRevealed(true)}
              onAnswer={handleAnswer} onNext={next} />
          )}

          {currentItem.kind === 'fill' && (
            <FillCard item={currentItem} answer={answer as string} revealed={revealed}
              onAnswer={v => setAnswer(v)}
              onCheck={() => {
                const p = currentItem.payload as FillPayload
                handleAnswer(
                  (answer as string)?.toLowerCase().trim() === p.blank.toLowerCase().trim()
                )
              }} onNext={next} />
          )}
        </div>
      ) : null}
    </div>
  )
}

function MCQCard({ item, answer, revealed, onAnswer, onCheck, onNext }: {
  item: PracticeItem; answer: number | null; revealed: boolean
  onAnswer: (i: number) => void; onCheck: () => void; onNext: () => void
}) {
  const p = item.payload as MCQPayload
  return (
    <div className="border rounded-2xl p-5" style={{ background: 'var(--card)' }}>
      <p className="font-medium mb-4">{p.question}</p>
      <div className="space-y-2">
        {p.options.map((opt, i) => (
          <button key={i} onClick={() => !revealed && onAnswer(i)}
            className={cn(
              'w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors',
              !revealed && answer === i && 'border-indigo-500 bg-indigo-50 text-indigo-700',
              revealed && i === p.answer && 'border-green-500 bg-green-50 text-green-700',
              revealed && answer === i && i !== p.answer && 'border-red-400 bg-red-50 text-red-700',
            )}>
            <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
          </button>
        ))}
      </div>
      {revealed && <p className="text-sm mt-3 p-3 rounded-lg" style={{ background: 'var(--muted)' }}>{p.explanation}</p>}
      <div className="mt-4 flex justify-end">
        {!revealed
          ? <button onClick={onCheck} disabled={answer === null} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-40">Check answer</button>
          : <button onClick={onNext} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Next →</button>
        }
      </div>
    </div>
  )
}

function FlashcardCard({ item, revealed, onReveal, onAnswer, onNext }: {
  item: PracticeItem; revealed: boolean
  onReveal: () => void; onAnswer: (c: boolean) => void; onNext: () => void
}) {
  const p = item.payload as FlashcardPayload
  const [answered, setAnswered] = useState(false)
  return (
    <div className="border rounded-2xl p-6 text-center min-h-40" style={{ background: 'var(--card)' }}>
      <p className="text-xs font-medium mb-4 uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
        {revealed ? 'Answer' : 'Question'}
      </p>
      <p className="text-lg font-medium mb-6">{revealed ? p.back : p.front}</p>
      {!revealed
        ? <button onClick={onReveal} className="border px-4 py-2 rounded-lg text-sm hover:bg-[var(--muted)]">Show answer</button>
        : !answered
          ? <div className="flex gap-2 justify-center">
            <button onClick={() => { setAnswered(true); onAnswer(false) }}
              className="flex items-center gap-1.5 border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50">
              <XCircle className="w-4 h-4" /> Didn&apos;t know
            </button>
            <button onClick={() => { setAnswered(true); onAnswer(true) }}
              className="flex items-center gap-1.5 border border-green-400 text-green-700 px-4 py-2 rounded-lg text-sm hover:bg-green-50">
              <CheckCircle2 className="w-4 h-4" /> Got it!
            </button>
          </div>
          : <button onClick={onNext} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Next →</button>
      }
    </div>
  )
}

function FillCard({ item, answer, revealed, onAnswer, onCheck, onNext }: {
  item: PracticeItem; answer: string; revealed: boolean
  onAnswer: (v: string) => void; onCheck: () => void; onNext: () => void
}) {
  const p = item.payload as FillPayload
  const correct = answer?.toLowerCase().trim() === p.blank.toLowerCase().trim()
  return (
    <div className="border rounded-2xl p-5" style={{ background: 'var(--card)' }}>
      <p className="font-medium mb-4">{p.sentence}</p>
      {p.hint && <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>Hint: {p.hint}</p>}
      <input
        type="text" value={answer ?? ''} onChange={e => onAnswer(e.target.value)}
        disabled={revealed}
        placeholder="Type your answer..."
        className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        style={{ background: 'var(--background)' }}
      />
      {revealed && (
        <div className={cn('mt-3 p-3 rounded-lg text-sm', correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {correct ? '✓ Correct!' : `✗ Answer: ${p.blank}`}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        {!revealed
          ? <button onClick={onCheck} disabled={!answer} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-40">Check</button>
          : <button onClick={onNext} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Next →</button>
        }
      </div>
    </div>
  )
}
