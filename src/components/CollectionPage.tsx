import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
  rarity: number
  rarityRank: number
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
  const itemsPerPage = 100

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

      const response = await fetch(
        `https://api.sentx.io/v1/public/token/nfts?apikey=${apiKey}&token=${tokenId}&limit=${itemsPerPage}&page=${page}&sortBy=rarity&sortDirection=ASC`
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
    if (nft.image.startsWith('ipfs://')) {
      return nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    return nft.image || '/Assets/SPLAT.png'
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

      {/* Header - Transparent background with dot grid showing through */}
      <nav className="relative flex justify-between px-6 py-5 z-50" style={{ paddingLeft: '76.5px', paddingRight: '60px' }}>
        <div className="flex items-center" style={{ marginTop: '4px' }}>
          <Link to="/home">
            <img src="/Assets/SPLAT.png" alt="SLIME" className="h-auto w-12" />
          </Link>
        </div>
        <div className="flex items-center gap-10" style={{ marginTop: '4px' }}>
          <div className="hidden md:flex gap-10 text-sm font-medium">
            <a href="https://altlantis.market/live/QQaupimisf3YogPk2hdq" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">MINT</a>
            {/* <Link to="/merch" className="text-gray-300 hover:text-slime-green transition">MERCH</Link> */}
            <Link to="/collection" className="text-slime-green transition">COLLECTION</Link>
          </div>
          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a href="https://github.com/Built-by-SLIME" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="https://x.com/builtbyslime" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://discord.gg/8X9PvNFyzK" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

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
                        <span className="text-slime-green font-bold">#{nft.rarityRank}</span>
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

