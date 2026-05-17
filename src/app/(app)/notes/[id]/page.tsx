import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NotePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: note } = await supabase
    .from('notes')
    .select('*, uploads!inner(session_id, user_id)')
    .eq('id', id)
    .eq('uploads.user_id', user.id)
    .single()

  if (!note) redirect('/dashboard')

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-indigo-600" />
        <h1 className="text-xl font-bold">Study Notes</h1>
      </div>

      {note.summary && (
        <div className="border rounded-2xl p-4 mb-6" style={{ background: 'var(--muted)' }}>
          <p className="text-sm font-medium mb-1">Summary</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{note.summary}</p>
        </div>
      )}

      <div className="border rounded-2xl p-5 prose-study" style={{ background: 'var(--card)' }}>
        <div dangerouslySetInnerHTML={{ __html: note.markdown }} />
      </div>

      {note.concept_cards && note.concept_cards.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>CONCEPT CARDS</h2>
          <div className="grid gap-3">
            {note.concept_cards.map((card: { term: string; definition: string; example: string }, i: number) => (
              <div key={i} className="border rounded-xl p-4" style={{ background: 'var(--card)' }}>
                <p className="font-semibold text-sm mb-1">{card.term}</p>
                <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>{card.definition}</p>
                {card.example && (
                  <p className="text-xs italic px-3 py-2 rounded-lg" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                    e.g. {card.example}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
