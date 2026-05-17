'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Send, Sparkles, ChevronDown, ArrowLeft, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ExplanationMode } from '@/types'
import { cn } from '@/lib/utils'

const MODES: { value: ExplanationMode; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'Simple analogies, no jargon' },
  { value: 'simple', label: 'Simple', desc: 'Clear and friendly' },
  { value: 'exam', label: 'Exam', desc: 'Precise, exam-ready answers' },
  { value: 'advanced', label: 'Advanced', desc: 'Technical depth' },
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any
  initialMode: ExplanationMode
  userId: string
}

export default function ChatInterface({ session, initialMode }: Props) {
  const [messages, setMessages] = useState<Message[]>(() =>
    (session.messages ?? []).map((m: { id: number; role: string; content: string }) => ({
      id: String(m.id),
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  )
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<ExplanationMode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [showModeMenu, setShowModeMenu] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const uploads = session.uploads ?? []
  const hasNotes = uploads.length > 0 && messages.length === 0

  function autoGrow() {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  async function sendMessage() {
    const content = input.trim()
    if (!content || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          message: content,
          mode,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }
      setMessages(prev => [...prev, assistantMsg])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  setMessages(prev =>
                    prev.map(m => m.id === assistantMsg.id
                      ? { ...m, content: m.content + parsed.text }
                      : m
                    )
                  )
                }
              } catch { /* skip */ }
            }
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '⚠️ Sorry, something went wrong. Please try again.',
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = [
    'Explain this simply',
    'Give me 3 examples',
    'Make a quiz on this',
    'Summarise the key points',
  ]

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header
        className="px-5 py-3 flex items-center justify-between shrink-0 border-b backdrop-blur-sm"
        style={{ background: 'color-mix(in srgb, var(--card) 85%, transparent)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--muted)] shrink-0"
            style={{ color: 'var(--muted-foreground)' }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm truncate">{session.title ?? session.subject ?? 'Study session'}</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {session.subject ? session.subject : uploads.length > 0 ? `${uploads.length} upload${uploads.length > 1 ? 's' : ''}` : 'Chat session'}
            </p>
          </div>
        </div>

        {/* Mode picker */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowModeMenu(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors hover:bg-[var(--muted)]"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <span style={{ color: 'var(--accent)' }}>●</span>
            {MODES.find(m => m.value === mode)?.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showModeMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowModeMenu(false)} />
              <div className="absolute right-0 top-full mt-1.5 border rounded-xl z-20 py-1.5 w-56 overflow-hidden"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                {MODES.map(m => (
                  <button key={m.value} onClick={() => { setMode(m.value); setShowModeMenu(false) }}
                    className="w-full text-left px-3.5 py-2.5 transition-colors hover:bg-[var(--muted)] flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium" style={mode === m.value ? { color: 'var(--accent)' } : {}}>{m.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{m.desc}</div>
                    </div>
                    {mode === m.value && <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
          {hasNotes && (
            <div className="rounded-2xl p-4 border animate-fade-up"
              style={{ background: 'var(--accent-soft)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="font-semibold text-sm">Reading your material…</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Your notes are being generated. Ask me anything about it below.
              </p>
            </div>
          )}

          {messages.length === 0 && !hasNotes && (
            <div className="text-center py-20 animate-fade-up">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6d5dfc, #8678ff)' }}>
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <p className="text-lg font-semibold mb-1">What do you want to learn?</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Ask me to explain any concept, topic or formula.
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id}
              className={cn('flex animate-fade-up', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm"
                  style={{ background: 'var(--accent)' }}>
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-full w-full rounded-2xl rounded-bl-md px-5 py-4 border prose-study"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || '…'}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-up">
              <div className="rounded-2xl rounded-bl-md px-5 py-4 border flex items-center gap-1.5"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full animate-pulse-soft"
                    style={{ background: 'var(--accent)', animationDelay: `${i * 0.18}s` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="max-w-2xl mx-auto px-5 py-4">
          {messages.length > 0 && !loading && (
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-[var(--muted)]"
                  style={{ borderColor: 'var(--border-strong)', color: 'var(--muted-foreground)' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 border rounded-2xl px-3 py-2 transition-shadow focus-within:shadow-md"
            style={{ background: 'var(--background)', borderColor: 'var(--border-strong)' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoGrow() }}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything…"
              rows={1}
              className="flex-1 text-sm outline-none resize-none bg-transparent leading-relaxed py-1.5"
              style={{ minHeight: '28px', maxHeight: '160px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30 hover:scale-105 disabled:hover:scale-100"
              style={{ background: 'var(--accent)' }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-center text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
            <span className="font-medium capitalize">{mode}</span> mode · Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
