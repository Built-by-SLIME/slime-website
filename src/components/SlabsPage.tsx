import { useState, useEffect } from 'react'
import { TransferTransaction, TokenAssociateTransaction, TokenId, AccountId, Hbar } from '@hashgraph/sdk'
import { useWallet } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

const OPERATOR_WALLET  = '0.0.9348822'
const SLIME_TOKEN_ID   = '0.0.9474754'
const FEE_HBAR_PER_SLAB = 0.05  // displayed to user
const FEE_TINYBARS      = 5_000_000  // exact on-chain

interface SlabNFT {
  serial_number: number
  name: string
  imageUrl: string
}

export default function SlabsPage() {
  const { isConnected, accountId, slimeNFTs, dAppConnector, connect } = useWallet()

  const [nfts, setNfts] = useState<SlabNFT[]>([])
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [claimedSerials, setClaimedSerials] = useState<Set<number>>(new Set())
  const [flippedSerials, setFlippedSerials] = useState<Set<number>>(new Set())
  const [claimingSerials, setClaimingSerials] = useState<Set<number>>(new Set())
  const [isAssociated, setIsAssociated] = useState<boolean | null>(null) // null = checking
  const [associating, setAssociating] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Load NFT images + claimed serials + association status whenever wallet connects
  useEffect(() => {
    if (!isConnected || !accountId || slimeNFTs.length === 0) {
      setNfts([])
      setClaimedSerials(new Set())
      setIsAssociated(null)
      return
    }
    loadData()
  }, [isConnected, accountId, slimeNFTs]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    setLoadingNFTs(true)
    setErrorMsg('')
    try {
      const apiKey  = import.meta.env.VITE_SENTX_API_KEY
      const tokenId = import.meta.env.VITE_SLIME_TOKEN_ID || SLIME_TOKEN_ID
      const gateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
      const userSerials = new Set(slimeNFTs.map(n => Number(n.serial_number)))

      const [collectionRes, claimedRes, assocRes] = await Promise.all([
        fetch(`/api/collection-rarity?apikey=${apiKey}&token=${tokenId}&limit=1000&page=1`),
        fetch(`/api/slabs/check?wallet=${encodeURIComponent(accountId)}`),
        fetch(`https://mainnet.mirrornode.hedera.com/api/v1/accounts/${encodeURIComponent(accountId)}/tokens?token.id=0.0.10480544`),
      ])

      if (collectionRes.ok) {
        const data = await collectionRes.json()
        if (data.success && data.nfts) {
          const filtered: SlabNFT[] = data.nfts
            .filter((n: { serialId: number }) => userSerials.has(Number(n.serialId)))
            .map((n: { serialId: number; name: string; image: string }) => {
              let imageUrl = n.image || ''
              if (imageUrl.startsWith('ipfs://')) {
                const raw = imageUrl.replace('ipfs://', gateway)
                const idx = raw.lastIndexOf('/')
                imageUrl = raw.substring(0, idx + 1) + raw.substring(idx + 1).replace(/#/g, '%23')
              }
              return {
                serial_number: Number(n.serialId),
                name: n.name || `SLIME #${n.serialId}`,
                imageUrl,
              }
            })
            .sort((a: SlabNFT, b: SlabNFT) => a.serial_number - b.serial_number)
          setNfts(filtered)
        }
      }

      if (claimedRes.ok) {
        const { claimedSerials: claimed } = await claimedRes.json()
        setClaimedSerials(new Set(claimed as number[]))
      }

      if (assocRes.ok) {
        const assocData = await assocRes.json()
        setIsAssociated((assocData.tokens || []).some((t: { token_id: string }) => t.token_id === '0.0.10480544'))
      } else {
        setIsAssociated(false)
      }
    } catch (err) {
      setErrorMsg('Failed to load your NFTs. Please refresh and try again.')
    } finally {
      setLoadingNFTs(false)
    }
  }

  const getSigner = () => {
    if (!dAppConnector) return null
    return (
      dAppConnector.signers.find(s => s.getAccountId().toString() === accountId) ??
      dAppConnector.signers[0] ??
      null
    )
  }

  async function handleAssociate() {
    setErrorMsg('')
    setAssociating(true)
    try {
      const signer = getSigner()
      if (!signer) throw new Error('Wallet signer not available - please reconnect your wallet.')
      const tx = new TokenAssociateTransaction()
        .setNodeAccountIds([new AccountId(3)])
        .setAccountId(AccountId.fromString(accountId))
        .setTokenIds([TokenId.fromString('0.0.10480544')])
      await tx.freezeWithSigner(signer)
      await tx.executeWithSigner(signer)
      setIsAssociated(true)
      setStatusMsg('✅ Token associated! You can now claim your Slabs.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Association failed'
      setErrorMsg(msg)
    } finally {
      setAssociating(false)
    }
  }

  async function handleClaim(serials: number[]) {
    if (!isConnected || !accountId) return
    if (!isAssociated) {
      setErrorMsg('Please associate the SLIME Slab token before claiming.')
      return
    }
    const claimable = serials.filter(s => !claimedSerials.has(s) && !claimingSerials.has(s))
    if (claimable.length === 0) return

    setErrorMsg('')
    setStatusMsg('')
    setClaimingSerials(prev => new Set([...prev, ...claimable]))

    try {
      // Step 1: collect HBAR payment from user
      setStatusMsg(`Approve payment of ${(claimable.length * FEE_HBAR_PER_SLAB).toFixed(2)} HBAR in your wallet…`)
      const signer = getSigner()
      if (!signer) throw new Error('Wallet signer not available - please reconnect your wallet.')

      const totalTinybars = claimable.length * FEE_TINYBARS
      const tx = new TransferTransaction()
        .setNodeAccountIds([new AccountId(3)])
        .addHbarTransfer(accountId, Hbar.fromTinybars(-totalTinybars))
        .addHbarTransfer(OPERATOR_WALLET, Hbar.fromTinybars(totalTinybars))
        .setTransactionMemo('SLIME Slab Claim')

      await tx.freezeWithSigner(signer)
      const response = await tx.executeWithSigner(signer)
      const paymentTxId = response.transactionId?.toString()
      if (!paymentTxId) throw new Error('Could not retrieve transaction ID from wallet response.')

      // Step 2: backend verifies payment + transfers slabs
      // Give Mirror Node a moment to index before the backend starts polling
      setStatusMsg(`Payment submitted! Verifying and claiming your slab${claimable.length > 1 ? 's' : ''}…`)
      await new Promise(r => setTimeout(r, 4000))
      const claimRes = await fetch('/api/slabs/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: accountId, serials: claimable, paymentTxId }),
      })
      const claimData = await claimRes.json()
      if (!claimRes.ok) throw new Error(claimData.error || 'Claim failed')

      // Step 3: update UI — flip cards and mark as claimed
      const claimed: number[] = claimData.claimed
      setClaimedSerials(prev => new Set([...prev, ...claimed]))
      // Small delay before flip so the user sees the status msg
      setTimeout(() => {
        setFlippedSerials(prev => new Set([...prev, ...claimed]))
        setStatusMsg(`🎉 ${claimed.length} Slab${claimed.length > 1 ? 's' : ''} claimed successfully!`)
      }, 400)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred'
      setErrorMsg(msg)
      setStatusMsg('')
    } finally {
      setClaimingSerials(prev => {
        const next = new Set(prev)
        serials.forEach(s => next.delete(s))
        return next
      })
    }
  }

  const claimableNFTs = nfts.filter(n => !claimedSerials.has(n.serial_number))
  const claimableCount = claimableNFTs.length
  const totalFee = (claimableCount * FEE_HBAR_PER_SLAB).toFixed(2)

  const handleConnect = async () => {
    try { await connect() } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white flex flex-col">
      <Navigation />

      <main className="py-16 px-4 md:px-8 flex-grow" style={{ paddingBottom: 'max(80px, env(safe-area-inset-bottom))' }}>
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <span className="text-slime-green text-xs font-bold uppercase tracking-widest">Community</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mt-2">CLAIM SLABS</h1>
            <p className="text-gray-400 text-base mt-3 leading-relaxed">
              You held SLIME. Now claim your Slab. Each SLIME NFT you hold entitles you to one matching SLIME Slab - same serial, 1:1.
            </p>
          </div>

          {/* Not connected */}
          {!isConnected && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="text-5xl">🫟</div>
              <p className="text-gray-400 text-center max-w-sm">Connect your wallet to see your claimable slabs.</p>
              <button
                onClick={handleConnect}
                className="bg-slime-green text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition"
              >
                CONNECT WALLET
              </button>
            </div>
          )}

          {/* Connected — loading */}
          {isConnected && loadingNFTs && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
              <p className="text-gray-400 text-sm">Loading your SLIME NFTs…</p>
            </div>
          )}

          {/* Connected — no NFTs */}
          {isConnected && !loadingNFTs && nfts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="text-5xl">😔</div>
              <p className="text-gray-400 text-center max-w-sm">
                This wallet doesn't hold any SLIME NFTs (0.0.9474754). You need a SLIME NFT to claim a Slab.
              </p>
            </div>
          )}

          {/* Connected — has NFTs */}
          {isConnected && !loadingNFTs && nfts.length > 0 && (
            <>
              {/* Stats + Claim All bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-[#1a1a1a] border border-gray-800 rounded-xl px-5 py-4">
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-slime-green font-black text-xl">{claimableCount}</p>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Claimable</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-xl">{claimedSerials.size}</p>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Claimed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-xl">{nfts.length}</p>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Total Held</p>
                  </div>
                </div>
                {claimableCount > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={() => handleClaim(claimableNFTs.map(n => n.serial_number))}
                      disabled={claimingSerials.size > 0 || isAssociated === false}
                      className="bg-slime-green text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {claimingSerials.size > 0 ? 'CLAIMING…' : `CLAIM ALL (${claimableCount})`}
                    </button>
                    <p className="text-gray-500 text-xs">Total fee: {totalFee} HBAR</p>
                  </div>
                )}
              </div>

              {/* Status messages */}
              {statusMsg && (
                <div className="mb-4 bg-[#1a2a1a] border border-slime-green/40 rounded-xl px-4 py-3 text-slime-green text-sm text-center">
                  {statusMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mb-4 bg-[#2a1a1a] border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
                  {errorMsg}
                </div>
              )}

              {/* Association status panel */}
              {isAssociated === null && (
                <div className="mb-6 bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-3 text-gray-400 text-xs text-center">
                  Checking token association…
                </div>
              )}
              {isAssociated === false && (
                <div className="mb-6 bg-[#1f1700] border border-yellow-700/60 rounded-xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-yellow-400 font-bold text-sm">Token Association Required</p>
                    <p className="text-yellow-600 text-xs mt-0.5">
                      Your wallet must be associated with <span className="font-mono">0.0.10480544</span> before you can receive Slabs.
                    </p>
                  </div>
                  <button
                    onClick={handleAssociate}
                    disabled={associating}
                    className="flex-shrink-0 bg-yellow-500 text-black px-5 py-2 rounded-lg font-bold text-xs hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {associating ? 'ASSOCIATING…' : 'ASSOCIATE TOKEN'}
                  </button>
                </div>
              )}

              {/* NFT Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {nfts.map(nft => {
                  const isClaimed   = claimedSerials.has(nft.serial_number)
                  const isClaiming  = claimingSerials.has(nft.serial_number)
                  const isFlipped   = flippedSerials.has(nft.serial_number)
                  return (
                    <div key={nft.serial_number} style={{ perspective: '800px' }}>
                      <div
                        style={{
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.7s ease',
                          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          position: 'relative',
                        }}
                      >
                        {/* Front — SLIME NFT */}
                        <div
                          className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-700"
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <div className="aspect-square bg-[#252525] p-2">
                            <img
                              src={nft.imageUrl || '/Assets/SPLAT.png'}
                              alt={nft.name}
                              className="w-full h-full object-contain"
                              onError={e => {
                                const img = e.target as HTMLImageElement
                                if (!img.dataset.retried && nft.imageUrl) {
                                  img.dataset.retried = 'true'
                                  setTimeout(() => { img.src = `${nft.imageUrl.split('?')[0]}?r=${Date.now()}` }, 1500)
                                } else {
                                  img.src = '/Assets/SPLAT.png'
                                }
                              }}
                            />
                          </div>
                          <div className="p-2.5">
                            <p className="text-gray-400 text-xs font-mono mb-2">#{nft.serial_number}</p>
                            {isClaiming ? (
                              <div className="flex items-center justify-center gap-1.5 py-1.5">
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b border-slime-green" />
                                <span className="text-slime-green text-xs">Claiming…</span>
                              </div>
                            ) : isClaimed ? (
                              <div className="text-center text-gray-500 text-xs py-1.5 font-bold">Claimed ✓</div>
                            ) : (
                              <button
                                onClick={() => handleClaim([nft.serial_number])}
                                disabled={claimingSerials.size > 0 || isAssociated === false}
                                className="w-full bg-slime-green text-black py-1.5 rounded-lg font-bold text-xs hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                CLAIM SLAB
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Back — Claimed state */}
                        <div
                          className="absolute inset-0 bg-[#0d1f0d] border-2 border-slime-green rounded-xl flex flex-col items-center justify-center gap-2"
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                          <div className="text-3xl">🫟</div>
                          <p className="text-slime-green font-black text-sm">SLAB CLAIMED</p>
                          <p className="text-gray-400 text-xs font-mono">#{nft.serial_number}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
