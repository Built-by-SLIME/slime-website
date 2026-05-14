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

// Color-code the overall rarity rank — same tier boundaries as trait counts
function rankColor(rank: number): string {
  if (rank <= 14)  return 'text-red-400'     // Mythic
  if (rank <= 49)  return 'text-orange-400'  // Legendary
  if (rank <= 124) return 'text-purple-400'  // Epic
  if (rank <= 249) return 'text-blue-400'    // Rare
  if (rank <= 499) return 'text-green-400'   // Uncommon
  return 'text-gray-400'                     // Common
}

export default function CollectionPage() {
  const [allNfts, setAllNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortOption>('rarity-asc')
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string[]>>({})
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expandedType, setExpandedType] = useState<string | null>(null)
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)

  useEffect(() => { fetchAllCollection() }, [])

  // Close NFT modal on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedNft(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
  // Keys are normalised to lowercase so capitalisation variants (e.g. "Ice cream"
  // vs "Ice Cream", "crown" vs "Crown") are merged into a single entry.
  const traitOptions = useMemo(() => {
    // countMap key = lowercase value; display value = first-seen (most common) variant
    const countMap: Record<string, Record<string, { display: string; count: number }>> = {}
    allNfts.forEach(nft => {
      nft.attributes.forEach(attr => {
        if (!countMap[attr.trait_type]) countMap[attr.trait_type] = {}
        const key = attr.value.toLowerCase()
        if (!countMap[attr.trait_type][key]) {
          countMap[attr.trait_type][key] = { display: attr.value.charAt(0).toUpperCase() + attr.value.slice(1), count: 0 }
        }
        countMap[attr.trait_type][key].count += 1
      })
    })
    const map: Record<string, { value: string; count: number }[]> = {}
    Object.entries(countMap).forEach(([traitType, valueCounts]) => {
      map[traitType] = Object.entries(valueCounts)
        .map(([, { display, count }]) => ({ value: display, count }))
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
          nft.attributes.some(a => a.trait_type === type && vals.some(v => v.toLowerCase() === a.value.toLowerCase()))
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
    setExpandedType(prev => (prev === type ? null : type))
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
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Filter by Traits</p>
                  {/* Backdrop to close open dropdown on outside click */}
                  {expandedType && (
                    <div className="fixed inset-0 z-40" onClick={() => setExpandedType(null)} />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(traitOptions).map(([traitType, items]) => {
                      const isExpanded = expandedType === traitType
                      const selected = selectedTraits[traitType] || []
                      const selCount = selected.length
                      const allSelected = selCount === items.length
                      const summaryLabel = selCount === 0 ? 'Any' : selCount === 1 ? selected[0] : `${selCount} selected`
                      return (
                        <div key={traitType} className="relative">
                          {/* Trigger */}
                          <button
                            onClick={() => toggleTraitType(traitType)}
                            className={`w-full flex items-start justify-between px-4 py-3 rounded-xl text-left transition border ${isExpanded ? 'bg-[#2e2e2e] border-slime-green/60' : 'bg-[#252525] border-transparent hover:border-gray-600'}`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                {traitType} <span className="text-gray-600 font-normal normal-case tracking-normal">({items.length})</span>
                              </p>
                              <p className={`text-sm font-semibold mt-0.5 truncate ${selCount > 0 ? 'text-slime-green' : 'text-gray-300'}`}>
                                {summaryLabel}
                              </p>
                            </div>
                            <svg className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 mt-1 ml-2 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Floating Dropdown */}
                          {isExpanded && (
                            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                              {/* Select All / Clear All */}
                              <div className="flex gap-2 p-3 border-b border-gray-800">
                                <button
                                  onClick={e => { e.stopPropagation(); selectAllTrait(traitType) }}
                                  disabled={allSelected}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-[#2a2a2a] text-gray-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  Select All
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); clearTraitType(traitType) }}
                                  disabled={selCount === 0}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-[#2a2a2a] text-gray-300 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  Clear All
                                </button>
                              </div>
                              {/* Value List */}
                              <div className="max-h-56 overflow-y-auto p-2 space-y-0.5">
                                {items.map(({ value, count }) => {
                                  const isSel = selected.includes(value)
                                  return (
                                    <button
                                      key={value}
                                      onClick={e => { e.stopPropagation(); toggleTrait(traitType, value) }}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-3 ${isSel ? 'bg-slime-green/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                      <span className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition ${isSel ? 'bg-slime-green border-slime-green' : 'border-gray-600'}`}>
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
                            </div>
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
                            <span className={`font-bold ${rankColor(nft.correctedRank)}`}>#{nft.correctedRank}</span>
                          </div>
                          <button
                            onClick={() => setSelectedNft(nft)}
                            className="block w-full bg-slime-green text-black py-2 rounded-md font-bold text-xs hover:bg-[#00cc33] transition text-center">
                            VIEW
                          </button>
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

      {/* ── NFT Detail Modal ── */}
      {selectedNft && (() => {
        const nft = selectedNft
        const totalSupply = allNfts.length || 1
        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{
              paddingTop: 'max(16px, env(safe-area-inset-top))',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            }}
            onClick={() => setSelectedNft(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Panel */}
            <div
              className="relative z-10 bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-full overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedNft(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
              >
                ✕
              </button>

              {/* Top row — Image + Details side by side */}
              <div className="flex flex-col md:flex-row gap-0">
                {/* Left — Image */}
                <div className="md:w-2/5 flex-shrink-0 relative">
                  <div className="aspect-square bg-[#252525] rounded-t-2xl md:rounded-tl-2xl md:rounded-tr-none md:rounded-bl-none p-6 flex items-center justify-center">
                    <img
                      src={getNFTImage(nft)}
                      alt={nft.name}
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                      onError={e => { (e.target as HTMLImageElement).src = '/Assets/SPLAT.png' }}
                    />
                  </div>

                </div>

                {/* Right — Name + Details */}
                <div className="flex-1 p-6 space-y-5">
                  <div>
                    <h2 className="text-2xl font-black">{nft.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">Hedera NFT · SLIME Collection</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Details</h3>
                    <div className="bg-[#252525] rounded-xl divide-y divide-gray-800">
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-gray-400 text-sm">SLIME ID</span>
                        <span className="text-white font-bold">#{nft.serialId}</span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-gray-400 text-sm">Rarity Rank</span>
                        <span className={`font-bold ${rankColor(nft.correctedRank)}`}>#{nft.correctedRank} <span className="text-gray-500 font-normal">/ {totalSupply}</span></span>
                      </div>
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-gray-400 text-sm">Rarity Score</span>
                        <span className="text-white font-bold">{(nft.correctedRarity * 100).toFixed(2)}%</span>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom — Traits full width */}
              <div className="px-6 pb-6 pt-2 border-t border-gray-800">
                <div className="flex justify-between items-center py-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Traits</h3>
                  <span className="text-xs text-gray-600">{nft.attributes.length} traits</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {nft.attributes.map(attr => {
                    const traitItems = traitOptions[attr.trait_type] || []
                    const match = traitItems.find(i => i.value.toLowerCase() === attr.value.toLowerCase())
                    const count = match?.count ?? 0
                    const pct = totalSupply > 0 ? ((count / totalSupply) * 100).toFixed(1) : '0.0'
                    const pctNum = parseFloat(pct)
                    // Color by percentage thresholds — matching SentX tiers
                    const pillColor =
                      pctNum >= 20 ? 'bg-gray-500/25 text-gray-400' :
                      pctNum >= 10 ? 'bg-blue-500/25 text-blue-400' :
                      pctNum >= 5  ? 'bg-purple-500/25 text-purple-400' :
                      pctNum >= 1  ? 'bg-orange-500/25 text-orange-400' :
                                     'bg-red-500/25 text-red-400'
                    return (
                      <div key={attr.trait_type} className="bg-[#252525] rounded-xl px-4 py-3 border border-gray-800">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{attr.trait_type}</p>
                        <p className="text-white font-bold text-sm mb-2">{attr.value.charAt(0).toUpperCase() + attr.value.slice(1)}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${pillColor}`}>
                            {count.toLocaleString()}
                          </span>
                          <span className="text-gray-500 text-xs">{pct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* SentX link */}
                <div className="mt-5 text-center">
                  <a
                    href={`https://sentx.io/nft-marketplace/slime/${nft.serialId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 hover:text-gray-400 transition"
                  >
                    View on SentX ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

