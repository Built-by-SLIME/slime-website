import { useState, useEffect } from 'react'
import { AccountAllowanceApproveTransaction, TokenId, NftId, AccountId } from '@hashgraph/sdk'
import { useWallet } from '../context/WalletContext'
import { decodeMetadata } from '../utils/nft'
import type { NFTMetadata } from '../utils/nft'
import Navigation from './Navigation'
import Footer from './Footer'

const MIRROR = 'https://mainnet-public.mirrornode.hedera.com'
const OPERATOR = '0.0.9348822'

interface SwapProgram {
  id: string
  name: string
  description: string | null
  swap_type: 'fungible' | 'nft'
  from_token_id: string
  to_token_id: string
  treasury_account_id: string
  rate_from: number
  rate_to: number
  status: string
}

interface TokenInfo {
  symbol: string
  decimals: number
}

interface NFT {
  token_id: string
  serial_number: number
  metadata?: string
}

type SwapStatus = 'idle' | 'approving' | 'executing' | 'success' | 'error'

export default function SwapPage() {
  const { isConnected, accountId, dAppConnector, connect } = useWallet()

  const [programs, setPrograms] = useState<SwapProgram[]>([])
  const [tokenInfo, setTokenInfo] = useState<Map<string, TokenInfo>>(new Map())
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)

  // Fungible swap state
  const [inputAmount, setInputAmount] = useState('')

  // NFT swap state
  const [userNFTs, setUserNFTs] = useState<NFT[]>([])
  const [nftMetadata, setNftMetadata] = useState<Map<number, NFTMetadata>>(new Map())
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [selectedSerials, setSelectedSerials] = useState<Set<number>>(new Set())

  // Swap execution state
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('idle')
  const [statusMsg, setStatusMsg] = useState('')

  // Fetch programs + token info on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/swap-programs')
        const data = await res.json()
        const activePrograms: SwapProgram[] = (data.programs || []).filter(
          (p: SwapProgram) => p.status === 'active'
        )
        setPrograms(activePrograms)

        // Fetch token info for all unique token IDs
        const tokenIds = new Set<string>()
        activePrograms.forEach(p => {
          tokenIds.add(p.from_token_id)
          tokenIds.add(p.to_token_id)
        })
        const infoMap = new Map<string, TokenInfo>()
        await Promise.all(
          Array.from(tokenIds).map(async id => {
            try {
              const r = await fetch(`${MIRROR}/api/v1/tokens/${id}`)
              if (r.ok) {
                const t = await r.json()
                infoMap.set(id, { symbol: t.symbol || id, decimals: Number(t.decimals) || 0 })
              }
            } catch { /* use token ID as fallback */ }
          })
        )
        setTokenInfo(infoMap)
      } catch {
        // silently fail — empty programs list shown
      } finally {
        setLoadingPrograms(false)
      }
    }
    load()
  }, [])

  // When active program changes, reset state and load NFTs if needed
  useEffect(() => {
    setInputAmount('')
    setSelectedSerials(new Set())
    setUserNFTs([])
    setNftMetadata(new Map())
    setSwapStatus('idle')
    setStatusMsg('')

    const program = programs.find(p => p.id === activeId)
    if (program && program.swap_type === 'nft' && isConnected && accountId) {
      loadNFTs(program.from_token_id)
    }
  }, [activeId])

  const loadNFTs = async (tokenId: string) => {
    setLoadingNFTs(true)
    try {
      const nfts: NFT[] = []
      let path: string | null = `/api/v1/accounts/${accountId}/nfts?token.id=${tokenId}&limit=100`
      while (path) {
        const r: Response = await fetch(`${MIRROR}${path}`)
        if (!r.ok) break
        const d: { nfts: NFT[]; links?: { next?: string } } = await r.json()
        nfts.push(...(d.nfts || []))
        path = d.links?.next || null
      }
      setUserNFTs(nfts)

      const metaMap = new Map<number, NFTMetadata>()
      await Promise.all(
        nfts.map(async nft => {
          if (nft.metadata) {
            const decoded = await decodeMetadata(nft.metadata)
            if (decoded) metaMap.set(nft.serial_number, decoded)
          }
        })
      )
      setNftMetadata(metaMap)
    } catch { /* show empty grid */ } finally {
      setLoadingNFTs(false)
    }
  }

  const toggleSerial = (serial: number) => {
    setSelectedSerials(prev => {
      const next = new Set(prev)
      next.has(serial) ? next.delete(serial) : next.add(serial)
      return next
    })
  }

  const toRaw = (human: string, decimals: number): number => {
    const n = parseFloat(human)
    if (isNaN(n) || n <= 0) return 0
    return Math.round(n * Math.pow(10, decimals))
  }

  const toHuman = (raw: number, decimals: number): string =>
    decimals === 0 ? String(raw) : (raw / Math.pow(10, decimals)).toLocaleString()

  const handleSwap = async () => {
    const program = programs.find(p => p.id === activeId)
    if (!program || !dAppConnector) return

    const signer = dAppConnector.signers.find(s => s.getAccountId().toString() === accountId)
      ?? dAppConnector.signers[0]
    if (!signer) {
      setSwapStatus('error')
      setStatusMsg('Wallet signer not available — please reconnect')
      return
    }

    setSwapStatus('approving')
    setStatusMsg('Approving token allowance in your wallet...')

    try {
      if (program.swap_type === 'fungible') {
        // from_token_id = what the user gives
        const decimals = tokenInfo.get(program.from_token_id)?.decimals ?? 0
        const rawAmount = toRaw(inputAmount, decimals)
        if (!rawAmount) {
          setSwapStatus('error')
          setStatusMsg('Enter a valid amount')
          return
        }

        const approveTx = new AccountAllowanceApproveTransaction().approveTokenAllowance(
          TokenId.fromString(program.from_token_id),
          AccountId.fromString(accountId),
          AccountId.fromString(OPERATOR),
          rawAmount
        )
        await signer.call(approveTx)

        setSwapStatus('executing')
        setStatusMsg('Executing swap...')

        const res = await fetch(`/api/swap-execute?id=${program.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAccountId: accountId, amount: rawAmount }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Swap failed')

        setSwapStatus('success')
        setStatusMsg(data.message || 'Swap successful!')
        setInputAmount('')

      } else {
        // NFT swap
        if (selectedSerials.size === 0) {
          setSwapStatus('error')
          setStatusMsg('Select at least one NFT to swap')
          return
        }

        const serials = Array.from(selectedSerials)
        const approveTx = new AccountAllowanceApproveTransaction()
        serials.forEach(serial =>
          approveTx.approveTokenNftAllowance(
            new NftId(TokenId.fromString(program.from_token_id), serial),
            AccountId.fromString(accountId),
            AccountId.fromString(OPERATOR)
          )
        )
        await signer.call(approveTx)

        setSwapStatus('executing')
        setStatusMsg('Executing swap...')

        const res = await fetch(`/api/swap-execute?id=${program.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userAccountId: accountId, serialNumbers: serials }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Swap failed')

        setSwapStatus('success')
        setStatusMsg(data.message || 'Swap successful!')
        setSelectedSerials(new Set())
        await loadNFTs(program.from_token_id)
      }
    } catch (err) {
      setSwapStatus('error')
      setStatusMsg(err instanceof Error ? err.message : 'Swap failed')
    }
  }

  const rateLabel = (p: SwapProgram) => {
    // from_token = what user gives, to_token = what user receives
    const give = tokenInfo.get(p.from_token_id)?.symbol ?? p.from_token_id
    const receive = tokenInfo.get(p.to_token_id)?.symbol ?? p.to_token_id
    return `${p.rate_from} ${give} → ${p.rate_to} ${receive}`
  }

  const expectedOut = (p: SwapProgram): string => {
    // user enters amount of from_token (gives), receives to_token
    const giveDec = tokenInfo.get(p.from_token_id)?.decimals ?? 0
    const receiveDec = tokenInfo.get(p.to_token_id)?.decimals ?? 0
    const receiveSymbol = tokenInfo.get(p.to_token_id)?.symbol ?? p.to_token_id
    const raw = toRaw(inputAmount, giveDec)
    if (!raw || !p.rate_from) return '—'
    const outRaw = Math.floor(raw * p.rate_to / p.rate_from)
    return `${toHuman(outRaw, receiveDec)} ${receiveSymbol}`
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a] flex flex-col">
      <Navigation />

      <main className="flex-1 px-4 py-20 max-w-4xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">SWAP</h1>
          <p className="text-gray-500 text-sm mt-1">Active swap programs powered by slime.tools</p>
        </div>

        {/* Not connected */}
        {!isConnected && (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 text-center">
            <p className="text-gray-400 text-sm mb-5">Connect your wallet to use swap programs.</p>
            <button
              onClick={() => connect().catch(() => {})}
              className="bg-slime-green text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition"
            >
              CONNECT WALLET
            </button>
          </div>
        )}

        {/* Connected */}
        {isConnected && (
          <>
            {loadingPrograms && (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
              </div>
            )}

            {!loadingPrograms && programs.length === 0 && (
              <div className="text-center py-24 text-gray-500">
                <p className="font-bold text-white mb-1">No active swap programs</p>
                <p className="text-sm">Check back soon.</p>
              </div>
            )}

            {!loadingPrograms && programs.length > 0 && (
              <div className="flex flex-col gap-4">
                {programs.map(p => {
                  const isActive = activeId === p.id
                  // from_token = what user gives, to_token = what user receives
                  const giveSymbol = tokenInfo.get(p.from_token_id)?.symbol ?? p.from_token_id

                  return (
                    <div key={p.id} className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
                      {/* Program header row */}
                      <div className="flex items-center justify-between p-6">
                        <div>
                          <p className="text-white font-bold text-lg">{p.name}</p>
                          {p.description && (
                            <p className="text-gray-500 text-xs mt-0.5">{p.description}</p>
                          )}
                          <p className="text-slime-green font-mono text-xs mt-1">{rateLabel(p)}</p>
                        </div>
                        <button
                          onClick={() => setActiveId(isActive ? null : p.id)}
                          className="bg-slime-green text-black px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition flex-shrink-0 ml-4"
                        >
                          {isActive ? 'CLOSE' : 'SWAP'}
                        </button>
                      </div>

                      {/* Expanded swap UI */}
                      {isActive && (
                        <div className="border-t border-gray-800 p-6">
                          {/* Status banner */}
                          {(swapStatus === 'approving' || swapStatus === 'executing') && (
                            <div className="flex items-center gap-3 mb-5 text-sm text-gray-400">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slime-green flex-shrink-0" />
                              {statusMsg}
                            </div>
                          )}
                          {swapStatus === 'success' && (
                            <div className="mb-5 bg-slime-green/10 border border-slime-green/30 rounded-xl px-4 py-3">
                              <p className="text-slime-green text-sm">{statusMsg}</p>
                            </div>
                          )}
                          {swapStatus === 'error' && (
                            <div className="mb-5 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                              <p className="text-red-400 text-sm">{statusMsg}</p>
                            </div>
                          )}

                          {/* Fungible input */}
                          {p.swap_type === 'fungible' && (
                            <div className="flex flex-col gap-4">
                              <div>
                                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">
                                  Amount ({giveSymbol})
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={inputAmount}
                                  onChange={e => setInputAmount(e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-slime-green transition"
                                />
                              </div>
                              {inputAmount && parseFloat(inputAmount) > 0 && (
                                <p className="text-xs text-gray-500">
                                  You receive:{' '}
                                  <span className="text-slime-green font-mono">{expectedOut(p)}</span>
                                </p>
                              )}
                              <button
                                onClick={handleSwap}
                                disabled={
                                  swapStatus === 'approving' ||
                                  swapStatus === 'executing' ||
                                  !inputAmount ||
                                  parseFloat(inputAmount) <= 0
                                }
                                className="w-full bg-slime-green text-black py-3.5 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {swapStatus === 'approving' || swapStatus === 'executing'
                                  ? 'SWAPPING...'
                                  : 'APPROVE & SWAP'}
                              </button>
                            </div>
                          )}

                          {/* NFT selection grid */}
                          {p.swap_type === 'nft' && (
                            <div>
                              {loadingNFTs && (
                                <div className="flex items-center justify-center h-32">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slime-green" />
                                </div>
                              )}

                              {!loadingNFTs && userNFTs.length === 0 && (
                                <p className="text-gray-500 text-sm py-6 text-center">
                                  No {giveSymbol} NFTs found in your wallet.
                                </p>
                              )}

                              {!loadingNFTs && userNFTs.length > 0 && (
                                <div className="flex flex-col gap-4">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                      {selectedSerials.size > 0
                                        ? `${selectedSerials.size} selected`
                                        : `${userNFTs.length} NFT${userNFTs.length !== 1 ? 's' : ''} available`}
                                    </p>
                                    <div className="flex gap-3 text-xs">
                                      <button
                                        onClick={() => setSelectedSerials(new Set(userNFTs.map(n => n.serial_number)))}
                                        className="text-slime-green hover:underline"
                                      >
                                        Select all
                                      </button>
                                      <button
                                        onClick={() => setSelectedSerials(new Set())}
                                        className="text-gray-500 hover:underline"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {userNFTs.map(nft => {
                                      const meta = nftMetadata.get(nft.serial_number)
                                      const selected = selectedSerials.has(nft.serial_number)
                                      return (
                                        <div
                                          key={nft.serial_number}
                                          onClick={() => toggleSerial(nft.serial_number)}
                                          className={`rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                                            selected
                                              ? 'border-slime-green'
                                              : 'border-gray-700 hover:border-gray-600'
                                          }`}
                                        >
                                          <div className="aspect-square bg-black/50 relative">
                                            {meta?.image ? (
                                              <img
                                                src={meta.image}
                                                alt={meta.name || `#${nft.serial_number}`}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">
                                                No image
                                              </div>
                                            )}
                                            {selected && (
                                              <div className="absolute top-1.5 right-1.5 bg-slime-green text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                ✓
                                              </div>
                                            )}
                                          </div>
                                          <div className="p-2 bg-black/40">
                                            <p className="text-xs font-bold text-white truncate">
                                              {meta?.name || `#${nft.serial_number}`}
                                            </p>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>

                                  <button
                                    onClick={handleSwap}
                                    disabled={
                                      selectedSerials.size === 0 ||
                                      swapStatus === 'approving' ||
                                      swapStatus === 'executing'
                                    }
                                    className="w-full bg-slime-green text-black py-3.5 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {swapStatus === 'approving' || swapStatus === 'executing'
                                      ? 'SWAPPING...'
                                      : `APPROVE & SWAP${selectedSerials.size > 0 ? ` (${selectedSerials.size})` : ''}`}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
