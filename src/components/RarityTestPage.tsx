import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface NFT {
  serialId: number
  name: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
  originalRarity: number
  originalRank: number
  correctedRarity: number
  correctedRank: number
  rarityPct: number
}

export default function RarityTestPage() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'crown' | 'changed'>('all')

  useEffect(() => {
    fetchRarityData()
  }, [])

  const fetchRarityData = async () => {
    try {
      setLoading(true)
      setError(null)

      const apiKey = import.meta.env.VITE_SENTX_API_KEY
      const tokenId = import.meta.env.VITE_SLIME_TOKEN_ID

      if (!apiKey || !tokenId) {
        throw new Error('Missing API configuration')
      }

      // Fetch from our new rarity calculation endpoint
      const response = await fetch(
        `/api/collection-rarity?apikey=${apiKey}&token=${tokenId}&limit=1000`
      )

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.nfts) {
        throw new Error('Invalid API response')
      }

      setNfts(data.nfts)
    } catch (err) {
      console.error('Error fetching rarity data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
      setNfts([])
    } finally {
      setLoading(false)
    }
  }

  const getFilteredNFTs = () => {
    if (filter === 'crown') {
      return nfts.filter(nft => 
        nft.attributes.some(attr => 
          attr.trait_type.toLowerCase() === 'head' && 
          attr.value.toLowerCase() === 'crown'
        )
      )
    }
    
    if (filter === 'changed') {
      return nfts.filter(nft => Math.abs(nft.originalRank - nft.correctedRank) > 5)
    }
    
    return nfts
  }

  const filteredNFTs = getFilteredNFTs()

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/collection" className="text-slime-green hover:underline mb-4 inline-block">
            ← Back to Collection
          </Link>
          <h1 className="text-4xl font-black mb-4">RARITY TEST PAGE</h1>
          <p className="text-gray-400 mb-4">
            Comparing SentX rarity (broken) vs. Corrected rarity (Crown trait normalized)
          </p>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-bold ${
                filter === 'all' ? 'bg-slime-green text-black' : 'bg-gray-700'
              }`}
            >
              All NFTs ({nfts.length})
            </button>
            <button
              onClick={() => setFilter('crown')}
              className={`px-4 py-2 rounded-md font-bold ${
                filter === 'crown' ? 'bg-slime-green text-black' : 'bg-gray-700'
              }`}
            >
              Crown NFTs Only
            </button>
            <button
              onClick={() => setFilter('changed')}
              className={`px-4 py-2 rounded-md font-bold ${
                filter === 'changed' ? 'bg-slime-green text-black' : 'bg-gray-700'
              }`}
            >
              Rank Changed &gt;5
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slime-green border-t-transparent"></div>
            <p className="text-slime-green mt-4">Calculating rarity...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchRarityData}
              className="bg-slime-green text-black px-6 py-3 rounded-md font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results Table */}
        {!loading && !error && filteredNFTs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full bg-[#1f1f1f] rounded-lg overflow-hidden">
              <thead className="bg-black">
                <tr>
                  <th className="px-4 py-3 text-left">Serial</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Has Crown?</th>
                  <th className="px-4 py-3 text-right">SentX Rank</th>
                  <th className="px-4 py-3 text-right">Corrected Rank</th>
                  <th className="px-4 py-3 text-right">Rank Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredNFTs.map((nft) => {
                  const hasCrown = nft.attributes.some(attr =>
                    attr.trait_type.toLowerCase() === 'head' &&
                    attr.value.toLowerCase() === 'crown'
                  )
                  const rankChange = nft.originalRank - nft.correctedRank
                  const isImprovement = rankChange > 0

                  return (
                    <tr key={nft.serialId} className="border-t border-gray-700 hover:bg-gray-800">
                      <td className="px-4 py-3 font-mono">#{nft.serialId}</td>
                      <td className="px-4 py-3">{nft.name}</td>
                      <td className="px-4 py-3">
                        {hasCrown ? (
                          <span className="text-yellow-400">👑 Yes</span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">#{nft.originalRank}</td>
                      <td className="px-4 py-3 text-right text-slime-green font-bold">#{nft.correctedRank}</td>
                      <td className="px-4 py-3 text-right">
                        {rankChange !== 0 ? (
                          <span className={isImprovement ? 'text-green-400' : 'text-red-400'}>
                            {isImprovement ? '↑' : '↓'} {Math.abs(rankChange)}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

