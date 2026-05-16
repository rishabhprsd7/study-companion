import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * Generate an embedding vector for a text chunk.
 * Uses Gemini text-embedding-004 (free tier: 1500 req/min).
 */
export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
  const result = await model.embedContent(text)
  return result.embedding.values
}

/**
 * Batch embed multiple chunks (max 100 per call).
 */
export async function embedBatch(chunks: string[]): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
  const results = await Promise.all(
    chunks.map(chunk => model.embedContent(chunk))
  )
  return results.map(r => r.embedding.values)
}

/**
 * Split text into overlapping chunks for embedding.
 * ~400 words per chunk, 50 word overlap.
 */
export function chunkText(text: string, chunkSize = 400, overlap = 50): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim()) chunks.push(chunk)
    if (i + chunkSize >= words.length) break
  }

  return chunks.length > 0 ? chunks : [text]
}
