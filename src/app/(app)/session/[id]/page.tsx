import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatInterface from '@/components/chat/ChatInterface'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: session } = await supabase
    .from('sessions')
    .select('*, uploads(*), messages(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_mode')
    .eq('id', user.id)
    .single()

  return (
    <ChatInterface
      session={session}
      initialMode={profile?.default_mode ?? 'simple'}
      userId={user.id}
    />
  )
}
