import Link from 'next/link'
import { Brain, Zap, MessageSquare, BookOpen, Target, BarChart3 } from 'lucide-react'

const features = [
  { icon: Brain, title: 'Screenshot Learning', desc: 'Upload any screenshot and get instant explanations, notes, and examples.' },
  { icon: MessageSquare, title: 'AI Chat Companion', desc: 'Ask follow-up questions naturally. Context-aware answers every time.' },
  { icon: Zap, title: 'Practice Generator', desc: 'Auto-generate MCQs, flashcards, and fill-in-the-blank questions.' },
  { icon: Target, title: 'Confusion Detection', desc: 'Tracks what you struggle with and targets those areas automatically.' },
  { icon: BookOpen, title: 'Smart Notes', desc: 'Converts messy material into clean markdown notes and concept cards.' },
  { icon: BarChart3, title: 'Study Timeline', desc: 'See your daily progress, streaks, and strongest vs weakest topics.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold">Study Companion</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--muted-foreground)' }}>
            Sign in
          </Link>
          <Link href="/sign-up" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6"
          style={{ background: '#eef2ff', color: '#4338ca' }}>
          <Zap className="w-3 h-3" />
          Free forever — no credit card needed
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
          Your AI second brain<br />for learning anything
        </h1>
        <p className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          Upload screenshots from lectures, paste notes, or type a topic — and instantly get simple explanations,
          structured notes, practice quizzes, and a daily recap of everything you studied.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/sign-up" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Start studying free
          </Link>
          <Link href="/sign-in" className="border px-6 py-3 rounded-xl font-medium hover:opacity-80 transition-opacity">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="border rounded-2xl p-5" style={{ background: 'var(--card)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: '#eef2ff' }}>
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold mb-1.5">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Built with Next.js, Supabase &amp; Gemini AI — 100% free to use.
      </footer>
    </div>
  )
}
