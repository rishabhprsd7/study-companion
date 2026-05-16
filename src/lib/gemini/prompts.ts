import { ExplanationMode } from '@/types'

export const MODE_OVERLAYS: Record<ExplanationMode, string> = {
  beginner:
    'Use very simple language (grade 6 level). Use everyday analogies. Avoid jargon. Break everything into tiny steps.',
  simple:
    'Use clear, plain language. Explain like talking to a smart friend. Avoid unnecessary technical terms.',
  exam:
    'Use precise academic/exam terminology. Format answers the way examiners expect. Include key definitions.',
  advanced:
    'Use technical depth. Include edge cases, derivations, and nuance. Assume strong domain knowledge.',
}

export function buildSystemPrompt(mode: ExplanationMode, weakAreas: string[] = []): string {
  return `You are an intelligent AI study companion — a friendly second brain for learning.
Your role is to help students understand concepts, not just memorise them.

Explanation style: ${MODE_OVERLAYS[mode]}

${weakAreas.length > 0 ? `The student has previously struggled with: ${weakAreas.join(', ')}. Proactively address these when relevant.` : ''}

Guidelines:
- Always be encouraging, never condescending
- Use bullet points and structure for clarity
- Generate examples automatically when explaining concepts
- If the student seems confused, re-explain differently
- Keep responses focused and concise
- Use markdown formatting for all responses`
}

export const TOPIC_DETECT_PROMPT = `Analyse the following text and return a JSON object with:
{
  "topic": "specific topic name",
  "subject": "broad subject area (e.g. Mathematics, Biology, English, History)",
  "language": "language of the content (e.g. English, Spanish)",
  "confidence": 0.0-1.0,
  "key_terms": ["term1", "term2", "term3"]
}
Only return valid JSON, no markdown.`

export const SMART_NOTES_PROMPT = (mode: ExplanationMode) => `Convert the following study material into structured smart notes.
Return a JSON object with:
{
  "markdown": "full markdown notes with headings, bullets, and emphasis",
  "summary": "2-3 sentence plain English summary",
  "concept_cards": [
    { "term": "key term", "definition": "clear definition", "example": "concrete example" }
  ]
}
Explanation mode: ${MODE_OVERLAYS[mode]}
Only return valid JSON, no markdown code fences.`

export const QUIZ_PROMPT = (topic: string, kind: string, count: number) => `Generate ${count} ${kind} practice questions about "${topic}".

For MCQ return:
{ "items": [{ "question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..." }] }

For fill-in-the-blank return:
{ "items": [{ "sentence": "The ___ is the powerhouse of the cell.", "blank": "mitochondria", "hint": "organelle" }] }

For flashcard return:
{ "items": [{ "front": "term or question", "back": "definition or answer" }] }

Only return valid JSON, no markdown.`

export const RECAP_PROMPT = `Based on this study session, generate a daily recap as JSON:
{
  "topics_covered": ["topic1", "topic2"],
  "key_concepts": ["concept1", "concept2", "concept3"],
  "weak_areas": ["area where student struggled or asked repeatedly"],
  "vocabulary": ["new term 1", "new term 2"],
  "recommended_revision": ["specific thing to revise next time"],
  "generated_at": "ISO timestamp"
}
Only return valid JSON, no markdown.`
