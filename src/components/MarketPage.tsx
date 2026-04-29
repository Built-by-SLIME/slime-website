import { useState, useEffect, useMemo } from 'react'
import { Transaction } from '@hashgraph/sdk'
import { useWallet } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

const SLIME_TOKEN = '0.0.9474754'
const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'

function toImageUrl(image: string): string {
  if (!image) return '/Assets/SPLAT.png'
  // Rewrite private dedicated Pinata gateway URLs to the configured gateway
  if (image.includes('.mypinata.cloud/ipfs/')) {
    const cid = image.split('/ipfs/')[1] || ''
    return IPFS_GATEWAY + cid
  }
  if (image.startsWith('ipfs://')) {
    const path = image.replace('ipfs://', '')
    const slash = path.lastIndexOf('/')
    const dir = path.substring(0, slash + 1)
    const file = path.substring(slash + 1).replace(/#/g, '%23')
    return IPFS_GATEWAY + dir + file
  }
  return image
}

// Uses the same /api/collection-rarity endpoint as CollectionPage so image
// URLs are guaranteed to be identical to the ones that work there.
async function loadNFTImages(serials: number[]): Promise<Map<number, string>> {
  const apiKey = import.meta.env.VITE_SENTX_API_KEY as string
  if (!apiKey || serials.length === 0) return new Map()
  try {
    const r = await fetch(
      `/api/collection-rarity?apikey=${apiKey}&token=${SLIME_TOKEN}&limit=1000&page=1`
    )
    if (!r.ok) return new Map()
    const d = await r.json()
    if (!d.success || !d.nfts) return new Map()
    // Normalize to numbers — SentX may return serialId as number or string in JSON
    const serialSet = new Set(serials.map(Number))
    const map = new Map<number, string>()
    for (const nft of d.nfts as Array<{ serialId: number | string; image: string }>) {
      const serial = Number(nft.serialId)
      if (serialSet.has(serial)) {
        map.set(serial, toImageUrl(nft.image))
      }
    }
    return map
  } catch {
    return new Map()
  }
}

// Fetches ALL 1000 NFTs — images + full trait/rarity data
async function loadAllNFTData(): Promise<{ images: Map<number, string>; data: Map<number, FullNFT> }> {
  const apiKey = import.meta.env.VITE_SENTX_API_KEY as string
  if (!apiKey) return { images: new Map(), data: new Map() }
  try {
    const r = await fetch(`/api/collection-rarity?apikey=${apiKey}&token=${SLIME_TOKEN}&limit=1000&page=1`)
    if (!r.ok) return { images: new Map(), data: new Map() }
    const d = await r.json()
    if (!d.success || !d.nfts) return { images: new Map(), data: new Map() }
    const images = new Map<number, string>()
    const data = new Map<number, FullNFT>()
    for (const nft of d.nfts as Array<{ serialId: number | string; image: string; attributes: Array<{ trait_type: string; value: string }>; correctedRank: number; correctedRarity: number }>) {
      const serial = Number(nft.serialId)
      images.set(serial, toImageUrl(nft.image))
      data.set(serial, { serialId: serial, attributes: nft.attributes || [], correctedRank: nft.correctedRank, correctedRarity: nft.correctedRarity })
    }
    return { images, data }
  } catch {
    return { images: new Map(), data: new Map() }
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function shortAddr(addr: string): string {
  if (!addr) return '—'
  const parts = addr.split('.')
  return `0.0.${parts[parts.length - 1]}`
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Listing {
  marketplaceListingId: number
  serialId: number
  sellerAddress: string
  salePrice: number
  listingDate: string
  nftName: string
  nftImage: string
  paymentToken: { symbol: string }
}

interface ActivityItem {
  saletype: string
  salePrice: number
  salePriceSymbol: string
  saleDate: string
  buyerAddress: string | null
  sellerAddress: string
  nftName: string
  nftSerialId: number
  nftImage: string
}

interface StatRecord {
  token: string
  datetime: string
  volume: number
  floor: number
  avgSale: number
  sales: number
  maxSale: number
  minSale: number
  listings: number
}

interface FullNFT {
  serialId: number
  attributes: Array<{ trait_type: string; value: string }>
  correctedRank: number
  correctedRarity: number
}

type Tab = 'listings' | 'activity' | 'stats'
type TxStatus = 'idle' | 'preparing' | 'signing' | 'confirming' | 'success' | 'error'

// Color-code the overall rarity rank — same tier boundaries as trait counts
function rankColor(rank: number): string {
  if (rank <= 14)  return 'text-red-400'     // Mythic
  if (rank <= 49)  return 'text-orange-400'  // Legendary
  if (rank <= 124) return 'text-purple-400'  // Epic
  if (rank <= 249) return 'text-blue-400'    // Rare
  if (rank <= 499) return 'text-green-400'   // Uncommon
  return 'text-gray-400'                     // Common
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MarketPage() {
  const { isConnected, accountId, dAppConnector, connect } = useWallet()

  const [tab, setTab] = useState<Tab>('listings')

  // Listings
  const [listings, setListings] = useState<Listing[]>([])
  const [floor, setFloor] = useState<number | null>(null)
  const [loadingListings, setLoadingListings] = useState(true)
  type MarketSort = 'price-asc' | 'price-desc' | 'rarity-asc' | 'rarity-desc' | 'serial-asc' | 'serial-desc'
  const [marketSort, setMarketSort] = useState<MarketSort>('price-asc')

  // NFT images keyed by serial — populated from mirror node since SentX
  // listings often have null nftImage for SLIME NFTs
  const [nftImages, setNftImages] = useState<Map<number, string>>(new Map())

  // Activity
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [activityLoaded, setActivityLoaded] = useState(false)

  // Stats
  const [stats, setStats] = useState<StatRecord[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsLoaded, setStatsLoaded] = useState(false)
  const [statsPeriod, setStatsPeriod] = useState<7 | 30 | 90>(30)

  // Transaction state
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [txMsg, setTxMsg] = useState('')
  const [activeTxSerial, setActiveTxSerial] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  // NFT detail modal
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const [allNftData, setAllNftData] = useState<Map<number, FullNFT>>(new Map())

  // ── Data fetching ───────────────────────────────────────────────────────────

  // Map combined sort option → API params (rarity is client-side, use price-asc as default fetch)
  const toApiSort = (opt: string) => {
    if (opt === 'price-asc')   return { sortBy: 'price',    sortDirection: 'ASC'  }
    if (opt === 'price-desc')  return { sortBy: 'price',    sortDirection: 'DESC' }
    if (opt === 'serial-asc')  return { sortBy: 'serialId', sortDirection: 'ASC'  }
    if (opt === 'serial-desc') return { sortBy: 'serialId', sortDirection: 'DESC' }
    return { sortBy: 'price', sortDirection: 'ASC' } // rarity — fetch unordered, sort client-side
  }

  const fetchListings = async (opt = marketSort) => {
    setLoadingListings(true)
    const { sortBy, sortDirection } = toApiSort(opt)
    try {
      const params = new URLSearchParams({ sortBy, sortDirection, limit: '100' })
      const r = await fetch(`/api/market-listings?${params}`)
      const d = await r.json()
      const items: Listing[] = d.marketListings || []
      setListings(items)
      // Load all 1000 NFTs once for images + trait data (needed for the detail modal)
      loadAllNFTData().then(({ images, data }) => {
        setNftImages(prev => new Map([...prev, ...images]))
        setAllNftData(prev => new Map([...prev, ...data]))
      })
    } catch { /* show empty */ } finally {
      setLoadingListings(false)
    }
  }

  const fetchFloor = async () => {
    try {
      const r = await fetch('/api/market-floor')
      const d = await r.json()
      if (d.success) setFloor(d.floor)
    } catch { /* ignore */ }
  }

  const fetchActivity = async () => {
    setLoadingActivity(true)
    try {
      const [marketResult, launchpadResult] = await Promise.allSettled([
        fetch('/api/market-activity?amount=50&activityFilter=All').then(r => r.json()),
        fetch('/api/launchpad-activity?limit=50').then(r => r.json()),
      ])
      const marketRes = marketResult.status === 'fulfilled' ? marketResult.value : {}
      const launchpadRes = launchpadResult.status === 'fulfilled' ? launchpadResult.value : {}
      const marketItems: ActivityItem[] = marketRes.marketActivity || []
      const launchpadItems: ActivityItem[] = (launchpadRes.response || []).map(
        (m: { saletype: string; salePrice: number; salePriceSymbol: string; saleDate: string; buyerAddress: string; nftName: string; nftSerialId: number; nftImage: string }) => ({
          saletype: m.saletype,
          salePrice: m.salePrice,
          salePriceSymbol: m.salePriceSymbol,
          saleDate: m.saleDate,
          buyerAddress: m.buyerAddress,
          sellerAddress: '',
          nftName: m.nftName,
          nftSerialId: m.nftSerialId,
          nftImage: m.nftImage,
        })
      )
      const combined = [...marketItems, ...launchpadItems].sort(
        (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
      )
      setActivity(combined)
      const serials = combined.map(a => a.nftSerialId).filter(Boolean)
      if (serials.length > 0) {
        loadNFTImages(serials).then(map =>
          setNftImages(prev => new Map([...prev, ...map]))
        )
      }
    } catch { /* show empty */ } finally {
      setLoadingActivity(false)
      setActivityLoaded(true)
    }
  }

  const fetchStats = async (period: 7 | 30 | 90 = statsPeriod) => {
    setLoadingStats(true)
    try {
      const end = new Date()
      const start = new Date(end.getTime() - period * 86400000)
      const fmt = (d: Date) => d.toISOString().split('T')[0]
      const base = `/api/market-stats?startDate=${fmt(start)}&endDate=${fmt(end)}`
      const first = await fetch(`${base}&page=1`).then(r => r.json())
      const allData: StatRecord[] = [...(first.data || [])]
      const totalRecords: number = first.totalRecords || 0
      if (totalRecords > 500) {
        const extraPages = Math.ceil((totalRecords - 500) / 500)
        const rest = await Promise.all(
          Array.from({ length: extraPages }, (_, i) =>
            fetch(`${base}&page=${i + 2}`).then(r => r.json()).then(d => d.data || [])
          )
        )
        rest.forEach(page => allData.push(...page))
      }
      const records = allData.filter((rec: StatRecord) => rec.token === '0.0.9474754')
      setStats(records)
    } catch { /* show empty */ } finally {
      setLoadingStats(false)
      setStatsLoaded(true)
    }
  }

  // Close modal on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedListing(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Initial load
  useEffect(() => {
    fetchListings()
    fetchFloor()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when sort changes (skip on mount — covered above)
  // Rarity sorts are client-side only — no re-fetch needed
  const isFirstRender = useState(true)
  useEffect(() => {
    if (isFirstRender[0]) { isFirstRender[1](false); return }
    if (!marketSort.startsWith('rarity')) fetchListings(marketSort)
  }, [marketSort]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy-load tab data
  useEffect(() => {
    if (tab === 'activity' && !activityLoaded) fetchActivity()
    if (tab === 'stats' && !statsLoaded) fetchStats()
  }, [tab, isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch stats when period changes
  useEffect(() => {
    if (tab === 'stats') {
      setStatsLoaded(false)
      fetchStats(statsPeriod)
    }
  }, [statsPeriod]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Transaction helpers ─────────────────────────────────────────────────────

  const getSigner = () => {
    if (!dAppConnector) return null
    return (
      dAppConnector.signers.find(s => s.getAccountId().toString() === accountId) ??
      dAppConnector.signers[0] ??
      null
    )
  }

  const execTx = async (txBytesData: number[]) => {
    const signer = getSigner()
    if (!signer) throw new Error('Wallet signer not available — please reconnect')
    const tx = Transaction.fromBytes(Uint8Array.from(txBytesData))
    await tx.executeWithSigner(signer)
  }

  const resetTx = () => {
    setTxStatus('idle')
    setTxMsg('')
    setSuccessMsg('')
    setActiveTxSerial(null)
  }

  // ── Buy ─────────────────────────────────────────────────────────────────────

  const handleBuy = async (listing: Listing) => {
    if (!isConnected || !accountId) return
    setActiveTxSerial(listing.serialId)
    setTxStatus('preparing')
    setTxMsg('Preparing purchase...')
    setSuccessMsg('')
    try {
      const r = await fetch('/api/market-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_address: SLIME_TOKEN,
          serial_number: String(listing.serialId),
          user_address: accountId,
          price: String(listing.salePrice),
        }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.apimessage || d.error || 'Failed to prepare purchase')

      setTxStatus('signing')
      setTxMsg('Approve the transaction in your wallet...')
      await execTx(d.transBytes.data)

      setTxStatus('confirming')
      setTxMsg('Confirming purchase...')
      const resR = await fetch(`/api/market-buy-res?saleVerificationCode=${encodeURIComponent(d.saleVerificationCode)}`)
      const resD = await resR.json()
      if (!resD.success) throw new Error(resD.apimessage || resD.error || 'Purchase confirmation failed')

      setTxStatus('success')
      setSuccessMsg(`You bought SLIME #${listing.serialId} for ${listing.salePrice.toLocaleString()} ℏ!`)
      fetchListings()
    } catch (err) {
      setTxStatus('error')
      setTxMsg(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setActiveTxSerial(null)
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const isTxBusy = txStatus === 'preparing' || txStatus === 'signing' || txStatus === 'confirming'

  // Trait counts across all 1000 NFTs — used for rarity color coding in the modal
  // Keys are lowercased so capitalisation variants merge into one count (same fix as Crown/Ice Cream)
  const traitCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {}
    for (const nft of allNftData.values()) {
      for (const attr of nft.attributes) {
        if (!counts[attr.trait_type]) counts[attr.trait_type] = {}
        const key = attr.value.toLowerCase()
        counts[attr.trait_type][key] = (counts[attr.trait_type][key] || 0) + 1
      }
    }
    return counts
  }, [allNftData])

  // Client-side rarity sort — applied on top of the API-fetched listings
  const sortedListings = useMemo(() => {
    if (marketSort === 'rarity-asc') {
      return [...listings].sort((a, b) => {
        const rankA = allNftData.get(a.serialId)?.correctedRank ?? 9999
        const rankB = allNftData.get(b.serialId)?.correctedRank ?? 9999
        return rankA - rankB
      })
    }
    if (marketSort === 'rarity-desc') {
      return [...listings].sort((a, b) => {
        const rankA = allNftData.get(a.serialId)?.correctedRank ?? 0
        const rankB = allNftData.get(b.serialId)?.correctedRank ?? 0
        return rankB - rankA
      })
    }
    return listings
  }, [listings, marketSort, allNftData])

  const MARKET_SORT_OPTIONS: { value: 'price-asc' | 'price-desc' | 'rarity-asc' | 'rarity-desc' | 'serial-asc' | 'serial-desc'; label: string }[] = [
    { value: 'price-asc',   label: 'PRICE ASC'   },
    { value: 'price-desc',  label: 'PRICE DESC'  },
    { value: 'rarity-asc',  label: 'RARITY ASC'  },
    { value: 'rarity-desc', label: 'RARITY DESC' },
    { value: 'serial-asc',  label: 'SERIAL ASC'  },
    { value: 'serial-desc', label: 'SERIAL DESC' },
  ]

  const tabs: { id: Tab; label: string }[] = [
    { id: 'listings', label: 'Listings' },
    { id: 'activity', label: 'Activity' },
    { id: 'stats', label: 'Stats' },
  ]

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#2a2a2a] flex flex-col">
      <Navigation />

      <main className="flex-1 px-4 py-20 max-w-7xl mx-auto w-full">

        {/* ── Page header ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">SLIME MARKET</h1>
            <p className="text-gray-500 text-sm mt-1">Buy, sell, and trade SLIME NFTs · Powered by SentX</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {floor !== null && (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-widest">Floor</span>
                <span className="text-slime-green font-mono font-bold">{floor.toLocaleString()} ℏ</span>
              </div>
            )}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Listed</span>
              <span className="text-white font-mono font-bold">{listings.length}</span>
            </div>
            {!isConnected && (
              <button
                onClick={() => connect().catch(() => {})}
                className="bg-slime-green text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition"
              >
                CONNECT WALLET
              </button>
            )}
          </div>
        </div>

        {/* ── Transaction status banner ── */}
        {txStatus !== 'idle' && (
          <div className={`mb-6 rounded-xl px-4 py-3.5 flex items-center gap-3 ${
            isTxBusy
              ? 'bg-[#1a1a1a] border border-gray-700'
              : txStatus === 'success'
              ? 'bg-slime-green/10 border border-slime-green/30'
              : 'bg-red-400/10 border border-red-400/20'
          }`}>
            {isTxBusy && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slime-green flex-shrink-0" />
            )}
            <p className={`text-sm flex-1 ${
              txStatus === 'success' ? 'text-slime-green' :
              txStatus === 'error' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {txStatus === 'success' ? successMsg : txMsg}
            </p>
            {(txStatus === 'success' || txStatus === 'error') && (
              <button onClick={resetTx} className="text-gray-600 hover:text-gray-400 ml-auto text-lg leading-none">×</button>
            )}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-0 mb-8 border-b border-gray-800">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${
                tab === t.id
                  ? 'text-white border-slime-green'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════ LISTINGS ════════════════════ */}
        {tab === 'listings' && (
          <>
            {/* Sort bar — matches collection page style */}
            <div className="flex items-center gap-2 flex-wrap mb-6">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mr-1">Sort</span>
              {MARKET_SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMarketSort(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition ${
                    marketSort === opt.value
                      ? 'bg-slime-green text-black'
                      : 'bg-[#1f1f1f] border border-gray-700 text-gray-300 hover:border-slime-green'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {loadingListings && (
              <div className="flex items-center justify-center h-72">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
              </div>
            )}

            {!loadingListings && sortedListings.length === 0 && (
              <div className="text-center py-32 text-gray-500">
                <p className="text-lg font-bold text-white mb-2">No listings found</p>
                <p className="text-sm">Be the first to list a SLIME NFT.</p>
              </div>
            )}

            {!loadingListings && sortedListings.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {sortedListings.map(listing => {
                  const isThisBusy = isTxBusy && activeTxSerial === listing.serialId
                  const isOwn = listing.sellerAddress === accountId

                  return (
                    <div
                      key={listing.marketplaceListingId}
                      className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden flex flex-col hover:border-gray-600 transition group"
                    >
                      {/* NFT image */}
                      <div className="aspect-square bg-black/40 relative overflow-hidden">
                        <img
                          src={nftImages.get(listing.serialId) ?? '/Assets/SPLAT.png'}
                          alt={listing.nftName || `SLIME #${listing.serialId}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          crossOrigin="anonymous"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/Assets/SPLAT.png' }}
                        />
                        {/* Serial badge */}
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                          <span className="text-gray-300 text-xs font-mono">#{listing.serialId}</span>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-3 flex flex-col gap-2.5 flex-1">
                        <p className="text-white text-xs font-bold truncate leading-tight">
                          {listing.nftName || `SLIME #${listing.serialId}`}
                        </p>
                        <p className="text-slime-green font-mono font-black text-base leading-none">
                          {listing.salePrice.toLocaleString()}
                          <span className="text-slime-green text-sm ml-0.5">ℏ</span>
                        </p>

                        <button
                          onClick={() => setSelectedListing(listing)}
                          className="mt-auto w-full bg-slime-green text-black py-2 rounded-xl font-bold text-xs hover:bg-[#00cc33] transition"
                        >
                          VIEW
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ════════════════════ ACTIVITY ════════════════════ */}
        {tab === 'activity' && (
          <>
            {loadingActivity && (
              <div className="flex items-center justify-center h-72">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
              </div>
            )}

            {!loadingActivity && activity.length === 0 && (
              <div className="text-center py-32 text-gray-500">
                <p className="text-lg font-bold text-white mb-2">No activity yet</p>
                <p className="text-sm">Recent sales and listings will appear here.</p>
              </div>
            )}

            {!loadingActivity && activity.length > 0 && (
              <div className="flex flex-col gap-2">
                {activity.map((a, i) => (
                  <div
                    key={i}
                    className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-4 flex items-center gap-4 hover:border-gray-700 transition"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-gray-800">
                      <img
                        src={nftImages.get(a.nftSerialId) ?? '/Assets/$SLIME.png'}
                        alt={a.nftName || 'SLIME'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{a.nftName}</p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        #{a.nftSerialId} · {shortAddr(a.sellerAddress)}
                        {a.buyerAddress && ` → ${shortAddr(a.buyerAddress)}`}
                      </p>
                    </div>

                    {/* Price + meta */}
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                      <p className="text-slime-green font-mono font-black text-base">
                        {a.salePrice.toLocaleString()} ℏ
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          a.saletype === 'Sale'
                            ? 'bg-slime-green/20 text-slime-green'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {a.saletype}
                        </span>
                        <span className="text-xs text-gray-600">{timeAgo(a.saleDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════════════ STATS ════════════════════ */}
        {tab === 'stats' && (
          <>
            {/* Period picker */}
            <div className="flex items-center gap-2 mb-8">
              <span className="text-xs text-gray-500 uppercase tracking-widest mr-1">Period</span>
              {([7, 30, 90] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setStatsPeriod(p)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                    statsPeriod === p
                      ? 'bg-slime-green text-black'
                      : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {p}D
                </button>
              ))}
            </div>

            {loadingStats && (
              <div className="flex items-center justify-center h-72">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
              </div>
            )}

            {!loadingStats && stats.length === 0 && (
              <div className="text-center py-32 text-gray-500">
                <p className="text-lg font-bold text-white mb-2">No data available</p>
                <p className="text-sm">No trade activity found for this period.</p>
              </div>
            )}

            {!loadingStats && stats.length > 0 && (() => {
              const totalVolume = stats.reduce((s, r) => s + (r.volume || 0), 0)
              const totalSales = stats.reduce((s, r) => s + (r.sales || 0), 0)
              const avgSale = totalSales > 0 ? Math.round(totalVolume / totalSales) : 0
              const maxSale = Math.max(...stats.map(r => r.maxSale || 0))
              const minPrices = stats.map(r => r.minSale).filter(v => v > 0)
              const minSale = minPrices.length > 0 ? Math.min(...minPrices) : 0
              const latestFloor = stats[0]?.floor ?? floor

              const cards = [
                { label: 'Total Volume', value: totalVolume.toLocaleString(), suffix: 'ℏ', highlight: true },
                { label: 'Total Sales', value: totalSales.toLocaleString(), suffix: null, highlight: false },
                { label: 'Avg Sale Price', value: avgSale.toLocaleString(), suffix: 'ℏ', highlight: false },
                { label: 'Highest Sale', value: maxSale.toLocaleString(), suffix: 'ℏ', highlight: false },
                { label: 'Lowest Sale', value: minSale > 0 ? minSale.toLocaleString() : '—', suffix: minSale > 0 ? 'ℏ' : null, highlight: false },
                { label: 'Floor Price', value: latestFloor != null ? latestFloor.toLocaleString() : '—', suffix: latestFloor != null ? 'ℏ' : null, highlight: false },
              ]

              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {cards.map(card => (
                    <div key={card.label} className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5 flex flex-col gap-2">
                      <span className="text-xs text-gray-500 uppercase tracking-widest">{card.label}</span>
                      <p className={`font-mono font-black text-2xl leading-none ${card.highlight ? 'text-slime-green' : 'text-white'}`}>
                        {card.value}
                        {card.suffix && <span className="text-base ml-1">{card.suffix}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {!loadingStats && (
              <p className="text-xs text-gray-600 mt-6 text-center">
                Stats for the last {statsPeriod} days · Powered by SentX
              </p>
            )}
          </>
        )}

      </main>

      <Footer />

      {/* ── NFT Detail Modal ── */}
      {selectedListing && (() => {
        const listing = selectedListing
        const nftFull = allNftData.get(listing.serialId)
        const imgSrc = nftImages.get(listing.serialId) ?? '/Assets/SPLAT.png'
        const totalSupply = allNftData.size || 1
        const isOwn = listing.sellerAddress === accountId
        const isThisBusy = isTxBusy && activeTxSerial === listing.serialId
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedListing(null)}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative z-10 bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Close */}
              <button onClick={() => setSelectedListing(null)} className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-[#2a2a2a] border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition">✕</button>

              {/* Top row — image + details */}
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/5 flex-shrink-0">
                  <div className="aspect-square bg-[#252525] rounded-t-2xl md:rounded-tl-2xl md:rounded-tr-none md:rounded-bl-none p-6 flex items-center justify-center">
                    <img src={imgSrc} alt={listing.nftName} className="w-full h-full object-contain" crossOrigin="anonymous" onError={e => { (e.target as HTMLImageElement).src = '/Assets/SPLAT.png' }} />
                  </div>
                </div>
                <div className="flex-1 p-6 space-y-5">
                  <div>
                    <h2 className="text-2xl font-black">{listing.nftName || `SLIME #${listing.serialId}`}</h2>
                    <p className="text-gray-500 text-sm mt-1">Hedera NFT · SLIME Collection</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Details</h3>
                    <div className="bg-[#252525] rounded-xl divide-y divide-gray-800">
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-gray-400 text-sm">SLIME ID</span>
                        <span className="text-white font-bold">#{listing.serialId}</span>
                      </div>
                      {nftFull && (
                        <>
                          <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-gray-400 text-sm">Rarity Rank</span>
                            <span className={`font-bold ${rankColor(nftFull.correctedRank)}`}>#{nftFull.correctedRank} <span className="text-gray-500 font-normal">/ {totalSupply}</span></span>
                          </div>
                          <div className="flex justify-between items-center px-4 py-3">
                            <span className="text-gray-400 text-sm">Rarity Score</span>
                            <span className="text-white font-bold">{(nftFull.correctedRarity * 100).toFixed(2)}%</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center px-4 py-3">
                        <span className="text-gray-400 text-sm">List Price</span>
                        <span className="text-slime-green font-bold font-mono">{listing.salePrice.toLocaleString()} ℏ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traits — full width */}
              {nftFull && nftFull.attributes.length > 0 && (
                <div className="px-6 pb-4 pt-2 border-t border-gray-800">
                  <div className="flex justify-between items-center py-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Traits</h3>
                    <span className="text-xs text-gray-600">{nftFull.attributes.length} traits</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {nftFull.attributes.map(attr => {
                      const count = traitCounts[attr.trait_type]?.[attr.value.toLowerCase()] ?? 0
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
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${pillColor}`}>{count.toLocaleString()}</span>
                            <span className="text-gray-500 text-xs">{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* BUY action */}
              <div className="px-6 pb-6 pt-2">
                {isOwn ? (
                  <div className="text-center text-sm text-gray-500 py-3 border border-gray-800 rounded-xl">Your listing</div>
                ) : isConnected ? (
                  <button
                    onClick={() => { handleBuy(listing); setSelectedListing(null) }}
                    disabled={isTxBusy}
                    className="w-full bg-slime-green text-black py-3 rounded-xl font-black text-sm hover:bg-[#00cc33] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isThisBusy ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block w-4 h-4 border-b-2 border-black rounded-full animate-spin" />
                        BUYING...
                      </span>
                    ) : `BUY NOW — ${listing.salePrice.toLocaleString()} ℏ`}
                  </button>
                ) : (
                  <button onClick={() => { connect().catch(() => {}); setSelectedListing(null) }} className="w-full border border-slime-green text-slime-green py-3 rounded-xl font-black text-sm hover:bg-slime-green hover:text-black transition">
                    CONNECT WALLET TO BUY
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
