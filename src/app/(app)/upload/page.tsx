'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ImageIcon, FileText, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Upload study material</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Drop a screenshot, paste notes, or type a topic — AI will explain and structure it for you.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl border w-fit" style={{ background: 'var(--muted)' }}>
        {(['file', 'text'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${mode === m ? 'bg-white shadow-sm text-indigo-700' : 'text-[var(--muted-foreground)]'}`}>
            {m === 'file' ? '📁 File / Screenshot' : '✏️ Type notes'}
          </button>
        ))}
      </div>

      {mode === 'file' ? (
        <div
          onDrop={handleFileDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400 transition-colors relative"
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
              <img src={preview} alt="Preview" className="max-h-48 rounded-lg mx-auto" />
              <button className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'var(--muted)' }}>
                <ImageIcon className="w-6 h-6" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <p className="font-medium mb-1">Drop your screenshot or PDF here</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>or click to browse</p>
            </>
          )}
          {file && !preview && (
            <div className="flex items-center gap-2 justify-center mt-3">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          placeholder="Paste your notes, type a concept, or describe what you want to learn..."
          rows={8}
          className="w-full border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          style={{ background: 'var(--card)' }}
        />
      )}

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={step === 'uploading' || step === 'processing' || (mode === 'file' ? !file : !textInput.trim())}
        className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {(step === 'uploading' || step === 'processing') ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {step === 'uploading' ? 'Uploading...' : 'AI is processing...'}
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Explain &amp; generate notes
          </>
        )}
      </button>

      <p className="text-center text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
        AI will detect the topic, explain concepts, and create smart notes automatically
      </p>
    </div>
  )
}
