import { useEffect, useRef, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

const SLIME_TOKEN = '0.0.9474754'
const MIRROR_BASE = 'https://mainnet.mirrornode.hedera.com/api/v1'

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

interface WalletNFT {
  serial_number: number
  name: string
  imageUrl: string
  correctedRank: number
  correctedRarity: number
  attributes: Array<{ trait_type: string; value: string }>
}

function shortWallet(w: string) {
  if (!w) return '—'
  const parts = w.split('.')
  return `0.0.${parts[2]?.slice(0, 4)}…`
}

// Use the stored (Bearer-token-refreshed) avatar URL when available;
// fall back to unavatar.io only if the Supabase field is empty.
function avatarSrc(username: string, avatarUrl?: string | null): string {
  if (avatarUrl) return avatarUrl
  return `https://unavatar.io/x/${encodeURIComponent(username)}`
}

function rankColor(rank: number): string {
  if (rank <= 14)  return 'text-red-400'
  if (rank <= 49)  return 'text-orange-400'
  if (rank <= 124) return 'text-purple-400'
  if (rank <= 249) return 'text-blue-400'
  if (rank <= 499) return 'text-green-400'
  return 'text-gray-400'
}

// Detect any in-app WebView (HashPack, Android Chrome Custom Tab, iOS WKWebView).
// Used to decide whether to open Twitter OAuth in a real browser window.
//
// Why not just check for "Safari" in the UA?  Many WKWebViews deliberately
// include "Safari" in their user-agent string for site-compatibility reasons.
// The reliable signal for a REAL iOS Safari is the presence of "Version/X.X"
// immediately before "Safari/XXX".  WKWebViews never include that fragment.
function isInAppBrowser(): boolean {
  const ua = navigator.userAgent
  // HashPack may inject a window object — check first
  if (typeof (window as any).hashpack !== 'undefined') return true
  // Android WebView always appends " wv" to the UA
  if (/ wv\)/.test(ua)) return true
  // iOS: is it an iPhone/iPad/iPod that is NOT real Mobile Safari?
  // Real Safari always contains "Version/X.X" (e.g. "Version/17.0").
  // WKWebViews on iOS lack this fragment.
  if (/iPhone|iPad|iPod/.test(ua) && !/Version\/\d+\.\d+/.test(ua)) return true
  return false
}

export default function LeaderboardPage() {
  const { isConnected, accountId } = useWallet()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [xUser, setXUser] = useState<XUser | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [oauthPending, setOauthPending] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Wallet NFT modal
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)
  const [walletNFTs, setWalletNFTs] = useState<WalletNFT[]>([])
  const [loadingWalletNFTs, setLoadingWalletNFTs] = useState(false)
  const [fullTraitCounts, setFullTraitCounts] = useState<Record<string, Record<string, number>>>({})

  // NFT detail lightbox
  const [selectedNft, setSelectedNft] = useState<WalletNFT | null>(null)

  // Load session: first check localStorage (fast), then verify against DB by wallet (cross-device)
  useEffect(() => {
    const raw = localStorage.getItem('slime_x_user')
    if (raw) { try { setXUser(JSON.parse(raw)) } catch { /* ignore */ } }
  }, [])

  // When wallet connects, check Supabase for an existing link (works on any device)
  useEffect(() => {
    if (!isConnected || !accountId) return
    fetch(`/api/auth/check-wallet?wallet=${encodeURIComponent(accountId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.linked && data.user) {
          setXUser(data.user)
          localStorage.setItem('slime_x_user', JSON.stringify(data.user))
        } else {
          // DB says unlinked (e.g. unlinked on another device) — clear local cache
          setXUser(null)
          localStorage.removeItem('slime_x_user')
          localStorage.removeItem('slime_x_session')
        }
      })
      .catch(() => {})
  }, [isConnected, accountId])

  // Fetch leaderboard
  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => setEntries(d.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // When the page regains visibility (e.g. user returns to HashPack after
  // completing X OAuth in an external browser), re-check if the wallet is
  // now linked.  This fires automatically — no manual "check now" button needed.
  useEffect(() => {
    if (!isConnected || !accountId) return
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      fetch(`/api/auth/check-wallet?wallet=${encodeURIComponent(accountId)}`)
        .then(r => r.json())
        .then(data => {
          if (data.linked && data.user) {
            setXUser(data.user)
            try { localStorage.setItem('slime_x_user', JSON.stringify(data.user)) } catch { /* ignore */ }
          }
        })
        .catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isConnected, accountId])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (pollStopRef.current) clearTimeout(pollStopRef.current)
    }
  }, [])

  // ESC closes modals
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedNft(null); setSelectedEntry(null) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const openWallet = async (entry: LeaderboardEntry) => {
    setSelectedEntry(entry)
    setWalletNFTs([])
    setSelectedNft(null)
    setLoadingWalletNFTs(true)
    try {
      // Get this wallet's SLIME NFT serials from Mirror Node
      const mirrorRes = await fetch(`${MIRROR_BASE}/accounts/${entry.wallet_address}/nfts?token.id=${SLIME_TOKEN}&limit=1000`)
      const mirrorData = await mirrorRes.json()
      const serials = new Set<number>((mirrorData.nfts || []).map((n: { serial_number: number }) => n.serial_number))
      if (serials.size === 0) { setLoadingWalletNFTs(false); return }

      // Fetch full collection data for images + traits
      const apiKey = import.meta.env.VITE_SENTX_API_KEY
      const gateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
      const rarityRes = await fetch(`/api/collection-rarity?apikey=${apiKey}&token=${SLIME_TOKEN}&limit=1000&page=1`)
      const rarityData = await rarityRes.json()
      if (!rarityData.success || !rarityData.nfts) { setLoadingWalletNFTs(false); return }

      type RawNFT = { serialId: number | string; name: string; image: string; correctedRank: number; correctedRarity: number; attributes: Array<{ trait_type: string; value: string }> }
      const allNfts = rarityData.nfts as RawNFT[]

      // Build trait counts for rarity pills
      const counts: Record<string, Record<string, number>> = {}
      for (const n of allNfts) {
        for (const attr of (n.attributes || [])) {
          if (!counts[attr.trait_type]) counts[attr.trait_type] = {}
          const key = attr.value.toLowerCase()
          counts[attr.trait_type][key] = (counts[attr.trait_type][key] || 0) + 1
        }
      }
      setFullTraitCounts(counts)

      const results: WalletNFT[] = allNfts
        .filter(n => serials.has(Number(n.serialId)))
        .map(n => {
          let imageUrl = n.image || ''
          if (imageUrl.includes('.mypinata.cloud/ipfs/')) {
            const cid = imageUrl.split('/ipfs/')[1] || ''
            imageUrl = gateway + cid
          } else if (imageUrl.startsWith('ipfs://')) {
            const raw = imageUrl.replace('ipfs://', gateway)
            const idx = raw.lastIndexOf('/')
            imageUrl = raw.substring(0, idx + 1) + raw.substring(idx + 1).replace(/#/g, '%23')
          }
          return { serial_number: Number(n.serialId), name: n.name || `SLIME #${n.serialId}`, imageUrl, correctedRank: n.correctedRank, correctedRarity: n.correctedRarity, attributes: n.attributes || [] }
        })
        .sort((a, b) => a.serial_number - b.serial_number)

      setWalletNFTs(results)
    } catch { /* show empty */ } finally { setLoadingWalletNFTs(false) }
  }

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (pollStopRef.current) { clearTimeout(pollStopRef.current); pollStopRef.current = null }
    setOauthPending(false)
  }

  const startPolling = (wallet: string) => {
    setOauthPending(true)
    pollRef.current = setInterval(() => {
      fetch(`/api/auth/check-wallet?wallet=${encodeURIComponent(wallet)}`)
        .then(r => r.json())
        .then(data => {
          if (data.linked && data.user) {
            setXUser(data.user)
            try { localStorage.setItem('slime_x_user', JSON.stringify(data.user)) } catch { /* ignore */ }
            stopPolling()
          }
        })
        .catch(() => {})
    }, 3000)
    // Auto-cancel after 5 minutes
    pollStopRef.current = setTimeout(stopPolling, 5 * 60 * 1000)
  }

  const handleConnectX = async () => {
    if (!isConnected || !accountId) return
    setConnecting(true)
    try {
      const res = await fetch(`/api/auth/x-login?wallet=${encodeURIComponent(accountId)}`)
      const { authUrl } = await res.json()

      if (isInAppBrowser()) {
        // Inside HashPack (WKWebView): open Twitter in the system browser.
        // This page stays alive, so we poll check-wallet every 3 s until linked.
        // This is more reliable than visibilitychange which WKWebViews often skip.
        window.open(authUrl, '_blank')
        startPolling(accountId)
      } else {
        // Normal desktop / mobile browser — navigate in place.
        window.location.href = authUrl
      }
    } catch { /* ignore */ } finally { setConnecting(false) }
  }

  const handleUnlink = async () => {
    if (!accountId) return
    setUnlinking(true)
    const token = localStorage.getItem('slime_x_session')
    try {
      await fetch('/api/auth/x-unlink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // Always send wallet address so cross-device sessions (no local JWT) can also unlink
        body: JSON.stringify({ walletAddress: accountId }),
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
                  {xUser.x_username && (
                    <img src={avatarSrc(xUser.x_username, xUser.x_avatar_url)} alt={xUser.x_username} className="w-12 h-12 rounded-full border-2 border-slime-green" />
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
            ) : isConnected && oauthPending ? (
              // Polling state — user authorized in external browser, waiting for DB to update
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slime-green flex-shrink-0" />
                  <div>
                    <p className="text-white font-bold text-sm">Waiting for authorization…</p>
                    <p className="text-gray-400 text-xs mt-0.5">Authorize on X in the browser, then return here — this updates automatically.</p>
                  </div>
                </div>
                <button
                  onClick={stopPolling}
                  className="text-xs text-gray-600 hover:text-gray-300 transition self-start"
                >
                  Cancel
                </button>
              </div>
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
                  {connecting ? 'Redirecting…' : (
                    <>
                      Connect&nbsp;
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black flex-shrink-0 inline" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                      </svg>
                      &nbsp;to Join
                    </>
                  )}
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
                  onClick={() => openWallet(entry)}
                  className={`bg-[#1a1a1a] border rounded-2xl p-4 flex items-center gap-4 transition cursor-pointer ${
                    entry.wallet_address === accountId ? 'border-slime-green/40 hover:border-slime-green/70' : 'border-gray-800 hover:border-gray-600'
                  }`}
                >
                  {/* Rank */}
                  <span className={`text-lg font-black w-8 text-center flex-shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <img src={avatarSrc(entry.x_username, entry.x_avatar_url)} alt={entry.x_username} className="w-10 h-10 rounded-full flex-shrink-0" />

                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">@{entry.x_username}</p>
                    <p className="text-gray-600 text-xs font-mono">{shortWallet(entry.wallet_address)}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    <span className="text-slime-green font-black text-base">{entry.nftCount} NFTs</span>
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* ── Wallet NFT Modal ── */}
      {selectedEntry && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }} onClick={() => setSelectedEntry(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEntry(null)} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] border border-gray-700 text-gray-400 hover:text-white transition">✕</button>
            <div className="p-6 border-b border-gray-800 flex items-center gap-4">
              <img src={avatarSrc(selectedEntry.x_username, selectedEntry.x_avatar_url)} alt={selectedEntry.x_username} className="w-12 h-12 rounded-full border-2 border-slime-green" />
              <div>
                <p className="text-white font-black text-lg">@{selectedEntry.x_username}</p>
                <p className="text-gray-500 text-xs font-mono">{selectedEntry.wallet_address}</p>
              </div>
              <span className="ml-auto text-slime-green font-black text-base">{selectedEntry.nftCount} NFTs</span>
            </div>
            <div className="p-6">
              {loadingWalletNFTs ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
                </div>
              ) : walletNFTs.length === 0 ? (
                <p className="text-center text-gray-500 py-16 text-sm">No SLIME NFTs found in this wallet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {walletNFTs.map(nft => (
                    <div key={nft.serial_number} onClick={() => setSelectedNft(nft)} className="bg-[#252525] rounded-xl overflow-hidden border border-gray-700 hover:border-slime-green transition cursor-pointer">
                      <div className="aspect-square p-2">
                        <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-contain" crossOrigin="anonymous" onError={e => { (e.target as HTMLImageElement).src = '/Assets/favicon.svg' }} />
                      </div>
                      <div className="px-2 pb-2">
                        <p className="text-white text-xs font-bold truncate">#{nft.serial_number}</p>
                        <p className={`text-xs font-bold ${rankColor(nft.correctedRank)}`}>Rank #{nft.correctedRank}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── NFT Detail Lightbox ── */}
      {selectedNft && (() => {
        const nft = selectedNft
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }} onClick={() => setSelectedNft(null)}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative z-10 bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedNft(null)} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] border border-gray-700 text-gray-400 hover:text-white transition">✕</button>
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/5 flex-shrink-0">
                  <div className="aspect-square bg-[#252525] rounded-t-2xl md:rounded-tl-2xl md:rounded-tr-none md:rounded-bl-none p-6 flex items-center justify-center">
                    <img src={nft.imageUrl || '/Assets/favicon.svg'} alt={nft.name} className="w-full h-full object-contain" crossOrigin="anonymous" onError={e => { (e.target as HTMLImageElement).src = '/Assets/favicon.svg' }} />
                  </div>
                </div>
                <div className="flex-1 p-6 space-y-5">
                  <div>
                    <h2 className="text-2xl font-black">{nft.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">Hedera NFT · SLIME Collection</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Details</h3>
                    <div className="bg-[#252525] rounded-xl divide-y divide-gray-800">
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-gray-400 text-sm">SLIME ID</span>
                        <span className="text-white font-bold">#{nft.serial_number}</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-gray-400 text-sm">Rarity Rank</span>
                        <span className={`font-bold ${rankColor(nft.correctedRank)}`}>#{nft.correctedRank} <span className="text-gray-500 font-normal">/ 1000</span></span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-gray-400 text-sm">Rarity Score</span>
                        <span className="text-white font-bold">{(nft.correctedRarity * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {nft.attributes.length > 0 && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-800">
                  <div className="flex justify-between items-center py-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Traits</h3>
                    <span className="text-xs text-gray-600">{nft.attributes.length} traits</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {nft.attributes.map(attr => {
                      const count = fullTraitCounts[attr.trait_type]?.[attr.value.toLowerCase()] ?? 0
                      const pct = count > 0 ? ((count / 1000) * 100).toFixed(1) : '0.0'
                      const pctNum = parseFloat(pct)
                      const pillColor = pctNum >= 20 ? 'bg-gray-500/25 text-gray-400' : pctNum >= 10 ? 'bg-blue-500/25 text-blue-400' : pctNum >= 5 ? 'bg-purple-500/25 text-purple-400' : pctNum >= 1 ? 'bg-orange-500/25 text-orange-400' : 'bg-red-500/25 text-red-400'
                      return (
                        <div key={attr.trait_type} className="bg-[#252525] rounded-xl px-4 py-3 border border-gray-800">
                          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{attr.trait_type}</p>
                          <p className="text-white font-bold text-sm mb-2">{attr.value.charAt(0).toUpperCase() + attr.value.slice(1)}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${pillColor}`}>{count.toLocaleString()}</span>
                            <span className="text-gray-500 text-xs">{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-5 text-center">
                    <a href={`https://sentx.io/nft-marketplace/slime/${nft.serial_number}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-600 hover:text-gray-400 transition">View on SentX ↗</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
