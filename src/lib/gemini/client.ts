import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/** Flash — cheap, fast. Use for classification, tagging, quiz gen. */
export function getFlashModel(): GenerativeModel {
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
}

/** Flash multimodal — screenshot OCR + understanding. */
export function getVisionModel(): GenerativeModel {
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
}

/** Pro — richer explanations, long PDFs. Use sparingly. */
export function getProModel(): GenerativeModel {
  return genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
}

export { genAI }
