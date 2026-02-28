import { useState, useEffect } from 'react'
import { AccountAllowanceApproveTransaction, TokenId, NftId, AccountId } from '@hashgraph/sdk'
import { useWallet } from '../context/WalletContext'
import { decodeMetadata } from '../utils/nft'
import type { NFTMetadata } from '../utils/nft'
import Navigation from './Navigation'
import Footer from './Footer'

interface NFT {
  token_id: string
  serial_number: number
  metadata?: string
}

export default function SwapPage() {
  const { isConnected, accountId, connect, disconnect, dAppConnector } = useWallet()

  const [oldNFTs, setOldNFTs] = useState<NFT[]>([])
  const [nftMetadata, setNftMetadata] = useState<Map<number, NFTMetadata>>(new Map())
  const [selectedNFTs, setSelectedNFTs] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const OLD_TOKEN_ID = '0.0.8357917'
  const NEW_TOKEN_ID = '0.0.9474754'
  const TREASURY_ACCOUNT_ID = '0.0.10261541'

  // Auto-fetch old NFTs when wallet connects
  useEffect(() => {
    if (isConnected && accountId) {
      fetchOldNFTs(accountId)
    } else {
      setOldNFTs([])
      setSelectedNFTs(new Set())
    }
  }, [isConnected, accountId])

  const fetchOldNFTs = async (account: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${account}/nfts?token.id=${OLD_TOKEN_ID}`
      )

      if (!response.ok) throw new Error('Failed to fetch NFTs')

      const data = await response.json()
      const nfts = data.nfts || []
      setOldNFTs(nfts)

      const metadataMap = new Map<number, NFTMetadata>()
      await Promise.all(
        nfts.map(async (nft: NFT) => {
          if (nft.metadata) {
            const decoded = await decodeMetadata(nft.metadata)
            if (decoded) metadataMap.set(nft.serial_number, decoded)
          }
        })
      )
      setNftMetadata(metadataMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setError('')
    try {
      await connect()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    }
  }

  const toggleNFTSelection = (serialNumber: number) => {
    const newSelection = new Set(selectedNFTs)
    if (newSelection.has(serialNumber)) {
      newSelection.delete(serialNumber)
    } else {
      newSelection.add(serialNumber)
    }
    setSelectedNFTs(newSelection)
  }

  const selectAll = () => setSelectedNFTs(new Set(oldNFTs.map(nft => nft.serial_number)))
  const deselectAll = () => setSelectedNFTs(new Set())

  const swapNFTs = async () => {
    if (selectedNFTs.size === 0) {
      setError('Please select at least one NFT to swap')
      return
    }

    if (!dAppConnector) {
      setError('Wallet not connected')
      return
    }

    setSwapping(true)
    setError('')
    setSuccess('')

    try {
      const signer = dAppConnector.signers[0]
      if (!signer) throw new Error('No signer available')

      setSuccess('Approving NFT transfers...')

      for (const serialNumber of Array.from(selectedNFTs)) {
        const approveTransaction = new AccountAllowanceApproveTransaction()
          .approveTokenNftAllowance(
            new NftId(TokenId.fromString(OLD_TOKEN_ID), serialNumber),
            AccountId.fromString(accountId),
            AccountId.fromString(TREASURY_ACCOUNT_ID)
          )
        await signer.call(approveTransaction)
      }

      setSuccess('Swapping NFTs...')
      const response = await fetch('/api/swap-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAccountId: accountId,
          serialNumbers: Array.from(selectedNFTs),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Swap failed')
      }

      await response.json()
      setSuccess(`Successfully swapped ${selectedNFTs.size} NFT(s)!`)
      setSelectedNFTs(new Set())
      await fetchOldNFTs(accountId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed')
    } finally {
      setSwapping(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white flex flex-col">
      {/* Dot pattern background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0, 255, 64, 1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)'
      }}></div>

      <Navigation />

      <div className="relative max-w-7xl mx-auto px-8 py-16 flex-grow">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4">SLIME SWAP</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Swap SLIME {OLD_TOKEN_ID} for SLIME {NEW_TOKEN_ID}.
            <br />
            Same serial numbers, same traits, upgraded collection!
          </p>
        </div>

        {/* Wallet Connection */}
        {!isConnected ? (
          <div className="max-w-md mx-auto text-center">
            <button
              onClick={handleConnect}
              className="w-full bg-slime-green text-black py-4 rounded-md font-bold text-lg hover:bg-[#00cc33] transition"
            >
              CONNECT WALLET
            </button>
            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500 rounded p-3 text-red-500 text-sm">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Connected Wallet Info */}
            <div className="bg-black/20 border border-slime-green/30 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">CONNECTED WALLET</p>
                  <p className="text-lg font-mono text-slime-green">{accountId}</p>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="text-sm text-gray-400 hover:text-red-500 transition"
                >
                  DISCONNECT
                </button>
              </div>
            </div>

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slime-green"></div>
                <p className="text-gray-400 mt-4">Loading your NFTs...</p>
              </div>
            )}

            {!loading && oldNFTs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No old SLIME NFTs found in your wallet.</p>
                <p className="text-gray-500 text-sm mt-2">Token ID: {OLD_TOKEN_ID}</p>
              </div>
            )}

            {!loading && oldNFTs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-gray-400">
                    <span className="text-slime-green font-bold">{oldNFTs.length}</span> NFT{oldNFTs.length !== 1 ? 's' : ''} found
                    {selectedNFTs.size > 0 && (
                      <span className="ml-4">
                        <span className="text-slime-green font-bold">{selectedNFTs.size}</span> selected
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={selectAll} className="text-sm text-slime-green hover:underline">Select All</button>
                    <button onClick={deselectAll} className="text-sm text-gray-400 hover:underline">Deselect All</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {oldNFTs.map((nft) => {
                    const metadata = nftMetadata.get(nft.serial_number)
                    const isSelected = selectedNFTs.has(nft.serial_number)
                    return (
                      <div
                        key={nft.serial_number}
                        onClick={() => toggleNFTSelection(nft.serial_number)}
                        className={`bg-black/30 border-2 rounded-lg overflow-hidden cursor-pointer transition ${
                          isSelected ? 'border-slime-green' : 'border-gray-700/50 hover:border-slime-green/50'
                        }`}
                      >
                        <div className="aspect-square bg-black/50 relative">
                          {metadata?.image ? (
                            <img
                              src={metadata.image}
                              alt={metadata.name || `SLIME #${nft.serial_number}`}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-slime-green text-black rounded-full w-8 h-8 flex items-center justify-center font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-lg mb-1">{metadata?.name || `SLIME #${nft.serial_number}`}</h3>
                          <p className="text-sm text-gray-400">Serial #{nft.serial_number}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="sticky bottom-8 max-w-md mx-auto">
                  <button
                    onClick={swapNFTs}
                    disabled={selectedNFTs.size === 0 || swapping}
                    className="w-full bg-slime-green text-black py-4 rounded-md font-bold text-lg hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {swapping ? 'SWAPPING...' : `SWAP ${selectedNFTs.size} NFT${selectedNFTs.size !== 1 ? 'S' : ''}`}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 bg-red-500/10 border border-red-500 rounded p-4 text-red-500">{error}</div>
                )}
                {success && (
                  <div className="mt-4 bg-slime-green/10 border border-slime-green rounded p-4 text-slime-green">{success}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
