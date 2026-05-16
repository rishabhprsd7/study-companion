import { createClient } from '@/lib/supabase/server'
import { getFlashModel } from '@/lib/gemini/client'
import { buildSystemPrompt } from '@/lib/gemini/prompts'
import { NextResponse } from 'next/server'
import type { ExplanationMode } from '@/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, message, mode, history } = await req.json() as {
    sessionId: string
    message: string
    mode: ExplanationMode
    history: { role: string; content: string }[]
  }

  // Fetch weak areas for this user
  const { data: weakTopics } = await supabase
    .from('topics')
    .select('name')
    .eq('user_id', user.id)
    .lt('mastery_score', 0.4)
    .limit(5)

  const weakAreas = (weakTopics ?? []).map(t => t.name)

  // RAG: find relevant notes via text search (pgvector later)
  const { data: relevantNotes } = await supabase
    .from('notes')
    .select('markdown, summary')
    .eq('uploads.session_id', sessionId)
    .limit(3)

  const contextBlock = relevantNotes?.length
    ? `\n<context>\n${relevantNotes.map(n => n.summary ?? n.markdown).join('\n---\n')}\n</context>`
    : ''

  // Save user message
  await supabase.from('messages').insert({
    session_id: sessionId,
    role: 'user',
    content: message,
    mode,
  })

  const model = getFlashModel()
  const systemPrompt = buildSystemPrompt(mode, weakAreas) + contextBlock

  // Build chat
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I am ready to help you study.' }] },
      ...history.slice(-8).map(h => ({
        role: h.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: h.content }],
      })),
    ],
  })

  const streamResult = await chat.sendMessageStream(message)

  let fullResponse = ''
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamResult.stream) {
          const text = chunk.text()
          fullResponse += text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))

        // Save assistant message
        await supabase.from('messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: fullResponse,
          mode,
        })
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
