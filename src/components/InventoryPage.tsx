import { useState, useEffect } from 'react'
import { decodeMetadata } from '../utils/nft'
import { useWallet } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

const SLABS_TOKEN = '0.0.10480544'
const MIRROR = 'https://mainnet-public.mirrornode.hedera.com'

interface InventoryNFT {
  serial_number: number
  name: string
  imageUrl: string
  correctedRank: number
  correctedRarity: number
  attributes: Array<{ trait_type: string; value: string }>
}

interface SlabInventoryNFT {
  serial_number: number
  name: string
  imageUrl: string
  videoUrl: string
}

// Same tier boundaries as collection/market pages
function rankColor(rank: number): string {
  if (rank <= 14)  return 'text-red-400'
  if (rank <= 49)  return 'text-orange-400'
  if (rank <= 124) return 'text-purple-400'
  if (rank <= 249) return 'text-blue-400'
  if (rank <= 499) return 'text-green-400'
  return 'text-gray-400'
}

export default function InventoryPage() {
  const { isConnected, accountId, slimeNFTs, slimeTokenBalance, connect, disconnect } = useWallet()

  const [nftsWithImages, setNftsWithImages] = useState<InventoryNFT[]>([])
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [selectedNft, setSelectedNft] = useState<InventoryNFT | null>(null)
  const [fullTraitCounts, setFullTraitCounts] = useState<Record<string, Record<string, number>>>({})

  const [slabNFTs, setSlabNFTs] = useState<SlabInventoryNFT[]>([])
  const [loadingSlabs, setLoadingSlabs] = useState(false)
  const [selectedSlab, setSelectedSlab] = useState<SlabInventoryNFT | null>(null)

  useEffect(() => {
    if (isConnected && slimeNFTs.length > 0) loadNFTImages()
    if (isConnected && accountId) loadSlabNFTs()
    if (!isConnected) {
      setNftsWithImages([])
      setSlabNFTs([])
    }
  }, [isConnected, slimeNFTs, accountId])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedNft(null); setSelectedSlab(null) }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const loadNFTImages = async () => {
    setLoadingNFTs(true)
    try {
      const apiKey = import.meta.env.VITE_SENTX_API_KEY
      const tokenId = import.meta.env.VITE_SLIME_TOKEN_ID
      const gateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'

      // Fetch full collection data (traits + corrected rarity) and filter to user's serials
      const response = await fetch(`/api/collection-rarity?apikey=${apiKey}&token=${tokenId}&limit=1000&page=1`)
      if (!response.ok) throw new Error('Failed to fetch collection data')
      const data = await response.json()
      if (!data.success || !data.nfts) throw new Error('Invalid API response')

      type RawNFT = { serialId: number | string; name: string; image: string; correctedRank: number; correctedRarity: number; attributes: Array<{ trait_type: string; value: string }> }
      const allNfts = data.nfts as RawNFT[]

      // Build trait counts from ALL 1000 NFTs for accurate rarity pill percentages
      const counts: Record<string, Record<string, number>> = {}
      for (const n of allNfts) {
        for (const attr of (n.attributes || [])) {
          if (!counts[attr.trait_type]) counts[attr.trait_type] = {}
          const key = attr.value.toLowerCase()
          counts[attr.trait_type][key] = (counts[attr.trait_type][key] || 0) + 1
        }
      }
      setFullTraitCounts(counts)

      // Filter to user's NFTs only
      const userSerials = new Set(slimeNFTs.map(n => n.serial_number))
      const results: InventoryNFT[] = allNfts
        .filter(n => userSerials.has(Number(n.serialId)))
        .map(n => {
          let imageUrl = n.image || ''
          if (imageUrl.startsWith('ipfs://')) {
            const raw = imageUrl.replace('ipfs://', gateway)
            const idx = raw.lastIndexOf('/')
            imageUrl = raw.substring(0, idx + 1) + raw.substring(idx + 1).replace(/#/g, '%23')
          }
          return {
            serial_number: Number(n.serialId),
            name: n.name || `SLIME #${n.serialId}`,
            imageUrl,
            correctedRank: n.correctedRank,
            correctedRarity: n.correctedRarity,
            attributes: n.attributes || [],
          }
        })
        .sort((a, b) => a.serial_number - b.serial_number)

      setNftsWithImages(results)
    } catch (err) {
      console.error('Failed to load NFT data:', err)
    }
    setLoadingNFTs(false)
  }

  const loadSlabNFTs = async () => {
    if (!accountId) return
    setLoadingSlabs(true)
    try {
      const rawNFTs: { serial_number: number; metadata?: string }[] = []
      let path: string | null = `/api/v1/accounts/${accountId}/nfts?token.id=${SLABS_TOKEN}&limit=100`
      while (path) {
        const r = await fetch(`${MIRROR}${path}`)
        if (!r.ok) break
        const d = await r.json()
        rawNFTs.push(...(d.nfts || []))
        path = d.links?.next || null
      }
      const results: SlabInventoryNFT[] = await Promise.all(
        rawNFTs.map(async nft => {
          let name = `SLIME Slab #${nft.serial_number}`
          let imageUrl = ''
          let videoUrl = ''
          if (nft.metadata) {
            const meta = await decodeMetadata(nft.metadata)
            if (meta?.name) name = meta.name
            if (meta?.image) imageUrl = meta.image
            // HIP-412: video is in the files array — find the first mp4 entry.
            // Always use a public IPFS gateway for video; private/Pinata gateways
            // don't support the Range Requests that browsers need for video streaming.
            const VIDEO_GATEWAY = 'https://ipfs.io/ipfs/'
            if (meta?.files) {
              const videoFile = meta.files.find(f => f.type?.includes('mp4') || f.type?.includes('video'))
              const rawUri = videoFile?.uri || videoFile?.url || ''
              if (rawUri) {
                if (rawUri.startsWith('ipfs://')) {
                  videoUrl = VIDEO_GATEWAY + rawUri.slice(7).replace(/#/g, '%23')
                } else if (rawUri.includes('/ipfs/')) {
                  videoUrl = VIDEO_GATEWAY + rawUri.split('/ipfs/')[1]
                } else {
                  videoUrl = rawUri
                }
              }
            }
            // Fallback: animation_url field
            if (!videoUrl && meta?.animation_url) {
              const raw = meta.animation_url
              if (raw.startsWith('ipfs://')) {
                videoUrl = VIDEO_GATEWAY + raw.slice(7).replace(/#/g, '%23')
              } else if (raw.includes('/ipfs/')) {
                videoUrl = VIDEO_GATEWAY + raw.split('/ipfs/')[1]
              } else {
                videoUrl = raw
              }
            }
          }
          return { serial_number: nft.serial_number, name, imageUrl, videoUrl }
        })
      )
      setSlabNFTs(results.sort((a, b) => a.serial_number - b.serial_number))
    } catch (err) {
      console.error('Failed to load Slab NFTs:', err)
    } finally {
      setLoadingSlabs(false)
    }
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

      <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-10 flex-grow w-full">

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
              <span className="block text-white font-bold text-xl">{loadingSlabs ? '…' : slabNFTs.length}</span>
              Slabs
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {nftsWithImages.map(nft => (
                  <div key={nft.serial_number} className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-700 hover:border-slime-green transition-all">
                    <div className="aspect-square bg-[#252525] p-2">
                      {nft.imageUrl ? (
                        <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-contain" crossOrigin="anonymous"
                          onError={e => {
                            const img = e.target as HTMLImageElement
                            if (!img.dataset.retried) {
                              img.dataset.retried = 'true'
                              setTimeout(() => { img.src = `${nft.imageUrl.split('?')[0]}?r=${Date.now()}` }, 1500)
                            } else {
                              img.src = '/Assets/SPLAT.png'
                            }
                          }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">#{nft.serial_number}</div>
                      )}
                    </div>
                    <div className="p-2.5 space-y-2">
                      <p className="text-gray-400 text-xs font-mono">#{nft.serial_number}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Rank</span>
                        <span className={`font-bold ${rankColor(nft.correctedRank)}`}>#{nft.correctedRank}</span>
                      </div>
                      <button
                        onClick={() => setSelectedNft(nft)}
                        className="block w-full bg-slime-green text-black py-1.5 rounded-md font-bold text-xs hover:bg-[#00cc33] transition text-center"
                      >
                        VIEW
                      </button>
                    </div>
                  </div>
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

        {/* Slabs Gallery */}
        {(loadingSlabs || slabNFTs.length > 0) && (
          <div className="mb-10">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Your Slabs</h2>
            {loadingSlabs ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slime-green" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {slabNFTs.map(nft => (
                  <div key={nft.serial_number} className="bg-[#1f1f1f] rounded-xl overflow-hidden border border-gray-700 hover:border-slime-green transition-all">
                    <div className="aspect-square bg-[#252525] p-2">
                      {nft.imageUrl ? (
                        <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-contain" crossOrigin="anonymous"
                          onError={e => { (e.target as HTMLImageElement).src = '/Assets/SPLAT.png' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">#{nft.serial_number}</div>
                      )}
                    </div>
                    <div className="p-2.5 space-y-2">
                      <p className="text-white text-xs font-bold truncate">{nft.name}</p>
                      <p className="text-gray-500 text-xs font-mono">#{nft.serial_number}</p>
                      <button
                        onClick={() => setSelectedSlab(nft)}
                        className="block w-full bg-slime-green text-black py-1.5 rounded-md font-bold text-xs hover:bg-[#00cc33] transition text-center"
                      >
                        VIEW
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Slab Detail Lightbox */}
      {selectedSlab && (() => {
        const slab = selectedSlab
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }} onClick={() => setSelectedSlab(null)}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative z-10 bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Close */}
              <button onClick={() => setSelectedSlab(null)} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition">✕</button>

              {/* Video (falls back to image if no animation_url) */}
              <div className="aspect-square bg-black">
                {slab.videoUrl ? (
                  <video
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                    playsInline
                    controls
                    onError={e => console.error('Slab video failed to load:', (e.target as HTMLVideoElement).src)}
                  >
                    {/* Primary: ipfs.io (public, supports Range Requests) */}
                    <source src={slab.videoUrl} type="video/mp4" />
                    {/* Fallback: dweb.link — swap in if ipfs.io is slow */}
                    {slab.videoUrl.includes('/ipfs/') && (
                      <source src={`https://dweb.link/ipfs/${slab.videoUrl.split('/ipfs/')[1]}`} type="video/mp4" />
                    )}
                  </video>
                ) : (
                  <img src={slab.imageUrl || '/Assets/SPLAT.png'} alt={slab.name} className="w-full h-full object-contain" crossOrigin="anonymous" onError={e => { (e.target as HTMLImageElement).src = '/Assets/SPLAT.png' }} />
                )}
              </div>

              {/* Details */}
              <div className="p-5 space-y-1">
                <h2 className="text-lg font-black text-white">{slab.name}</h2>
                <p className="text-gray-500 text-sm">Hedera NFT · SLIME Slabs Collection</p>
                <p className="text-gray-600 text-xs font-mono pt-1">Serial #{slab.serial_number}</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* NFT Detail Lightbox */}
      {selectedNft && (() => {
        const nft = selectedNft
        const totalSupply = 1000
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }} onClick={() => setSelectedNft(null)}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative z-10 bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Close */}
              <button onClick={() => setSelectedNft(null)} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition">✕</button>

              {/* Top — image + details */}
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/5 flex-shrink-0">
                  <div className="aspect-square bg-[#252525] rounded-t-2xl md:rounded-tl-2xl md:rounded-tr-none md:rounded-bl-none overflow-hidden">
                    <img src={nft.imageUrl || '/Assets/SPLAT.png'} alt={nft.name} className="w-full h-full object-cover" crossOrigin="anonymous"
                      onError={e => { (e.target as HTMLImageElement).src = '/Assets/SPLAT.png' }} />
                  </div>
                </div>
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
                        <span className="text-white font-bold">#{nft.serial_number}</span>
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

              {/* Traits — full width */}
              {nft.attributes.length > 0 && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-800">
                  <div className="flex justify-between items-center py-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Traits</h3>
                    <span className="text-xs text-gray-600">{nft.attributes.length} traits</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {nft.attributes.map(attr => {
                      const count = fullTraitCounts[attr.trait_type]?.[attr.value.toLowerCase()] ?? 0
                      const pct = count > 0 ? ((count / totalSupply) * 100).toFixed(1) : '0.0'
                      const pctNum = parseFloat(pct)
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
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${pillColor}`}>{count.toLocaleString()}</span>
                            <span className="text-gray-500 text-xs">{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-5 text-center">
                    <a href={`https://sentx.io/nft-marketplace/slime/${nft.serial_number}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-600 hover:text-gray-400 transition">View on SentX ↗</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
