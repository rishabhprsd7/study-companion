import { getVisionModel } from '@/lib/gemini/client'

/**
 * Extract text from an image using Gemini Vision (server-side).
 * Handles screenshots, handwriting, diagrams, and mixed content.
 */
export async function extractTextFromImage(
  imageData: string, // base64
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<{ text: string; description: string }> {
  const model = getVisionModel()

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageData,
        mimeType,
      },
    },
    `Extract all text from this image exactly as written.
Then on a new line write "---DESCRIPTION---" and briefly describe any diagrams, charts, or visual elements.

Format:
[extracted text]
---DESCRIPTION---
[visual description]`,
  ])

  const raw = result.response.text()
  const parts = raw.split('---DESCRIPTION---')

  return {
    text: parts[0]?.trim() ?? raw,
    description: parts[1]?.trim() ?? '',
  }
}

/**
 * Convert a File/Blob to base64 string (client-side helper).
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // strip data URL prefix
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
