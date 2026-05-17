import Link from 'next/link'
import { Sparkles, ArrowRight, Heart } from 'lucide-react'

const steps = [
  { emoji: '📸', title: 'Snap it', desc: 'Screenshot a slide, photograph a textbook page, or just paste your messy notes. Anything goes.', tint: 'var(--warm-soft)', color: 'var(--warm-deep)' },
  { emoji: '✨', title: 'Get clean notes', desc: 'Your AI reads it, figures out the topic, and turns it into beautiful organised notes, tables and examples.', tint: 'var(--accent-soft)', color: 'var(--accent)' },
  { emoji: '💬', title: 'Ask away', desc: 'Stuck on something? Just ask. Your tutor remembers everything and quizzes you when you’re ready.', tint: 'var(--success-soft)', color: 'var(--success)' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm brand-gradient">
            <Sparkles className="w-[18px] h-[18px] text-white" />
          </div>
          <span className="font-semibold text-[15px]">Study Companion</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="text-sm px-4 py-2 rounded-xl hover:bg-[var(--muted)] transition-colors"
            style={{ color: 'var(--muted-foreground)' }}>
            Sign in
          </Link>
          <Link href="/sign-up" className="text-sm text-white px-4 py-2 rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 brand-gradient">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-14 pb-10 text-center relative">
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8 border animate-fade-up"
          style={{ background: 'var(--warm-soft)', color: 'var(--warm-deep)', borderColor: 'color-mix(in srgb, var(--warm) 25%, transparent)' }}>
          <Heart className="w-3.5 h-3.5 fill-current" />
          Free forever — made for students, by a student
        </div>
        <h1 className="text-4xl md:text-[3.5rem] font-bold leading-[1.08] tracking-tight mb-6 animate-fade-up">
          Turn class chaos into<br />
          <span className="brand-text">notes that actually click</span>
          <span className="animate-wave ml-2">📚</span>
        </h1>
        <p className="text-lg leading-relaxed mb-9 max-w-xl mx-auto animate-fade-up" style={{ color: 'var(--muted-foreground)' }}>
          Stop wrestling with screenshots in ChatGPT. Drop in whatever you’re studying and
          get warm, friendly notes you can chat with — like having a patient tutor in your pocket.
        </p>
        <div className="flex items-center justify-center gap-3 animate-fade-up">
          <Link href="/sign-up"
            className="group flex items-center gap-2 text-white px-7 py-3.5 rounded-2xl font-semibold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 brand-gradient">
            Start learning free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/sign-in"
            className="px-7 py-3.5 rounded-2xl font-semibold border transition-colors hover:bg-[var(--muted)]"
            style={{ borderColor: 'var(--border-strong)' }}>
            I have an account
          </Link>
        </div>
      </section>

      {/* Product preview mockup */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="rounded-3xl border p-3 shadow-lg animate-fade-up"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--background)' }}>
            {/* user "upload" bubble */}
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-white max-w-[80%] shadow-sm brand-gradient">
                📸 [screenshot of lecture slide] — explain this simply?
              </div>
            </div>
            {/* AI reply */}
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-4 py-3 text-sm border max-w-[88%] space-y-2"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <p className="font-semibold">🧠 Modale Zusammenhänge</p>
                <p style={{ color: 'var(--muted-foreground)' }}>Describes <em>how</em> something is done. Here&apos;s the quick version:</p>
                <div className="rounded-lg overflow-hidden border text-xs" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex font-semibold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <div className="flex-1 px-3 py-1.5">Structure</div>
                    <div className="flex-1 px-3 py-1.5">Needs</div>
                  </div>
                  <div className="flex border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex-1 px-3 py-1.5">dadurch, dass</div>
                    <div className="flex-1 px-3 py-1.5">full sentence</div>
                  </div>
                  <div className="flex border-t" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                    <div className="flex-1 px-3 py-1.5">durch</div>
                    <div className="flex-1 px-3 py-1.5">noun</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
          ☝️ A real example — messy slide in, clean notes out
        </p>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-center text-2xl font-bold mb-2">Three steps. That&apos;s it.</h2>
        <p className="text-center text-sm mb-10" style={{ color: 'var(--muted-foreground)' }}>
          No setup, no manuals. You&apos;ll get it in 30 seconds.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map(({ emoji, title, desc, tint, color }, i) => (
            <div key={title}
              className="rounded-3xl p-6 border transition-all hover:-translate-y-1.5 hover:shadow-lg"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: tint }}>
                  {emoji}
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: tint, color }}>
                  Step {i + 1}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1.5">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="rounded-3xl p-8 border text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 className="text-xl font-bold mb-1">Whatever you&apos;re learning, it just works</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            Languages, lectures, textbooks, code docs, exam prep — bring it on.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {['🌍 Languages', '🎓 University', '🏫 School', '📜 Exam prep', '💻 Coding', '💼 Work skills'].map(t => (
              <span key={t} className="text-sm px-3.5 py-2 rounded-full border font-medium transition-transform hover:scale-105"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-7 text-center text-xs" style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
        Made with <Heart className="w-3 h-3 inline fill-current" style={{ color: 'var(--warm)' }} /> using Next.js, Supabase &amp; Gemini · Always free
      </footer>
    </div>
  )
}
