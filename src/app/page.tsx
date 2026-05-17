import Link from 'next/link'
import { Sparkles, ArrowRight, Camera, MessageCircle, FileText, Check } from 'lucide-react'

const steps = [
  { icon: Camera, title: 'Upload anything', desc: 'A screenshot of a slide, a textbook photo, a PDF, or just paste your messy notes.' },
  { icon: FileText, title: 'Get instant notes', desc: 'AI reads it, detects the topic, and turns it into clean structured notes, tables and examples.' },
  { icon: MessageCircle, title: 'Ask anything', desc: 'Chat with an AI tutor about the material. Practice with quizzes generated from your own notes.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #6d5dfc, #8678ff)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">Study Companion</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="text-sm px-4 py-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            style={{ color: 'var(--muted-foreground)' }}>
            Sign in
          </Link>
          <Link href="/sign-up" className="text-sm text-white px-4 py-2 rounded-lg shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ background: 'var(--accent)' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3.5 py-1.5 rounded-full mb-7 border animate-fade-up"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--border)' }}>
          <Sparkles className="w-3.5 h-3.5" />
          Free forever · No credit card
        </div>
        <h1 className="text-4xl md:text-[3.25rem] font-bold leading-[1.1] tracking-tight mb-6 animate-fade-up">
          Upload anything.<br />
          <span style={{ background: 'linear-gradient(135deg, #6d5dfc, #8678ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Understand everything.
          </span>
        </h1>
        <p className="text-lg leading-relaxed mb-9 max-w-xl mx-auto animate-fade-up" style={{ color: 'var(--muted-foreground)' }}>
          Stop pasting screenshots into ChatGPT. Study Companion turns your class slides,
          textbook pages and messy notes into clean structured notes you can chat with and practise.
        </p>
        <div className="flex items-center justify-center gap-3 animate-fade-up">
          <Link href="/sign-up"
            className="group flex items-center gap-2 text-white px-6 py-3 rounded-xl font-medium shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: 'var(--accent)' }}>
            Start studying free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link href="/sign-in"
            className="px-6 py-3 rounded-xl font-medium border transition-colors hover:bg-[var(--muted)]"
            style={{ borderColor: 'var(--border-strong)' }}>
            Sign in
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title}
              className="rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-lg"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-soft)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  Step {i + 1}
                </span>
              </div>
              <h3 className="font-semibold mb-1.5">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="rounded-2xl p-8 border text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 className="text-xl font-bold mb-5">Built for every kind of learner</h2>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {['Language learners', 'University students', 'School students', 'Exam prep', 'Self-taught coders', 'Professionals'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
        Built with Next.js, Supabase &amp; Gemini AI · 100% free to use
      </footer>
    </div>
  )
}
