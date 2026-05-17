import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInterface from '@/components/chat/ChatInterface'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Fetch session — gracefully handle missing related tables
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) {
    // If it's a "relation does not exist" error, show setup banner; otherwise 404 back
    if (sessionError?.message?.includes('relation')) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="max-w-sm text-center px-6">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="font-semibold text-lg mb-2">Database not set up yet</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Run <code className="text-xs bg-stone-100 px-1.5 py-0.5 rounded">supabase/migrations/001_initial_schema.sql</code> in your Supabase SQL editor first.
            </p>
            <Link href="/dashboard" className="text-sm text-indigo-600 underline">← Back to dashboard</Link>
          </div>
        </div>
      )
    }
    redirect('/dashboard')
  }

  // Fetch uploads and messages separately so a missing table doesn't break the session
  const [uploadsRes, messagesRes, profileRes] = await Promise.all([
    supabase.from('uploads').select('*').eq('session_id', id),
    supabase.from('messages').select('*').eq('session_id', id).order('created_at'),
    supabase.from('profiles').select('default_mode').eq('id', user.id).single(),
  ])

  const fullSession = {
    ...session,
    uploads: uploadsRes.data ?? [],
    messages: messagesRes.data ?? [],
  }

  return (
    <ChatInterface
      session={fullSession}
      initialMode={profileRes.data?.default_mode ?? 'simple'}
      userId={user.id}
    />
  )
}
