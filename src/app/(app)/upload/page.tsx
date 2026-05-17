'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ImageIcon, FileText, Loader2, X, Sparkles, ClipboardPaste } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Step = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export default function UploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [textInput, setTextInput] = useState('')
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }, [])

  function handleFileSelect(f: File) {
    setFile(f)
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit() {
    if (mode === 'file' && !file) return
    if (mode === 'text' && !textInput.trim()) return

    setStep('uploading')
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create session
      const { data: session, error: sessionErr } = await supabase
        .from('sessions')
        .insert({ user_id: user.id, title: file?.name ?? 'Text input' })
        .select()
        .single()
      if (sessionErr) throw sessionErr

      let uploadId: string

      if (mode === 'file' && file) {
        // Upload to storage
        const path = `${user.id}/${session.id}/${file.name}`
        const { error: storageErr } = await supabase.storage
          .from('uploads')
          .upload(path, file)
        if (storageErr) throw storageErr

        // Create upload record
        const { data: upload, error: uploadErr } = await supabase
          .from('uploads')
          .insert({
            session_id: session.id,
            user_id: user.id,
            kind: file.type.startsWith('image/') ? 'screenshot' : 'pdf',
            storage_path: path,
          })
          .select()
          .single()
        if (uploadErr) throw uploadErr
        uploadId = upload.id

        setStep('processing')

        // Trigger processing
        await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId, sessionId: session.id }),
        })
      } else {
        // Text input — create upload with direct text
        const { data: upload, error: uploadErr } = await supabase
          .from('uploads')
          .insert({
            session_id: session.id,
            user_id: user.id,
            kind: 'text',
            ocr_text: textInput,
          })
          .select()
          .single()
        if (uploadErr) throw uploadErr
        uploadId = upload.id

        setStep('processing')
        await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadId, sessionId: session.id }),
        })
      }

      setSessionId(session.id)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('error')
    }
  }

  if (step === 'done' && sessionId) {
    router.push(`/session/${sessionId}`)
    return null
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-8 text-center animate-fade-up">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #6d5dfc, #8678ff)' }}>
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Share what you&apos;re studying</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
          Drop a screenshot or paste notes — I&apos;ll turn it into clean notes you can chat with.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl border mx-auto w-fit"
        style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
        {(['file', 'text'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mode === m ? 'shadow-sm' : ''
            )}
            style={mode === m
              ? { background: 'var(--card)', color: 'var(--accent)' }
              : { color: 'var(--muted-foreground)' }}>
            {m === 'file' ? <ImageIcon className="w-4 h-4" /> : <ClipboardPaste className="w-4 h-4" />}
            {m === 'file' ? 'Screenshot / PDF' : 'Paste notes'}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <div
          onDrop={handleFileDrop}
          onDragOver={e => e.preventDefault()}
          className="rounded-2xl p-10 text-center cursor-pointer transition-all relative border-2 border-dashed hover:border-solid"
          style={{ background: 'var(--card)', borderColor: 'var(--border-strong)' }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input" type="file" className="hidden"
            accept="image/*,.pdf"
            onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          {preview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="max-h-56 rounded-xl mx-auto shadow-md" />
              <button className="absolute -top-2.5 -right-2.5 w-7 h-7 text-white rounded-full flex items-center justify-center shadow-md"
                style={{ background: 'var(--destructive)' }}
                onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--accent-soft)' }}>
                <ImageIcon className="w-7 h-7" style={{ color: 'var(--accent)' }} />
              </div>
              <p className="font-semibold mb-1">Drop your screenshot or PDF</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>or click to browse your files</p>
            </>
          )}
          {file && !preview && (
            <div className="flex items-center gap-2 justify-center mt-4">
              <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          placeholder="Paste your notes, type a concept, or describe what you want to learn…"
          rows={8}
          className="w-full border rounded-2xl px-4 py-3.5 text-sm outline-none transition-shadow focus:shadow-md resize-none"
          style={{ background: 'var(--card)', borderColor: 'var(--border-strong)' }}
        />
      )}

      {error && (
        <div className="mt-4 text-sm rounded-xl px-4 py-3 border"
          style={{ background: 'color-mix(in srgb, var(--destructive) 8%, transparent)', color: 'var(--destructive)', borderColor: 'color-mix(in srgb, var(--destructive) 25%, transparent)' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={step === 'uploading' || step === 'processing' || (mode === 'file' ? !file : !textInput.trim())}
        className="mt-6 w-full text-white py-3.5 rounded-xl font-medium shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-md flex items-center justify-center gap-2"
        style={{ background: 'var(--accent)' }}
      >
        {(step === 'uploading' || step === 'processing') ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {step === 'uploading' ? 'Uploading…' : 'Reading your material…'}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate notes
          </>
        )}
      </button>

      <p className="text-center text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
        AI detects the topic, explains the concepts, and creates smart notes automatically
      </p>
    </div>
  )
}
