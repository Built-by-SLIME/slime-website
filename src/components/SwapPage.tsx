import { useState, useEffect, useRef } from 'react'
import { DAppConnector, HederaSessionEvent, HederaJsonRpcMethod, HederaChainId } from '@hashgraph/hedera-wallet-connect'
import { LedgerId } from '@hiero-ledger/sdk'
import Navigation from './Navigation'
import Footer from './Footer'

interface NFT {
  token_id: string
  serial_number: number
  metadata?: string
}

interface NFTMetadata {
  name?: string
  image?: string
  description?: string
  attributes?: Array<{ trait_type: string; value: string }>
}

export default function SwapPage() {
  const [walletConnected, setWalletConnected] = useState(false)
  const [accountId, setAccountId] = useState<string>('')
  const [oldNFTs, setOldNFTs] = useState<NFT[]>([])
  const [nftMetadata, setNftMetadata] = useState<Map<number, NFTMetadata>>(new Map())
  const [selectedNFTs, setSelectedNFTs] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const OLD_TOKEN_ID = import.meta.env.VITE_OLD_TOKEN_ID || '0.0.8357917'
  const NEW_TOKEN_ID = import.meta.env.VITE_NEW_TOKEN_ID || '0.0.9474754'

  const dAppConnectorRef = useRef<DAppConnector | null>(null)

  // Decode base64 metadata
  const decodeMetadata = (base64: string): NFTMetadata | null => {
    try {
      const decoded = atob(base64)
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }

  // Fetch user's old SLIME NFTs from Hedera Mirror Node
  const fetchOldNFTs = async (accountId: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${accountId}/nfts?token.id=${OLD_TOKEN_ID}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch NFTs')
      }

      const data = await response.json()
      const nfts = data.nfts || []
      setOldNFTs(nfts)

      // Decode metadata for each NFT
      const metadataMap = new Map<number, NFTMetadata>()
      nfts.forEach((nft: NFT) => {
        if (nft.metadata) {
          const decoded = decodeMetadata(nft.metadata)
          if (decoded) {
            metadataMap.set(nft.serial_number, decoded)
          }
        }
      })
      setNftMetadata(metadataMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs')
    } finally {
      setLoading(false)
    }
  }

  // Initialize DAppConnector on component mount
  useEffect(() => {
    const initDAppConnector = async () => {
      try {
        const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

        if (!projectId) {
          throw new Error('WalletConnect Project ID is not configured. Please add VITE_WALLETCONNECT_PROJECT_ID to Vercel environment variables.')
        }

        const metadata = {
          name: 'SLIME NFT Swap',
          description: 'Swap your old SLIME NFTs for new ones',
          url: window.location.origin,
          icons: ['https://builtbyslime.org/favicon.ico']
        }

        // Initialize DAppConnector
        const dAppConnector = new DAppConnector(
          metadata,
          LedgerId.MAINNET,
          projectId,
          Object.values(HederaJsonRpcMethod),
          [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
          [HederaChainId.Mainnet]
        )

        await dAppConnector.init({ logger: 'error' })
        dAppConnectorRef.current = dAppConnector

        console.log('DAppConnector initialized')

        // Listen for session events
        if (typeof dAppConnector.onSessionEvent === 'function') {
          dAppConnector.onSessionEvent((event) => {
            console.log('Session event:', event)

            if (event.name === HederaSessionEvent.AccountsChanged) {
              const accounts = event.data as string[]
              if (accounts && accounts.length > 0) {
                const account = accounts[0].split(':').pop() || ''
                setAccountId(account)
                setWalletConnected(true)
                fetchOldNFTs(account)
              }
            }
          })
        }
      } catch (err) {
        console.error('Failed to initialize DAppConnector:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize wallet connection')
      }
    }

    initDAppConnector()

    return () => {
      // Cleanup on unmount
      if (dAppConnectorRef.current) {
        try {
          dAppConnectorRef.current.disconnectAll()
        } catch (err) {
          console.error('Error disconnecting:', err)
        }
      }
    }
  }, [])

  // Connect wallet using DAppConnector
  const connectWallet = async () => {
    setError('')

    try {
      if (!dAppConnectorRef.current) {
        throw new Error('DAppConnector not initialized')
      }

      // This will show the modal with QR code for mobile wallets
      await dAppConnectorRef.current.openModal()

      // Get connected sessions
      const sessions = dAppConnectorRef.current.walletConnectClient?.session.getAll()
      if (sessions && sessions.length > 0) {
        const session = sessions[0]
        const hederaAccounts = session.namespaces?.hedera?.accounts || []

        if (hederaAccounts.length > 0) {
          // Extract account ID from format: hedera:mainnet:0.0.xxxxx
          const account = hederaAccounts[0].split(':').pop() || ''
          setAccountId(account)
          setWalletConnected(true)
          fetchOldNFTs(account)
        }
      }
    } catch (err) {
      console.error('Connect wallet error:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    }
  }

  // Toggle NFT selection
  const toggleNFTSelection = (serialNumber: number) => {
    const newSelection = new Set(selectedNFTs)
    if (newSelection.has(serialNumber)) {
      newSelection.delete(serialNumber)
    } else {
      newSelection.add(serialNumber)
    }
    setSelectedNFTs(newSelection)
  }

  // Select all NFTs
  const selectAll = () => {
    const allSerials = new Set(oldNFTs.map(nft => nft.serial_number))
    setSelectedNFTs(allSerials)
  }

  // Deselect all NFTs
  const deselectAll = () => {
    setSelectedNFTs(new Set())
  }

  // Swap selected NFTs
  const swapNFTs = async () => {
    if (selectedNFTs.size === 0) {
      setError('Please select at least one NFT to swap')
      return
    }

    setSwapping(true)
    setError('')
    setSuccess('')

    try {
      // Call backend API to perform swap
      const response = await fetch('/api/swap-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAccountId: accountId,
          serialNumbers: Array.from(selectedNFTs),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Swap failed')
      }

      const result = await response.json()
      setSuccess(`Successfully swapped ${selectedNFTs.size} NFT(s)!`)
      setSelectedNFTs(new Set())

      // Refresh NFT list
      await fetchOldNFTs(accountId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed')
    } finally {
      setSwapping(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white flex flex-col">
      {/* Dot pattern background with gradient fade */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0, 255, 64, 1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)'
      }}></div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
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
        {!walletConnected ? (
          <div className="max-w-md mx-auto text-center">
            <button
              onClick={connectWallet}
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
                  onClick={() => {
                    setWalletConnected(false)
                    setAccountId('')
                    setOldNFTs([])
                    setSelectedNFTs(new Set())
                  }}
                  className="text-sm text-gray-400 hover:text-red-500 transition"
                >
                  DISCONNECT
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slime-green"></div>
                <p className="text-gray-400 mt-4">Loading your NFTs...</p>
              </div>
            )}

            {/* No NFTs Found */}
            {!loading && oldNFTs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No old SLIME NFTs found in your wallet.</p>
                <p className="text-gray-500 text-sm mt-2">Token ID: {OLD_TOKEN_ID}</p>
              </div>
            )}

            {/* NFT Grid */}
            {!loading && oldNFTs.length > 0 && (
              <div>
                {/* Selection Controls */}
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
                    <button
                      onClick={selectAll}
                      className="text-sm text-slime-green hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      className="text-sm text-gray-400 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* NFT Grid */}
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
                        {/* NFT Image */}
                        <div className="aspect-square bg-black/50 relative">
                          {metadata?.image ? (
                            <img
                              src={metadata.image}
                              alt={metadata.name || `SLIME #${nft.serial_number}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              No Image
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-slime-green text-black rounded-full w-8 h-8 flex items-center justify-center font-bold">
                              ✓
                            </div>
                          )}
                        </div>

                        {/* NFT Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-lg mb-1">
                            {metadata?.name || `SLIME #${nft.serial_number}`}
                          </h3>
                          <p className="text-sm text-gray-400">Serial #{nft.serial_number}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Swap Button */}
                <div className="sticky bottom-8 max-w-md mx-auto">
                  <button
                    onClick={swapNFTs}
                    disabled={selectedNFTs.size === 0 || swapping}
                    className="w-full bg-slime-green text-black py-4 rounded-md font-bold text-lg hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {swapping ? 'SWAPPING...' : `SWAP ${selectedNFTs.size} NFT${selectedNFTs.size !== 1 ? 'S' : ''}`}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 bg-red-500/10 border border-red-500 rounded p-4 text-red-500">
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="mt-4 bg-slime-green/10 border border-slime-green rounded p-4 text-slime-green">
                    {success}
                  </div>
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

