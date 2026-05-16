'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, BookOpen, Dumbbell, ChevronDown } from 'lucide-react'
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

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // If no messages yet and we have an upload, show initial notes
  const uploads = session.uploads ?? []
  const hasNotes = uploads.length > 0 && messages.length === 0

  async function sendMessage() {
    const content = input.trim()
    if (!content || loading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    setInput('')
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
          // Parse SSE data lines
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
    } catch (err) {
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b px-5 py-3 flex items-center justify-between shrink-0" style={{ background: 'var(--card)' }}>
        <div>
          <h1 className="font-semibold text-sm">{session.title ?? session.subject ?? 'Study session'}</h1>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {uploads.length > 0 ? `${uploads.length} upload${uploads.length > 1 ? 's' : ''}` : 'Chat session'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode picker */}
          <div className="relative">
            <button
              onClick={() => setShowModeMenu(v => !v)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border hover:border-indigo-400 transition-colors"
            >
              {MODES.find(m => m.value === mode)?.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showModeMenu && (
              <div className="absolute right-0 top-full mt-1 border rounded-xl shadow-lg z-10 py-1 w-48" style={{ background: 'var(--card)' }}>
                {MODES.map(m => (
                  <button key={m.value} onClick={() => { setMode(m.value); setShowModeMenu(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors',
                      mode === m.value && 'text-indigo-600 font-medium'
                    )}>
                    <div className="font-medium">{m.label}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {hasNotes && (
          <div className="border rounded-2xl p-4 text-sm" style={{ background: 'var(--muted)' }}>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span className="font-medium">Material uploaded — notes are being generated...</span>
            </div>
            <p style={{ color: 'var(--muted-foreground)' }}>Ask me anything about your material, or wait for the notes to appear.</p>
          </div>
        )}

        {messages.length === 0 && !hasNotes && (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="font-medium mb-1">What do you want to learn?</p>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Ask me to explain any concept, topic, or formula.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'border rounded-bl-sm prose-study'
            )} style={msg.role === 'assistant' ? { background: 'var(--card)' } : {}}>
              {msg.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2" style={{ background: 'var(--card)' }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3 shrink-0" style={{ background: 'var(--card)' }}>
        <div className="flex items-end gap-2 border rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500" style={{ background: 'var(--background)' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Enter to send)"
            rows={1}
            className="flex-1 text-sm outline-none resize-none bg-transparent leading-relaxed py-1 max-h-32"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 hover:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-center text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
          Mode: <span className="font-medium capitalize">{mode}</span> · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

// Minimal markdown → HTML (no deps needed for basic formatting)
function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hublp])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}
