import { createClient } from '@/lib/supabase/server'
import { getFlashModel } from '@/lib/gemini/client'
import { RECAP_PROMPT } from '@/lib/gemini/prompts'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await req.json()

  // Gather session data
  const { data: messages } = await supabase
    .from('messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at')

  const { data: notes } = await supabase
    .from('notes')
    .select('summary, concept_cards')
    .eq('uploads.session_id', sessionId)

  const transcript = (messages ?? [])
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n')
    .slice(0, 6000)

  const notesSummary = (notes ?? [])
    .map(n => n.summary)
    .filter(Boolean)
    .join('\n')

  const model = getFlashModel()

  try {
    const result = await model.generateContent(
      `${RECAP_PROMPT}\n\nSession transcript:\n${transcript}\n\nNotes:\n${notesSummary}`
    )
    const recap = JSON.parse(result.response.text())
    recap.generated_at = new Date().toISOString()

    // Save recap + end session
    await supabase.from('sessions').update({
      recap,
      ended_at: new Date().toISOString(),
    }).eq('id', sessionId)

    // Update mastery: boost weak areas
    for (const weakArea of (recap.weak_areas ?? [])) {
      await supabase.from('confusions').insert({
        user_id: user.id,
        signal: 'recap_weak_area',
        details: { area: weakArea, session_id: sessionId },
      })
    }

    return NextResponse.json({ recap })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
