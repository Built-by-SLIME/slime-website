import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navigation from './Navigation'
import Footer from './Footer'

interface NFT {
  serialId: number
  name: string
  image: string
  imageType: string
  metadata: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
  originalRarity?: number
  originalRank?: number
  correctedRarity: number
  correctedRank: number
  rarityPct: number
  listingDate: string | null
  sellerAddress: string | null
  isListed: boolean
  listingPrice: number | null
}

export default function CollectionPage() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalNFTs, setTotalNFTs] = useState(0)
  const itemsPerPage = 50 // Reduced from 100 to 50 for faster loading

  useEffect(() => {
    fetchCollection(currentPage)
  }, [currentPage])

  const fetchCollection = async (page: number) => {
    try {
      setLoading(true)
      setError(null)

      const apiKey = import.meta.env.VITE_SENTX_API_KEY
      const tokenId = import.meta.env.VITE_SLIME_TOKEN_ID

      if (!apiKey || !tokenId) {
        throw new Error('Missing API configuration')
      }

      // Use corrected rarity calculation (fixes Crown trait capitalization)
      const response = await fetch(
        `/api/collection-rarity?apikey=${apiKey}&token=${tokenId}&limit=${itemsPerPage}&page=${page}`
      )

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.nfts) {
        throw new Error('Invalid API response')
      }

      setNfts(data.nfts)
      setTotalNFTs(data.total || 1000)
    } catch (err) {
      console.error('Error fetching collection:', err)
      setError('Unable to load collection')
      setNfts([])
    } finally {
      setLoading(false)
    }
  }

  const getNFTImage = (nft: NFT) => {
    if (!nft.image) {
      return '/Assets/SPLAT.png'
    }
    if (nft.image.startsWith('ipfs://')) {
      const gateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
      const raw = nft.image.replace('ipfs://', gateway)
      // Encode # in filenames so browsers don't treat them as URL fragments
      const hashIdx = raw.lastIndexOf('/')
      const dir = raw.substring(0, hashIdx + 1)
      const file = raw.substring(hashIdx + 1).replace(/#/g, '%23')
      return dir + file
    }
    return nft.image
  }

  const getBuyLink = (nft: NFT) => {
    return `https://sentx.io/nft-marketplace/slime/${nft.serialId}`
  }

  const totalPages = Math.ceil(totalNFTs / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white relative">
      {/* Dot Grid Background - Full page */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0, 255, 64, 1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)'
      }}></div>

      <Navigation />

      {/* Main Content */}
      <main className="relative z-10 py-20 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-black mb-4">COLLECTION</h1>
            <p className="text-gray-400 text-lg mb-2">Explore the complete SLIME collection</p>
            <p className="text-slime-green text-sm font-bold">Sorted by Rarity: Most Rare → Least Rare</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slime-green border-t-transparent"></div>
              <p className="text-slime-green mt-4">Loading SLIMEs...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-20">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={() => fetchCollection(currentPage)}
                className="bg-slime-green text-black px-6 py-3 rounded-md font-bold hover:bg-[#00cc33] transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* NFT Grid */}
          {!loading && !error && nfts.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
                {nfts.map((nft) => (
                  <div
                    key={nft.serialId}
                    className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-700 hover:border-slime-green transition-all transform hover:scale-105"
                  >
                    <div className="aspect-square bg-[#252525] p-4">
                      <img
                        src={getNFTImage(nft)}
                        alt={nft.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/Assets/SPLAT.png'
                        }}
                      />
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold truncate">{nft.name}</h3>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Rank</span>
                        <span className="text-slime-green font-bold">#{nft.correctedRank}</span>
                      </div>
                      {nft.isListed && nft.listingPrice && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Price</span>
                          <span className="text-slime-green font-bold">{nft.listingPrice} HBAR</span>
                        </div>
                      )}
                      <a
                        href={getBuyLink(nft)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-slime-green text-black py-2 rounded-md font-bold text-xs hover:bg-[#00cc33] transition text-center"
                      >
                        {nft.isListed ? 'BUY NOW' : 'VIEW'}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#1f1f1f] border border-gray-700 rounded-md font-bold text-sm hover:border-slime-green transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← PREV
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-md font-bold text-sm transition ${
                        currentPage === pageNum
                          ? 'bg-slime-green text-black'
                          : 'bg-[#1f1f1f] border border-gray-700 hover:border-slime-green'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#1f1f1f] border border-gray-700 rounded-md font-bold text-sm hover:border-slime-green transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  NEXT →
                </button>
              </div>

              {/* Page Info */}
              <div className="text-center mt-6 text-gray-400 text-sm">
                Page {currentPage} of {totalPages} • Showing {nfts.length} of {totalNFTs} SLIMEs
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

