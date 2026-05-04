import { useEffect, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

interface XUser {
  x_user_id: string
  x_username: string
  x_avatar_url: string | null
  wallet_address: string
}

interface LeaderboardEntry {
  x_user_id: string
  x_username: string
  x_avatar_url: string | null
  wallet_address: string
  nftCount: number
  slimeBalance: number
  linked_at: string
}

function shortWallet(w: string) {
  if (!w) return '—'
  const parts = w.split('.')
  return `0.0.${parts[2]?.slice(0, 4)}…`
}

export default function LeaderboardPage() {
  const { isConnected, accountId } = useWallet()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [xUser, setXUser] = useState<XUser | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [unlinking, setUnlinking] = useState(false)

  // Load session from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('slime_x_user')
    if (raw) { try { setXUser(JSON.parse(raw)) } catch { /* ignore */ } }
  }, [])

  // Fetch leaderboard
  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => setEntries(d.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleConnectX = async () => {
    if (!isConnected || !accountId) return
    setConnecting(true)
    try {
      const res = await fetch('/api/auth/x-login')
      const { authUrl, state, codeVerifier } = await res.json()
      sessionStorage.setItem('x_oauth_state', state)
      sessionStorage.setItem('x_code_verifier', codeVerifier)
      sessionStorage.setItem('x_wallet_address', accountId)
      window.location.href = authUrl
    } catch { setConnecting(false) }
  }

  const handleUnlink = async () => {
    const token = localStorage.getItem('slime_x_session')
    if (!token) return
    setUnlinking(true)
    try {
      await fetch('/api/auth/x-unlink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      localStorage.removeItem('slime_x_session')
      localStorage.removeItem('slime_x_user')
      setXUser(null)
      setEntries(e => e.filter(u => u.wallet_address !== accountId))
    } catch { /* ignore */ } finally { setUnlinking(false) }
  }

  const isLinked = !!xUser && xUser.wallet_address === accountId

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white flex flex-col">
      <Navigation />
      <main className="py-20 px-4 md:px-8 flex-grow">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <span className="text-slime-green text-xs font-bold uppercase tracking-widest">Community</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mt-2">LEADERBOARD</h1>
            <p className="text-gray-400 text-base mt-3 leading-relaxed">
              Connect your X account to appear on the leaderboard. Ranked by SLIME NFTs held.
            </p>
          </div>

          {/* Connect / Status Card */}
          <div className="bg-[#1f1f1f] border border-gray-800 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
            {isLinked ? (
              <>
                <div className="flex items-center gap-4">
                  {xUser.x_avatar_url && (
                    <img src={xUser.x_avatar_url} alt={xUser.x_username} className="w-12 h-12 rounded-full border-2 border-slime-green" />
                  )}
                  <div>
                    <p className="text-white font-bold">@{xUser.x_username}</p>
                    <p className="text-gray-500 text-xs font-mono">{accountId}</p>
                  </div>
                </div>
                <button
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="text-xs text-gray-500 hover:text-red-400 transition font-bold uppercase tracking-wider py-2 px-4"
                >
                  {unlinking ? 'Unlinking…' : 'Unlink X Account'}
                </button>
              </>
            ) : isConnected ? (
              <>
                <div>
                  <p className="text-white font-bold">Wallet connected</p>
                  <p className="text-gray-500 text-xs font-mono">{accountId}</p>
                </div>
                <button
                  onClick={handleConnectX}
                  disabled={connecting}
                  className="bg-slime-green text-black font-bold px-6 py-2.5 rounded-xl hover:bg-[#00cc33] transition text-sm flex items-center gap-2"
                >
                  {connecting ? 'Redirecting…' : '𝕏  Connect X to Join'}
                </button>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Connect your Hedera wallet to join the leaderboard.</p>
            )}
          </div>

          {/* Leaderboard Table */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-24 text-gray-500">
              <p className="text-lg font-bold text-white mb-2">No entries yet</p>
              <p className="text-sm">Be the first to connect your X account and claim the top spot.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry, i) => (
                <div
                  key={entry.x_user_id}
                  className={`bg-[#1a1a1a] border rounded-2xl p-4 flex items-center gap-4 transition ${
                    entry.wallet_address === accountId ? 'border-slime-green/40' : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {/* Rank */}
                  <span className={`text-lg font-black w-8 text-center flex-shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  {entry.x_avatar_url ? (
                    <img src={entry.x_avatar_url} alt={entry.x_username} className="w-10 h-10 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0" />
                  )}

                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">@{entry.x_username}</p>
                    <p className="text-gray-600 text-xs font-mono">{shortWallet(entry.wallet_address)}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="text-slime-green font-black text-base">{entry.nftCount} NFTs</span>
                    <span className="text-gray-500 text-xs">{Number(entry.slimeBalance).toLocaleString()} $SLIME</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
