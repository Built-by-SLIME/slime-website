import { useState, useEffect } from 'react'
import { Transaction } from '@hashgraph/sdk'
import Navigation from './Navigation'
import { useWallet } from '../context/WalletContext'

interface MintEvent {
  mintCode: string
  mintEventName: string
  image: string
  availableCount: number
  mintedCount: number
  totalCount: number
  mintPrice: number
  isSoldOut: boolean
  description: string
  collectionName: string
  creatorName: string
}

interface MintResult {
  serialId: number
  name: string
  image: string
  transactionId: string
}

type MintStatus = 'idle' | 'preparing' | 'signing' | 'confirming' | 'success' | 'error'

const STATUS_LABELS: Record<string, string> = {
  preparing: 'Preparing transaction...',
  signing: 'Waiting for wallet approval...',
  confirming: 'Confirming on-chain...',
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').trim()
}

export default function MintPage() {
  const { isConnected, accountId, dAppConnector, connect } = useWallet()
  const [mintEvent, setMintEvent] = useState<MintEvent | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [status, setStatus] = useState<MintStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [mintResult, setMintResult] = useState<MintResult | null>(null)

  useEffect(() => {
    fetch('/api/mint-events')
      .then(r => r.json())
      .then(data => {
        const events: MintEvent[] = data.mintEvents || []
        const active = events.find(e => !e.isSoldOut) ?? events[0] ?? null
        setMintEvent(active)
      })
      .catch(() => {})
      .finally(() => setLoadingEvent(false))
  }, [])

  const handleConnect = async () => {
    try { await connect() } catch (err) { console.error(err) }
  }

  const handleMint = async () => {
    if (!mintEvent || !isConnected || !dAppConnector) return
    setStatus('preparing')
    setError(null)

    try {
      // Step 1: Get transaction bytes from SentX (via our proxy to keep API key server-side)
      const mintParams = new URLSearchParams({
        user_address: accountId,
        mintCode: mintEvent.mintCode,
        price: String(mintEvent.mintPrice),
      })
      const mintRes = await fetch(`/api/mint-nft?${mintParams}`)
      const mintData = await mintRes.json()

      if (!mintData.success) {
        throw new Error(mintData.apimessage || mintData.error || 'Failed to initiate mint')
      }

      // Step 2: Deserialize tx bytes and sign via the existing WalletConnect session
      setStatus('signing')
      const txBytes = Uint8Array.from(mintData.transBytes.data as number[])
      const transaction = Transaction.fromBytes(txBytes)

      const signers = dAppConnector.signers
      const signer = signers.find(s => s.getAccountId().toString() === accountId) ?? signers[0]
      if (!signer) throw new Error('Wallet signer not available — please reconnect')

      await transaction.executeWithSigner(signer)

      // Step 3: Tell SentX the tx was signed — it executes the actual NFT transfer
      setStatus('confirming')
      const resParams = new URLSearchParams({
        user_address: accountId,
        saleVerificationCode: mintData.saleVerificationCode,
      })
      const resRes = await fetch(`/api/mint-nft-res?${resParams}`)
      const resData = await resRes.json()

      if (!resData.success) {
        throw new Error(resData.error || 'Mint confirmation failed')
      }

      setMintResult({
        serialId: resData.serialId,
        name: resData.name,
        image: resData.image,
        transactionId: resData.transactionId,
      })
      setStatus('success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mint failed. Please try again.'
      setError(msg)
      setStatus('error')
    }
  }

  const resetMint = () => {
    setStatus('idle')
    setError(null)
    setMintResult(null)
  }

  const isMinting = status === 'preparing' || status === 'signing' || status === 'confirming'
  const progressPct = mintEvent
    ? Math.min(100, Math.round((mintEvent.mintedCount / mintEvent.totalCount) * 100))
    : 0

  return (
    <div className="min-h-screen bg-[#2a2a2a] flex flex-col">
      <Navigation />

      <main className="flex-1 px-4 py-10 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">MINT SLIME</h1>
          <p className="text-gray-500 text-sm mt-1">Mint directly on Hedera via SentX</p>
        </div>

        {/* Loading */}
        {loadingEvent && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
          </div>
        )}

        {/* No active mint */}
        {!loadingEvent && !mintEvent && (
          <div className="text-center py-32 text-gray-500">
            <p className="text-lg font-bold text-white mb-2">No active mint events</p>
            <p className="text-sm">Check back soon or visit SentX directly.</p>
          </div>
        )}

        {/* Mint card */}
        {!loadingEvent && mintEvent && (
          <div className="grid md:grid-cols-2 gap-8">

            {/* Left — collection info */}
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-[#1a1a1a] mb-5 border border-gray-800">
                <img
                  src={mintEvent.image}
                  alt={mintEvent.mintEventName}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-xl font-bold text-white mb-0.5">{mintEvent.mintEventName}</h2>
              <p className="text-slime-green font-mono text-xs mb-4">{mintEvent.creatorName}</p>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{mintEvent.mintedCount.toLocaleString()} minted</span>
                  <span>{mintEvent.availableCount.toLocaleString()} remaining</span>
                </div>
                <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="h-full bg-slime-green rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">{mintEvent.totalCount.toLocaleString()} total supply</p>
              </div>

              {/* Description */}
              {mintEvent.description && (
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-5">
                  {stripHtml(mintEvent.description)}
                </p>
              )}
            </div>

            {/* Right — mint panel */}
            <div className="flex flex-col gap-4">

              {/* Price */}
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Mint Price</p>
                <p className="text-5xl font-black text-white leading-none">
                  {mintEvent.mintPrice}
                  <span className="text-slime-green text-3xl ml-2">ℏ</span>
                </p>
                {mintEvent.isSoldOut && (
                  <span className="mt-3 inline-block text-xs font-bold text-red-400 bg-red-400/10 px-3 py-1 rounded-full">
                    SOLD OUT
                  </span>
                )}
              </div>

              {/* Mint action */}
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 flex-1 flex flex-col">
                {!isConnected ? (
                  <>
                    <p className="text-sm text-gray-400 mb-5">Connect your wallet to mint.</p>
                    <button
                      onClick={handleConnect}
                      className="w-full bg-slime-green text-black py-3.5 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition"
                    >
                      CONNECT WALLET
                    </button>
                  </>
                ) : mintEvent.isSoldOut ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="font-bold text-white">Sold Out</p>
                    <p className="text-sm mt-1">This mint event is sold out.</p>
                  </div>
                ) : (
                  <>
                    {/* Connected account */}
                    <div className="mb-5 pb-5 border-b border-gray-800">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Connected</p>
                      <p className="text-slime-green font-mono text-sm truncate">{accountId}</p>
                    </div>

                    {/* Error */}
                    {status === 'error' && error && (
                      <div className="mb-4 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                        <p className="text-red-400 text-xs leading-relaxed">{error}</p>
                      </div>
                    )}

                    {/* Status */}
                    {isMinting && (
                      <div className="mb-4 flex items-center gap-3 text-sm text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slime-green flex-shrink-0" />
                        {STATUS_LABELS[status]}
                      </div>
                    )}

                    <button
                      onClick={handleMint}
                      disabled={isMinting}
                      className="w-full bg-slime-green text-black py-3.5 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                    >
                      {isMinting ? 'MINTING...' : 'MINT NOW'}
                    </button>

                    <p className="text-xs text-gray-600 text-center mt-3">
                      Powered by SentX · Hedera Mainnet
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Success modal */}
      {status === 'success' && mintResult && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 max-w-sm w-full text-center">
            {mintResult.image && (
              <div className="w-28 h-28 rounded-2xl overflow-hidden mx-auto mb-5 border-2 border-slime-green">
                <img src={mintResult.image} alt={mintResult.name} className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-xs text-slime-green uppercase tracking-widest font-bold mb-2">Mint Successful</p>
            <h3 className="text-xl font-black text-white mb-1">{mintResult.name}</h3>
            <p className="text-gray-500 text-sm mb-5">Serial #{mintResult.serialId}</p>
            {mintResult.transactionId && (
              <a
                href={`https://hashscan.io/mainnet/transaction/${mintResult.transactionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-slime-green transition underline block mb-6"
              >
                View on HashScan
              </a>
            )}
            <button
              onClick={resetMint}
              className="w-full bg-slime-green text-black py-3 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
