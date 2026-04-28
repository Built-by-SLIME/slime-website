import { useState, useEffect, useMemo } from 'react'
import Navigation from './Navigation'
import Footer from './Footer'

interface NFT {
  serialId: number
  name: string
  image: string
  imageType: string
  metadata: string
  attributes: Array<{ trait_type: string; value: string }>
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

type SortOption = 'rarity-asc' | 'rarity-desc' | 'serial-asc' | 'serial-desc'
const ITEMS_PER_PAGE = 50

export default function CollectionPage() {
  const [allNfts, setAllNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('rarity-asc')
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string[]>>({})
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  useEffect(() => { fetchAllCollection() }, [])

  const fetchAllCollection = async () => {
    try {
      setLoading(true)
      setError(null)
      const apiKey = import.meta.env.VITE_SENTX_API_KEY
      const tokenId = import.meta.env.VITE_SLIME_TOKEN_ID
      if (!apiKey || !tokenId) throw new Error('Missing API configuration')
      const response = await fetch(`/api/collection-rarity?apikey=${apiKey}&token=${tokenId}&limit=1000&page=1`)
      if (!response.ok) throw new Error(`API Error: ${response.status}`)
      const data = await response.json()
      if (!data.success || !data.nfts) throw new Error('Invalid API response')
      setAllNfts(data.nfts)
    } catch (err) {
      console.error('Error fetching collection:', err)
      setError('Unable to load collection')
    } finally {
      setLoading(false)
    }
  }

  // Build trait type → [{ value, count }] map from all NFTs
  const traitOptions = useMemo(() => {
    const countMap: Record<string, Record<string, number>> = {}
    allNfts.forEach(nft => {
      nft.attributes.forEach(attr => {
        if (!countMap[attr.trait_type]) countMap[attr.trait_type] = {}
        countMap[attr.trait_type][attr.value] = (countMap[attr.trait_type][attr.value] || 0) + 1
      })
    })
    const map: Record<string, { value: string; count: number }[]> = {}
    Object.entries(countMap).forEach(([traitType, valueCounts]) => {
      map[traitType] = Object.entries(valueCounts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value))
    })
    return map
  }, [allNfts])

  // Apply trait filters (AND across types, OR within a type) then sort
  const filteredAndSorted = useMemo(() => {
    let result = [...allNfts]
    const active = Object.entries(selectedTraits).filter(([, v]) => v.length > 0)
    if (active.length > 0) {
      result = result.filter(nft =>
        active.every(([type, vals]) =>
          nft.attributes.some(a => a.trait_type === type && vals.includes(a.value))
        )
      )
    }
    switch (sortBy) {
      case 'rarity-asc':  result.sort((a, b) => a.correctedRank - b.correctedRank); break
      case 'rarity-desc': result.sort((a, b) => b.correctedRank - a.correctedRank); break
      case 'serial-asc':  result.sort((a, b) => a.serialId - b.serialId); break
      case 'serial-desc': result.sort((a, b) => b.serialId - a.serialId); break
    }
    return result
  }, [allNfts, sortBy, selectedTraits])

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE)
  const paginatedNfts = filteredAndSorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const activeFilterCount = Object.values(selectedTraits).reduce((sum, v) => sum + v.length, 0)

  const handleSortChange = (sort: SortOption) => { setSortBy(sort); setCurrentPage(1) }

  const toggleTrait = (traitType: string, value: string) => {
    setSelectedTraits(prev => {
      const current = prev[traitType] || []
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
      return { ...prev, [traitType]: updated }
    })
    setCurrentPage(1)
  }

  const clearFilters = () => { setSelectedTraits({}); setCurrentPage(1) }

  const selectAllTrait = (traitType: string) => {
    setSelectedTraits(prev => ({ ...prev, [traitType]: traitOptions[traitType].map(item => item.value) }))
    setCurrentPage(1)
  }

  const clearTraitType = (traitType: string) => {
    setSelectedTraits(prev => ({ ...prev, [traitType]: [] }))
    setCurrentPage(1)
  }

  const toggleTraitType = (type: string) => {
    setExpandedTypes(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getNFTImage = (nft: NFT) => {
    if (!nft.image) return '/Assets/SPLAT.png'
    if (nft.image.startsWith('ipfs://')) {
      const gateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
      const raw = nft.image.replace('ipfs://', gateway)
      const hashIdx = raw.lastIndexOf('/')
      return raw.substring(0, hashIdx + 1) + raw.substring(hashIdx + 1).replace(/#/g, '%23')
    }
    return nft.image
  }

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'rarity-asc',  label: 'RARITY ASC'  },
    { value: 'rarity-desc', label: 'RARITY DESC' },
    { value: 'serial-asc',  label: 'SERIAL ASC'  },
    { value: 'serial-desc', label: 'SERIAL DESC' },
  ]

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white relative">
      {/* Dot Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0, 255, 64, 1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)'
      }} />

      <Navigation />

      <main className="relative z-10 py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-7xl font-black mb-4">COLLECTION</h1>
            <p className="text-gray-400 text-lg">Explore the complete SLIME collection</p>
          </div>

          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slime-green border-t-transparent" />
              <p className="text-slime-green mt-4">Loading SLIMEs...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-20">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={fetchAllCollection} className="bg-slime-green text-black px-6 py-3 rounded-md font-bold hover:bg-[#00cc33] transition">Retry</button>
            </div>
          )}

          {!loading && !error && allNfts.length > 0 && (
            <>
              {/* Sort + Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mr-1">Sort</span>
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => handleSortChange(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition ${sortBy === opt.value ? 'bg-slime-green text-black' : 'bg-[#1f1f1f] border border-gray-700 text-gray-300 hover:border-slime-green'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 font-bold transition">
                      CLEAR ALL ({activeFilterCount})
                    </button>
                  )}
                  <button onClick={() => setFiltersOpen(p => !p)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider border transition ${filtersOpen || activeFilterCount > 0 ? 'bg-slime-green text-black border-slime-green' : 'bg-[#1f1f1f] border-gray-700 text-gray-300 hover:border-slime-green'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    FILTERS{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  </button>
                </div>
              </div>

              {/* Filter Panel */}
              {filtersOpen && (
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(traitOptions).map(([traitType, items]) => {
                      const isExpanded = expandedTypes.has(traitType)
                      const selected = selectedTraits[traitType] || []
                      const selCount = selected.length
                      const allSelected = selCount === items.length
                      return (
                        <div key={traitType} className="bg-[#252525] rounded-xl overflow-hidden">
                          {/* Accordion Header */}
                          <button onClick={() => toggleTraitType(traitType)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-widest text-gray-300">
                                {traitType}
                                <span className="ml-1.5 text-gray-600 font-normal">({items.length})</span>
                              </span>
                              {selCount > 0 && (
                                <p className="text-slime-green text-xs font-bold mt-0.5">{selCount} selected</p>
                              )}
                            </div>
                            <svg className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isExpanded && (
                            <>
                              {/* Select All / Clear All */}
                              <div className="flex gap-2 px-3 pb-2">
                                <button onClick={() => selectAllTrait(traitType)}
                                  disabled={allSelected}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed">
                                  Select All
                                </button>
                                <button onClick={() => clearTraitType(traitType)}
                                  disabled={selCount === 0}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed">
                                  Clear
                                </button>
                              </div>
                              {/* Value List */}
                              <div className="px-3 pb-3 max-h-48 overflow-y-auto space-y-1">
                                {items.map(({ value, count }) => {
                                  const isSel = selected.includes(value)
                                  return (
                                    <button key={value} onClick={() => toggleTrait(traitType, value)}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center gap-2.5 ${isSel ? 'bg-slime-green/15 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                                      {/* Checkbox */}
                                      <span className={`w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition ${isSel ? 'bg-slime-green border-slime-green' : 'border-gray-600'}`}>
                                        {isSel && (
                                          <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </span>
                                      <span className="flex-1 font-medium">{value}</span>
                                      <span className="text-gray-600 text-xs">({count})</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Active Filter Chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {Object.entries(selectedTraits).flatMap(([type, vals]) =>
                    vals.map(val => (
                      <button key={`${type}:${val}`} onClick={() => toggleTrait(type, val)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slime-green/15 border border-slime-green/40 text-slime-green text-xs font-bold hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 transition">
                        {type}: {val} ×
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Results count */}
              <p className="text-gray-500 text-xs mb-5">
                {filteredAndSorted.length === allNfts.length
                  ? `${allNfts.length} SLIMEs`
                  : `${filteredAndSorted.length} of ${allNfts.length} SLIMEs match`}
              </p>

              {filteredAndSorted.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-400 text-lg mb-3">No SLIMEs match your filters</p>
                  <button onClick={clearFilters} className="bg-slime-green text-black px-6 py-3 rounded-md font-bold hover:bg-[#00cc33] transition text-sm">CLEAR FILTERS</button>
                </div>
              ) : (
                <>
                  {/* NFT Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
                    {paginatedNfts.map(nft => (
                      <div key={nft.serialId} className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-700 hover:border-slime-green transition-all transform hover:scale-105">
                        <div className="aspect-square bg-[#252525] p-4">
                          <img src={getNFTImage(nft)} alt={nft.name} className="w-full h-full object-contain" loading="lazy" crossOrigin="anonymous"
                            onError={e => { (e.target as HTMLImageElement).src = '/Assets/SPLAT.png' }} />
                        </div>
                        <div className="p-3 space-y-2">
                          <h3 className="text-sm font-bold truncate">{nft.name}</h3>
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
                          <a href={`https://sentx.io/nft-marketplace/slime/${nft.serialId}`} target="_blank" rel="noopener noreferrer"
                            className="block w-full bg-slime-green text-black py-2 rounded-md font-bold text-xs hover:bg-[#00cc33] transition text-center">
                            {nft.isListed ? 'BUY NOW' : 'VIEW'}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <>
                      <div className="flex justify-center items-center gap-2 flex-wrap">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                          className="px-4 py-2 bg-[#1f1f1f] border border-gray-700 rounded-md font-bold text-sm hover:border-slime-green transition disabled:opacity-50 disabled:cursor-not-allowed">
                          ← PREV
                        </button>
                        {(() => {
                          const pages: (number | string)[] = []
                          if (totalPages <= 7) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i)
                          } else {
                            pages.push(1)
                            if (currentPage > 3) pages.push('es')
                            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
                            if (currentPage < totalPages - 2) pages.push('ee')
                            pages.push(totalPages)
                          }
                          return pages.map((p, idx) =>
                            typeof p === 'string' ? (
                              <span key={`ell-${idx}`} className="px-2 text-gray-500 font-bold text-sm">…</span>
                            ) : (
                              <button key={`page-${p}`} onClick={() => handlePageChange(p)}
                                className={`px-4 py-2 rounded-md font-bold text-sm transition ${currentPage === p ? 'bg-slime-green text-black' : 'bg-[#1f1f1f] border border-gray-700 hover:border-slime-green'}`}>
                                {p}
                              </button>
                            )
                          )
                        })()}
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-[#1f1f1f] border border-gray-700 rounded-md font-bold text-sm hover:border-slime-green transition disabled:opacity-50 disabled:cursor-not-allowed">
                          NEXT →
                        </button>
                      </div>
                      <div className="text-center mt-6 text-gray-400 text-sm">
                        Page {currentPage} of {totalPages} · {filteredAndSorted.length} SLIMEs
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

