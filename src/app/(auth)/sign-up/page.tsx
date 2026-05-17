'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Brain, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const LEARNER_TYPES = [
  { value: 'school', label: '🏫 School student' },
  { value: 'university', label: '🎓 University student' },
  { value: 'language', label: '🌍 Language learner' },
  { value: 'professional', label: '💼 Professional' },
  { value: 'certification', label: '📜 Certification prep' },
]

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'profile' | 'confirm'>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [learnerType, setLearnerType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccount(e: React.FormEvent) {
    e.preventDefault()
    setStep('profile')
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Supabase may require email confirmation — handle both cases
    const needsConfirmation = !data.session && data.user && !data.user.email_confirmed_at

    if (data.user && data.session) {
      // Session is live — save profile immediately
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: name,
        learner_type: learnerType || 'university',
        default_mode: 'simple',
      })
      router.refresh()
      router.push('/dashboard')
    } else if (needsConfirmation) {
      // Email confirmation required — show message instead of redirect
      setError('')
      setStep('confirm' as 'account' | 'profile')
    } else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {step === 'account' ? 'Free forever. No credit card.' : step === 'profile' ? 'Tell us about yourself' : 'One last step'}
          </p>
        </div>

        {step !== 'confirm' && step === 'account' ? (
          <form onSubmit={handleAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@example.com"
                className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: 'var(--card)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="At least 8 characters" minLength={8}
                className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: 'var(--card)' }}
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Your name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                required placeholder="What should we call you?"
                className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: 'var(--card)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">I am a...</label>
              <div className="grid grid-cols-1 gap-2">
                {LEARNER_TYPES.map(t => (
                  <button
                    key={t.value} type="button"
                    onClick={() => setLearnerType(t.value)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${learnerType === t.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border hover:border-indigo-300'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Start learning
            </button>
          </form>
        )}

        {step === 'confirm' ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="font-semibold text-lg mb-2">Check your inbox</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account, then sign in.
            </p>
            <Link href="/sign-in" className="text-sm bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-block">
              Go to sign in
            </Link>
          </div>
        ) : (
          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
            Already have an account?{' '}
            <Link href="/sign-in" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}
