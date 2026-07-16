import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { updatePassword, useAuth, signOut } from '~/lib/auth'

const MIN_PASSWORD_LENGTH = 8

function recoveryErrorFromUrl() {
  if (typeof window === 'undefined') return ''

  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const message =
    params.get('error_description') ||
    hashParams.get('error_description') ||
    params.get('error') ||
    hashParams.get('error')

  return message ? decodeURIComponent(message.replace(/\+/g, ' ')) : ''
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(() => recoveryErrorFromUrl())
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const hasResetUrlParams = Boolean(location.search || location.hash)
    if (!loading && hasResetUrlParams && typeof window !== 'undefined') {
      const recoveryError = recoveryErrorFromUrl()
      if (recoveryError) setError(recoveryError)
      window.history.replaceState({}, document.title, '/reset-password')
    }
  }, [loading, location.hash, location.search])

  const hasValidRecoverySession = Boolean(session)
  const showInvalidLink = !loading && !hasValidRecoverySession

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setInfo('')

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await updatePassword(password)
      if (error) {
        setError(error.message)
        return
      }

      setInfo('Password updated. Redirecting you to sign in...')
      await signOut()
      window.setTimeout(() => navigate('/login', { replace: true }), 1200)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            T
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>Reset password</h1>
          <p className="text-sm text-gray-400">
            Choose a new password for your TradeDesk account.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {showInvalidLink ? (
            <div className="space-y-4">
              <div className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                {error || 'This password reset link is invalid or expired. Request a new secure link to continue.'}
              </div>
              <Link
                to="/login?mode=forgot"
                className="block w-full rounded-xl py-3.5 text-sm font-bold text-white text-center transition-all"
                style={{ backgroundColor: '#1B2A4A' }}
              >
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:border-amber-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:border-amber-400 focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                  {error}
                </div>
              )}

              {info && (
                <div className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1B2A4A' }}
              >
                {submitting ? 'Updating password...' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500">
          <Link to="/login" className="font-semibold hover:underline" style={{ color: '#1B2A4A' }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
