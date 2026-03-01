import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

interface NFTWithImage {
  serial_number: number
  name: string
  imageUrl: string
  rank?: number
}

export default function InventoryPage() {
  const { isConnected, accountId, slimeNFTs, slimeTokenBalance, connect, disconnect } = useWallet()

  const [nftsWithImages, setNftsWithImages] = useState<NFTWithImage[]>([])
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [expandedNFT, setExpandedNFT] = useState<NFTWithImage | null>(null)

  useEffect(() => {
    if (isConnected && slimeNFTs.length > 0) {
      loadNFTImages()
    }
    if (!isConnected) {
      setNftsWithImages([])
    }
  }, [isConnected, slimeNFTs])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedNFT(null) }
    if (expandedNFT) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [expandedNFT])

  const loadNFTImages = async () => {
    setLoadingNFTs(true)
    try {
      const apiKey = import.meta.env.VITE_SENTX_API_KEY
      const tokenId = import.meta.env.VITE_SLIME_TOKEN_ID
      const serials = slimeNFTs.map(n => n.serial_number).join(',')

      const response = await fetch(
        `/api/nft-images?apikey=${apiKey}&token=${tokenId}&serials=${serials}`
      )
      if (!response.ok) throw new Error('Failed to fetch NFT images')

      const data = await response.json()
      const nftsMap: Record<number, { name: string; image: string; rank?: number }> = data.nfts || {}
      const gateway = 'https://gateway.pinata.cloud/ipfs/'

      const results: NFTWithImage[] = slimeNFTs
        .map(nft => {
          const info = nftsMap[nft.serial_number]
          let imageUrl = info?.image || ''
          if (imageUrl.startsWith('ipfs://')) {
            imageUrl = gateway + imageUrl.slice(7).replace(/#/g, '%23')
          }
          return {
            serial_number: nft.serial_number,
            name: info?.name || `SLIME #${nft.serial_number}`,
            imageUrl,
            rank: info?.rank
          }
        })
        .sort((a, b) => a.serial_number - b.serial_number)

      setNftsWithImages(results)
    } catch (err) {
      console.error('Failed to load NFT images:', err)
    }
    setLoadingNFTs(false)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#2a2a2a] text-white flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-20">
          <div className="text-center max-w-sm">
            <h1 className="text-2xl font-black mb-3">YOUR INVENTORY</h1>
            <p className="text-gray-500 text-sm mb-8">
              Connect your wallet to view your SLIME NFTs and token balance.
            </p>
            <button
              onClick={() => connect().catch(console.error)}
              className="w-full bg-slime-green text-black py-3 rounded-md font-bold hover:bg-[#00cc33] transition"
            >
              CONNECT WALLET
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white flex flex-col">
      {/* Dot pattern background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0, 255, 64, 1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)'
      }} />

      <Navigation />

      <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-10 flex-grow w-full">

        {/* Inventory Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">INVENTORY</h1>
          <p className="text-slime-green font-mono text-sm truncate mb-5">{accountId}</p>
          <div className="flex gap-3">
            <span className="flex-1 text-center bg-black/40 rounded-lg px-2 py-3 text-xs text-gray-400 border border-gray-800">
              <span className="block text-white font-bold text-xl">{slimeNFTs.length}</span>
              NFTs
            </span>
            <span className="flex-1 text-center bg-black/40 rounded-lg px-2 py-3 text-xs text-gray-400 border border-gray-800">
              <span className="block text-white font-bold text-xl">{Number(slimeTokenBalance).toLocaleString()}</span>
              $SLIME
            </span>
          </div>
        </div>

        {/* NFT Gallery */}
        {slimeNFTs.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Your NFTs</h2>
            {loadingNFTs ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slime-green" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {nftsWithImages.map(nft => (
                  <button
                    key={nft.serial_number}
                    onClick={() => setExpandedNFT(nft)}
                    title={nft.name}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-700 hover:border-slime-green/50 transition hover:scale-105"
                  >
                    {nft.imageUrl ? (
                      <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" style={{ objectPosition: 'center 65%' }} />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-600">
                        #{nft.serial_number}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {slimeNFTs.length === 0 && (
          <div className="mb-10 text-center py-10 bg-black/20 border border-gray-800 rounded-2xl">
            <p className="text-gray-500 text-sm">No SLIME NFTs found in this wallet.</p>
          </div>
        )}

        {/* Disconnect */}
        <div className="text-center pb-8">
          <button
            onClick={disconnect}
            className="text-sm text-gray-500 hover:text-red-400 transition font-bold uppercase tracking-wider"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>

      <Footer />

      {/* NFT Expanded Modal */}
      {expandedNFT && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedNFT(null)}
        >
          <div
            className="relative bg-[#1a1a1a] border border-gray-800 rounded-2xl overflow-hidden w-full max-w-xs"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setExpandedNFT(null)}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-gray-400 hover:text-white transition"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="aspect-square w-full bg-gray-900">
              {expandedNFT.imageUrl ? (
                <img src={expandedNFT.imageUrl} alt={expandedNFT.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                  #{expandedNFT.serial_number}
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="text-white font-bold text-sm mb-0.5">{expandedNFT.name}</p>
              <div className="flex items-center gap-3">
                <p className="text-gray-500 text-xs">Serial #{expandedNFT.serial_number}</p>
                {expandedNFT.rank && (
                  <p className="text-xs text-slime-green font-bold">Rank #{expandedNFT.rank}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
