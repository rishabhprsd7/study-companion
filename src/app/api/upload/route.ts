import { createClient } from '@/lib/supabase/server'
import { getVisionModel, getFlashModel } from '@/lib/gemini/client'
import { TOPIC_DETECT_PROMPT, SMART_NOTES_PROMPT } from '@/lib/gemini/prompts'
import { NextResponse } from 'next/server'
import type { ExplanationMode } from '@/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { uploadId, sessionId } = await req.json()

  // Get upload record
  const { data: upload } = await supabase
    .from('uploads')
    .select('*')
    .eq('id', uploadId)
    .eq('user_id', user.id)
    .single()

  if (!upload) return NextResponse.json({ error: 'Upload not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_mode')
    .eq('id', user.id)
    .single()

  const mode: ExplanationMode = profile?.default_mode ?? 'simple'

  let ocrText = upload.ocr_text ?? ''

  // OCR if it's a file upload (screenshot/pdf)
  if (upload.kind !== 'text' && upload.storage_path) {
    try {
      const { data: fileData } = await supabase.storage
        .from('uploads')
        .download(upload.storage_path)

      if (fileData) {
        const arrayBuffer = await fileData.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = upload.kind === 'pdf' ? 'application/pdf' : 'image/jpeg'

        const visionModel = getVisionModel()
        const result = await visionModel.generateContent([
          { inlineData: { data: base64, mimeType } },
          'Extract all text from this image. Then describe any diagrams or visual elements after the text.',
        ])
        ocrText = result.response.text()

        await supabase.from('uploads').update({ ocr_text: ocrText }).eq('id', uploadId)
      }
    } catch (err) {
      console.error('OCR error:', err)
      // Continue with empty text
    }
  }

  if (!ocrText.trim()) {
    return NextResponse.json({ ok: true, note: 'No text extracted' })
  }

  // Topic detection
  let detectedTopic = 'General'
  let subject = 'General'
  try {
    const flashModel = getFlashModel()
    const topicResult = await flashModel.generateContent(`${TOPIC_DETECT_PROMPT}\n\nText:\n${ocrText.slice(0, 2000)}`)
    const topicJson = JSON.parse(topicResult.response.text())
    detectedTopic = topicJson.topic ?? 'General'
    subject = topicJson.subject ?? 'General'

    await supabase.from('uploads').update({
      detected_topic: detectedTopic,
      language: topicJson.language,
    }).eq('id', uploadId)

    // Update session title
    await supabase.from('sessions').update({
      title: detectedTopic,
      subject,
    }).eq('id', sessionId)

    // Upsert topic
    await supabase.from('topics').upsert({
      user_id: user.id,
      name: detectedTopic,
      subject,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'user_id,name' })
  } catch (err) {
    console.error('Topic detection error:', err)
  }

  // Smart notes generation
  try {
    const flashModel = getFlashModel()
    const notesResult = await flashModel.generateContent(
      `${SMART_NOTES_PROMPT(mode)}\n\nMaterial:\n${ocrText.slice(0, 4000)}`
    )
    const notesJson = JSON.parse(notesResult.response.text())

    // Get topic id
    const { data: topic } = await supabase
      .from('topics')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', detectedTopic)
      .single()

    await supabase.from('notes').insert({
      upload_id: uploadId,
      topic_id: topic?.id,
      markdown: notesJson.markdown ?? ocrText,
      summary: notesJson.summary,
      concept_cards: notesJson.concept_cards ?? [],
    })
  } catch (err) {
    console.error('Notes generation error:', err)
  }

  return NextResponse.json({ ok: true, topic: detectedTopic })
}
