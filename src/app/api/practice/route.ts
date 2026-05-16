import { createClient } from '@/lib/supabase/server'
import { getFlashModel } from '@/lib/gemini/client'
import { QUIZ_PROMPT } from '@/lib/gemini/prompts'
import { NextResponse } from 'next/server'
import type { PracticeKind } from '@/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topicId, topicName, kinds, count = 5 } = await req.json() as {
    topicId: string
    topicName: string
    kinds: PracticeKind[]
    count: number
  }

  const model = getFlashModel()
  const generatedItems = []

  for (const kind of kinds) {
    try {
      const result = await model.generateContent(QUIZ_PROMPT(topicName, kind, count))
      const json = JSON.parse(result.response.text())

      for (const item of (json.items ?? [])) {
        const { data } = await supabase.from('practice_items').insert({
          topic_id: topicId,
          kind,
          payload: item,
          difficulty: 1,
        }).select().single()
        if (data) generatedItems.push(data)
      }
    } catch (err) {
      console.error(`Error generating ${kind}:`, err)
    }
  }

  return NextResponse.json({ items: generatedItems })
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const topicId = searchParams.get('topicId')

  const query = supabase
    .from('practice_items')
    .select('*, topics!inner(user_id)')
    .eq('topics.user_id', user.id)
    .limit(20)

  if (topicId) query.eq('topic_id', topicId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data })
}
