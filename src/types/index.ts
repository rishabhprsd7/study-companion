export type LearnerType = 'school' | 'university' | 'language' | 'professional' | 'certification'
export type ExplanationMode = 'beginner' | 'simple' | 'exam' | 'advanced'
export type UploadKind = 'screenshot' | 'pdf' | 'text'
export type PracticeKind = 'mcq' | 'fill' | 'flashcard' | 'correction' | 'short'
export type MessageRole = 'user' | 'assistant'

export interface Profile {
  id: string
  display_name: string | null
  learner_type: LearnerType | null
  default_mode: ExplanationMode
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  title: string | null
  subject: string | null
  started_at: string
  ended_at: string | null
  recap: DailyRecap | null
}

export interface Upload {
  id: string
  session_id: string
  user_id: string
  kind: UploadKind
  storage_path: string | null
  ocr_text: string | null
  detected_topic: string | null
  language: string | null
  created_at: string
}

export interface Note {
  id: string
  upload_id: string
  topic_id: string | null
  markdown: string
  summary: string | null
  concept_cards: ConceptCard[] | null
  created_at: string
}

export interface ConceptCard {
  term: string
  definition: string
  example: string
}

export interface ChatMessage {
  id: number
  session_id: string
  role: MessageRole
  content: string
  mode: ExplanationMode | null
  created_at: string
}

export interface Topic {
  id: string
  user_id: string
  name: string
  subject: string | null
  mastery_score: number
  last_seen_at: string | null
}

export interface PracticeItem {
  id: string
  topic_id: string
  kind: PracticeKind
  payload: MCQPayload | FillPayload | FlashcardPayload | ShortPayload
  difficulty: number
  created_at: string
}

export interface MCQPayload {
  question: string
  options: string[]
  answer: number // index
  explanation: string
}

export interface FillPayload {
  sentence: string
  blank: string
  hint?: string
}

export interface FlashcardPayload {
  front: string
  back: string
}

export interface ShortPayload {
  question: string
  model_answer: string
}

export interface DailyRecap {
  topics_covered: string[]
  key_concepts: string[]
  weak_areas: string[]
  vocabulary: string[]
  recommended_revision: string[]
  generated_at: string
}

export interface ConceptEdge {
  from_concept_id: string
  to_concept_id: string
  kind: string
  weight: number
}
