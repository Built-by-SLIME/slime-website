import { useState, useEffect } from 'react'

interface NFTListing {
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

export default function HotNFTs() {
  const [nfts, setNfts] = useState<NFTListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTopListings()
  }, [])

  const fetchTopListings = async () => {
    try {
      setLoading(true)
      setError(null)

      const apiKey = import.meta.env.VITE_SENTX_API_KEY
      const tokenId = import.meta.env.VITE_SLIME_TOKEN_ID

      if (!apiKey || !tokenId) {
        throw new Error('Missing API configuration')
      }

      // Fetch more NFTs to ensure we get enough listed ones
      // Use proxy to avoid CORS issues
      const response = await fetch(
        `/api/sentx-proxy?apikey=${apiKey}&token=${tokenId}&limit=100&sortBy=listingDate&sortDirection=DESC`
      )

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.nfts) {
        throw new Error('Invalid API response')
      }

      // Filter only listed NFTs, sort by price descending, take top 4
      const listedNFTs = data.nfts
        .filter((nft: NFTListing) => nft.isListed && nft.listingPrice !== null)
        .sort((a: NFTListing, b: NFTListing) => (b.listingPrice || 0) - (a.listingPrice || 0))
        .slice(0, 4)

      setNfts(listedNFTs)
    } catch (err) {
      console.error('Error fetching SentX listings:', err)
      setError('SentX API is temporarily unavailable')
      setNfts([])
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A'
    return `${price} HBAR`
  }

  const getNFTImage = (nft: NFTListing) => {
    // Convert IPFS URL to gateway URL
    if (nft.image.startsWith('ipfs://')) {
      const gateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
      return nft.image.replace('ipfs://', gateway)
    }
    return nft.image || '/Assets/SPLAT.png'
  }

  const getBuyLink = (nft: NFTListing) => {
    return `https://sentx.io/nft-marketplace/slime/${nft.serialId}`
  }

  if (loading) {
    return (
      <section id="nfts" className="py-20 px-8 bg-[#2a2a2a]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-4">LISTED NFTS</h2>
          <p className="text-gray-400 text-center mb-12 text-sm md:text-base">Check out the most sought-after SLIMEs</p>
          <div className="text-center text-slime-green">Loading listings...</div>
        </div>
      </section>
    )
  }

  if (error || nfts.length === 0) {
    return (
      <section id="nfts" className="py-20 px-8 bg-[#2a2a2a]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-4">LISTED NFTS</h2>
          <p className="text-gray-400 text-center mb-12 text-sm md:text-base">Check out the most sought-after SLIMEs</p>
          <div className="text-center text-gray-400">
            {error || 'No listings available at the moment'}
            <br />
            <a
              href="https://sentx.io/nft-marketplace/slime"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slime-green hover:underline mt-4 inline-block"
            >
              View all SLIMEs on SentX →
            </a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="nfts" className="py-20 px-8 bg-[#2a2a2a]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-center mb-4">LISTED NFTS</h2>
        <p className="text-gray-400 text-center mb-12 text-sm md:text-base">Top SLIME on SentX</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {nfts.map((nft) => (
            <div
              key={nft.serialId}
              className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-700 hover:border-slime-green transition-all transform hover:scale-105"
            >
              <div className="aspect-square bg-[#252525] p-6">
                <img
                  src={getNFTImage(nft)}
                  alt={nft.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/Assets/SPLAT.png'
                  }}
                />
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold">{nft.name}</h3>
                  <span className="text-xs bg-slime-green/20 text-slime-green px-2 py-1 rounded font-medium">
                    RANK #{nft.rarityRank}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-500 text-sm">Listed Price</span>
                  <span className="text-slime-green font-bold text-sm">{formatPrice(nft.listingPrice)}</span>
                </div>
                <a
                  href={getBuyLink(nft)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-slime-green text-black py-2.5 rounded-md font-bold text-sm hover:bg-[#00cc33] transition text-center"
                >
                  BUY NOW
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

