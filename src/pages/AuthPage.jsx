import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Anchor, ArrowRight, Lock, Mail, Sparkles, User as UserIcon, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </svg>
  )
}

export default function AuthPage() {
  const { user, login, register, loginWithGoogle, startDemo } = useAuth()
  const [mode, setMode] = useState('LOGIN') // 'LOGIN' | 'REGISTER'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Quick Google Sign-In modal state (used when VITE_GOOGLE_CLIENT_ID is not yet set)
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false)
  const [googleForm, setGoogleForm] = useState({
    name: '',
    email: '',
  })

  const googleBtnRef = useRef(null)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!googleClientId) return

    const scriptId = 'google-identity-services'
    const initializeGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              setSubmitting(true)
              setError('')
              await loginWithGoogle({ credential: response.credential })
            } catch (err) {
              setError(err.message || 'Google sign-in failed')
            } finally {
              setSubmitting(false)
            }
          },
        })
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'continue_with',
        })
      }
    }

    if (document.getElementById(scriptId)) {
      initializeGoogle()
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initializeGoogle
    document.body.appendChild(script)
  }, [googleClientId, loginWithGoogle])

  if (user) {
    return <Navigate to="/trips" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      if (mode === 'REGISTER') {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        })
      } else {
        await login({
          email: formData.email,
          password: formData.password,
        })
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleQuickSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      await loginWithGoogle({
        name: googleForm.name,
        email: googleForm.email,
      })
      setIsGoogleModalOpen(false)
    } catch (err) {
      setError(err.message || 'Google authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartDemo = async () => {
    try {
      setSubmitting(true)
      setError('')
      await startDemo()
    } catch (err) {
      setError(err.message || 'Failed to launch demo session')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand-accent flex items-center justify-center text-brand-surface shadow-sm">
          <Anchor className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy leading-tight">
            FishCatch
          </h1>
          <p className="text-xs font-medium text-brand-navy/65">
            Fishing Fleet Management & Bookkeeping
          </p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-md max-w-md w-full overflow-hidden">
        <div className="h-1.5 bg-brand-accent w-full" />

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 border-b border-brand-secondary bg-brand-secondary/40 p-1.5 m-6 mb-0 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN')
              setError('')
            }}
            className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              mode === 'LOGIN'
                ? 'bg-brand-surface text-brand-navy shadow-xs'
                : 'text-brand-navy/60 hover:text-brand-navy'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER')
              setError('')
            }}
            className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              mode === 'REGISTER'
                ? 'bg-brand-surface text-brand-navy shadow-xs'
                : 'text-brand-navy/60 hover:text-brand-navy'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">
              {mode === 'LOGIN' ? 'Welcome back' : 'Create your fleet account'}
            </h2>
            <p className="text-xs text-brand-navy/65 mt-1">
              {mode === 'LOGIN'
                ? 'Sign in to access your vessels, crew members, kasbon ledger, and trip accounting.'
                : 'Each account has its own private vessels, crew (ABK), kasbon, and trip records.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Google Sign-In & Interactive Demo Section */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={submitting}
              onClick={handleStartDemo}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-brand-secondary hover:bg-brand-accent text-brand-navy hover:text-brand-surface border border-brand-accent/30 text-sm font-bold transition cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-brand-accent group-hover:text-brand-surface" />
              <span>Try Interactive Demo (Pre-filled & Auto-Cleaned)</span>
            </button>

            {googleClientId ? (
              <div ref={googleBtnRef} className="flex justify-center" />
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setError('')
                  setIsGoogleModalOpen(true)
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-brand-surface border border-brand-navy/25 hover:bg-brand-secondary/50 text-brand-navy text-sm font-semibold transition cursor-pointer shadow-2xs"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-brand-navy/15 flex-1" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy/50 whitespace-nowrap shrink-0">
              Or with email
            </span>
            <div className="h-px bg-brand-navy/15 flex-1" />
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Full Name / Fleet Owner Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-brand-navy/45 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Juragan Andi"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-brand-navy text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-navy/45 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-brand-navy text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-navy/45 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-brand-navy text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-accent text-brand-surface font-bold text-sm hover:opacity-95 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <span>
                {submitting
                  ? 'Please wait...'
                  : mode === 'LOGIN'
                    ? 'Sign In to Workspace'
                    : 'Create Account & Start'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Google Account Sign-In Modal (when VITE_GOOGLE_CLIENT_ID is not yet set in .env) */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-xs p-4">
          <div className="bg-brand-surface rounded-2xl border border-brand-secondary shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-secondary">
              <div className="flex items-center gap-2.5">
                <GoogleIcon />
                <h2 className="text-base font-bold text-brand-navy">
                  Sign in with Google
                </h2>
              </div>
              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="p-1.5 rounded-lg text-brand-navy/60 hover:bg-brand-secondary hover:text-brand-navy transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGoogleQuickSubmit} className="p-6 space-y-4">
              <p className="text-xs text-brand-navy/70">
                Enter your Google account details below to sign in or automatically register your isolated fleet workspace.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Google Email *
                </label>
                <input
                  type="email"
                  required
                  value={googleForm.email}
                  onChange={(e) =>
                    setGoogleForm({ ...googleForm, email: e.target.value })
                  }
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-brand-navy text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy/80 mb-1.5">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={googleForm.name}
                  onChange={(e) =>
                    setGoogleForm({ ...googleForm, name: e.target.value })
                  }
                  placeholder="e.g. Brian Fleet Owner"
                  className="w-full px-3.5 py-2.5 rounded-xl text-brand-navy text-sm"
                />
              </div>

              <div className="rounded-xl bg-brand-secondary/60 p-3 text-[11px] text-brand-navy/70">
                <strong>Tip for Production OAuth Popup:</strong> You can also set{' '}
                <code className="font-mono text-brand-accent">VITE_GOOGLE_CLIENT_ID</code>{' '}
                in <code className="font-mono">frontend/.env</code> to use Google Cloud Console&apos;s native OAuth popup.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-secondary">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-brand-secondary text-brand-navy text-sm font-semibold hover:opacity-90 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-brand-accent text-brand-surface text-sm font-semibold hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Signing in...' : 'Continue with Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

