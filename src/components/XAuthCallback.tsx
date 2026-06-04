import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Decode a base64url string in the browser (no Node.js Buffer needed).
function decodeBase64url(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  return atob(padded)
}

// This page lives at /auth/x/callback — X redirects here after OAuth approval.
// It reads the code + state from the URL then calls /api/auth/x-token.
//
// PKCE recovery strategy (in priority order):
//   1. Decode verifier + wallet from the state parameter itself (new flow).
//      This works in every environment including HashPack's in-app WebView,
//      where localStorage is NOT preserved across cross-origin navigations.
//   2. Fall back to localStorage for any in-flight sessions started before
//      this change was deployed.
export default function XAuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
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

      // ── Strategy 1: state-embedded PKCE (new flow, WebView-safe) ──────────
      let codeVerifier: string | null = null
      let walletAddress: string | null = null

      try {
        const payload = JSON.parse(decodeBase64url(returnedState))
        if (payload.v && payload.w) {
          codeVerifier = payload.v
          walletAddress = payload.w
        }
      } catch { /* not a new-style state — fall through */ }

      // ── Strategy 2: localStorage fallback (legacy flow) ────────────────────
      if (!codeVerifier || !walletAddress) {
        const storedState   = localStorage.getItem('x_oauth_state')
        const storedVerifier = localStorage.getItem('x_code_verifier')
        const storedWallet   = localStorage.getItem('x_wallet_address')

        if (!storedState || returnedState !== storedState) {
          setErrorMsg('Security check failed (state mismatch). Please try again.')
          setStatus('error')
          return
        }

        if (!storedVerifier || !storedWallet) {
          setErrorMsg('Session data missing. Please try again.')
          setStatus('error')
          return
        }

        codeVerifier  = storedVerifier
        walletAddress = storedWallet
      }

      // Clean up localStorage (harmless if already empty)
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

        try { localStorage.setItem('slime_x_session', data.sessionToken) } catch { /* ignore */ }
        try { localStorage.setItem('slime_x_user', JSON.stringify(data.user)) } catch { /* ignore */ }

        setStatus('success')

        // Try to close this tab and return to HashPack.
        // window.opener is null when opened from a WKWebView → Safari crossing,
        // so we attempt close() regardless and fall back to the manual UI below.
        setTimeout(() => { try { window.close() } catch { /* ignore */ } }, 1500)
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

      {status === 'success' && (
        <div className="flex flex-col items-center gap-5 text-center px-8 max-w-sm">
          <div className="text-5xl">✅</div>
          <p className="text-white font-black text-2xl">X Account Linked!</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your X account is now connected to your Hedera wallet.
          </p>
          <div className="bg-[#1f1f1f] border border-gray-700 rounded-xl p-4 text-left w-full">
            <p className="text-slime-green text-xs font-bold uppercase tracking-widest mb-1">Next step</p>
            <p className="text-white text-sm font-bold">Return to HashPack</p>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              Close this tab and go back to HashPack — your rank will appear on the leaderboard automatically.
            </p>
          </div>
          <button
            onClick={() => { try { window.close() } catch { navigate('/leaderboard') } }}
            className="bg-slime-green text-black font-bold px-8 py-3 rounded-xl hover:bg-[#00cc33] transition text-sm w-full"
          >
            Close &amp; Return to HashPack
          </button>
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
