import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// This page lives at /auth/x/callback — X redirects here after OAuth approval.
// It reads the code + state from the URL, verifies state, then calls /api/auth/x-token.
export default function XAuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const returnedState = params.get('state')
      const error = params.get('error')

      if (error) {
        setErrorMsg('X authorization was denied or cancelled.')
        setStatus('error')
        return
      }

      if (!code || !returnedState) {
        setErrorMsg('Missing OAuth parameters.')
        setStatus('error')
        return
      }

      // Retrieve state + codeVerifier stored before redirect.
      // localStorage is used (not sessionStorage) so it survives cross-tab
      // redirects and the X app's in-app browser on mobile.
      const storedState = localStorage.getItem('x_oauth_state')
      const codeVerifier = localStorage.getItem('x_code_verifier')
      const walletAddress = localStorage.getItem('x_wallet_address')

      if (!storedState || returnedState !== storedState) {
        setErrorMsg('Security check failed (state mismatch). Please try again.')
        setStatus('error')
        return
      }

      if (!codeVerifier || !walletAddress) {
        setErrorMsg('Session data missing. Please try again.')
        setStatus('error')
        return
      }

      // Clean up immediately — these are single-use PKCE values
      localStorage.removeItem('x_oauth_state')
      localStorage.removeItem('x_code_verifier')
      localStorage.removeItem('x_wallet_address')

      try {
        const res = await fetch('/api/auth/x-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, codeVerifier, walletAddress }),
        })

        const data = await res.json()

        if (!res.ok) {
          setErrorMsg(data.error || 'Failed to complete login.')
          setStatus('error')
          return
        }

        // Store the session JWT
        localStorage.setItem('slime_x_session', data.sessionToken)
        localStorage.setItem('slime_x_user', JSON.stringify(data.user))

        navigate('/leaderboard')
      } catch {
        setErrorMsg('Network error. Please try again.')
        setStatus('error')
      }
    }

    run()
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#2a2a2a] flex items-center justify-center text-white">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slime-green" />
          <p className="text-gray-400 text-sm">Connecting your X account…</p>
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <p className="text-red-400 font-bold text-lg">Something went wrong</p>
          <p className="text-gray-400 text-sm max-w-sm">{errorMsg}</p>
          <button
            onClick={() => navigate('/leaderboard')}
            className="mt-4 bg-slime-green text-black font-bold px-6 py-2 rounded-lg hover:bg-[#00cc33] transition"
          >
            Back to Leaderboard
          </button>
        </div>
      )}
    </div>
  )
}
