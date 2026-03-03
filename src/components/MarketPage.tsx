import { useState, useEffect } from 'react'
import { Transaction } from '@hashgraph/sdk'
import { useWallet } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

const SLIME_TOKEN = '0.0.9474754'
const MIRROR = 'https://mainnet-public.mirrornode.hedera.com'
const IPFS_GATEWAY = (import.meta.env.VITE_IPFS_GATEWAY as string) || 'https://ipfs.io/ipfs/'

// Converts any IPFS image URL to a public HTTP URL.
// Handles both ipfs:// URIs and private Pinata dedicated gateway URLs
// (e.g. *.mypinata.cloud) since SentX stores images in mixed formats.
function ipfsToHttp(url: string): string {
  if (!url) return ''
  // Rewrite private Pinata dedicated gateway to the public gateway
  const pinataIdx = url.indexOf('.mypinata.cloud/ipfs/')
  if (pinataIdx !== -1) {
    return IPFS_GATEWAY + url.slice(pinataIdx + '.mypinata.cloud/ipfs/'.length)
  }
  if (!url.startsWith('ipfs://')) return url
  const raw = url.replace('ipfs://', IPFS_GATEWAY)
  const slash = raw.lastIndexOf('/')
  return raw.substring(0, slash + 1) + raw.substring(slash + 1).replace(/#/g, '%23')
}

// Fetches images from /api/nft-images (SentX-backed, server-side cached).
// The endpoint now builds its serialMap using parallel page fetches so
// cold-start latency is ~1–2 s instead of 10+ s.
async function loadNFTImages(serials: number[]): Promise<Map<number, string>> {
  const apiKey = import.meta.env.VITE_SENTX_API_KEY as string
  if (!apiKey || serials.length === 0) return new Map()
  try {
    const r = await fetch(
      `/api/nft-images?apikey=${apiKey}&token=${SLIME_TOKEN}&serials=${serials.join(',')}`
    )
    if (!r.ok) return new Map()
    const d = await r.json()
    if (!d.success) return new Map()
    const map = new Map<number, string>()
    for (const [serial, info] of Object.entries(
      d.nfts as Record<string, { image: string; name: string }>
    )) {
      if (info?.image) map.set(Number(serial), ipfsToHttp(info.image))
    }
    return map
  } catch {
    return new Map()
  }
}

// Loads images in sequential batches of 50 (mirrors CollectionPage's 50-at-a-time
// approach) so the first images appear quickly and the rest fill in progressively.
async function loadImagesBatched(
  serials: number[],
  onBatch: (map: Map<number, string>) => void
) {
  const BATCH = 50
  for (let i = 0; i < serials.length; i += BATCH) {
    const map = await loadNFTImages(serials.slice(i, i + BATCH))
    if (map.size > 0) onBatch(map)
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

interface Offer {
  buyerAccount: string
  sellerAccount: string
  offeredPrice: number
  offerDate: string
  statusName: string
  listedPrice: number
  serialId: number
}

interface MirrorNFT {
  serial_number: number
}

type Tab = 'listings' | 'activity' | 'offers' | 'mylistings'
type TxStatus = 'idle' | 'preparing' | 'signing' | 'confirming' | 'success' | 'error'

// ── Component ─────────────────────────────────────────────────────────────────

export default function MarketPage() {
  const { isConnected, accountId, dAppConnector, connect } = useWallet()

  const [tab, setTab] = useState<Tab>('listings')

  // Listings
  const [listings, setListings] = useState<Listing[]>([])
  const [floor, setFloor] = useState<number | null>(null)
  const [loadingListings, setLoadingListings] = useState(true)
  const [sortBy, setSortBy] = useState<'price' | 'listingDate' | 'serialId'>('price')
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('ASC')

  // NFT images keyed by serial — populated from mirror node since SentX
  // listings often have null nftImage for SLIME NFTs
  const [nftImages, setNftImages] = useState<Map<number, string>>(new Map())

  // Activity
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [activityLoaded, setActivityLoaded] = useState(false)

  // Offers
  const [offers, setOffers] = useState<Offer[]>([])
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [offersLoaded, setOffersLoaded] = useState(false)

  // My Listings
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myNFTs, setMyNFTs] = useState<MirrorNFT[]>([])
  const [loadingMine, setLoadingMine] = useState(false)
  const [listSerial, setListSerial] = useState('')
  const [listPrice, setListPrice] = useState('')

  // Transaction state
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [txMsg, setTxMsg] = useState('')
  const [activeTxSerial, setActiveTxSerial] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchListings = async (sort = sortBy, dir = sortDir) => {
    setLoadingListings(true)
    try {
      const params = new URLSearchParams({ sortBy: sort, sortDirection: dir, limit: '100' })
      const r = await fetch(`/api/market-listings?${params}`)
      const d = await r.json()
      const items: Listing[] = d.marketListings || []
      setListings(items)
      if (items.length > 0) {
        loadImagesBatched(items.map(l => l.serialId), map =>
          setNftImages(prev => new Map([...prev, ...map]))
        )
      }
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
      const r = await fetch('/api/market-activity?amount=50&activityFilter=All')
      const d = await r.json()
      const items: ActivityItem[] = d.marketActivity || []
      setActivity(items)
      if (items.length > 0) {
        loadImagesBatched(items.map(a => a.nftSerialId), map =>
          setNftImages(prev => new Map([...prev, ...map]))
        )
      }
    } catch { /* show empty */ } finally {
      setLoadingActivity(false)
      setActivityLoaded(true)
    }
  }

  const fetchOffers = async () => {
    setLoadingOffers(true)
    try {
      const r = await fetch('/api/market-offers')
      const d = await r.json()
      setOffers(d.response || [])
    } catch { /* show empty */ } finally {
      setLoadingOffers(false)
      setOffersLoaded(true)
    }
  }

  const fetchMine = async () => {
    if (!accountId) return
    setLoadingMine(true)
    try {
      const [listRes, mirrorNFTs] = await Promise.all([
        fetch(`/api/market-listings?filterUserAccount=${accountId}&limit=100`).then(r => r.json()),
        fetchWalletNFTs(),
      ])
      const myItems: Listing[] = listRes.marketListings || []
      setMyListings(myItems)
      setMyNFTs(mirrorNFTs)
      if (myItems.length > 0) {
        loadImagesBatched(myItems.map(l => l.serialId), map =>
          setNftImages(prev => new Map([...prev, ...map]))
        )
      }
    } catch { /* show empty */ } finally {
      setLoadingMine(false)
    }
  }

  const fetchWalletNFTs = async (): Promise<MirrorNFT[]> => {
    const nfts: MirrorNFT[] = []
    let path: string | null = `/api/v1/accounts/${accountId}/nfts?token.id=${SLIME_TOKEN}&limit=100`
    while (path) {
      const r = await fetch(`${MIRROR}${path}`)
      if (!r.ok) break
      const d: { nfts: MirrorNFT[]; links?: { next?: string } } = await r.json()
      nfts.push(...(d.nfts || []))
      path = d.links?.next || null
    }
    return nfts
  }

  // Initial load
  useEffect(() => {
    fetchListings()
    fetchFloor()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when sort changes (skip on mount — covered above)
  const isFirstRender = useState(true)
  useEffect(() => {
    if (isFirstRender[0]) { isFirstRender[1](false); return }
    fetchListings(sortBy, sortDir)
  }, [sortBy, sortDir]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy-load tab data
  useEffect(() => {
    if (tab === 'activity' && !activityLoaded) fetchActivity()
    if (tab === 'offers' && !offersLoaded) fetchOffers()
    if (tab === 'mylistings' && isConnected) fetchMine()
  }, [tab, isConnected]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── List ────────────────────────────────────────────────────────────────────

  const handleList = async () => {
    if (!isConnected || !accountId || !listSerial || !listPrice) return
    setTxStatus('preparing')
    setTxMsg('Preparing listing...')
    setSuccessMsg('')
    try {
      const r = await fetch('/api/market-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial_number: listSerial, price: listPrice, user_address: accountId }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.apimessage || d.error || 'Failed to prepare listing')

      setTxStatus('signing')
      setTxMsg('Approve the allowance in your wallet...')
      await execTx(d.transBytes.data)

      setTxStatus('confirming')
      setTxMsg('Confirming listing...')
      const resR = await fetch(`/api/market-list-res?saleVerificationCode=${encodeURIComponent(d.saleVerificationCode)}`)
      const resD = await resR.json()
      if (!resD.success) throw new Error(resD.apimessage || resD.error || 'Listing confirmation failed')

      setTxStatus('success')
      setSuccessMsg(`SLIME #${listSerial} listed for ${Number(listPrice).toLocaleString()} ℏ!`)
      setListSerial('')
      setListPrice('')
      fetchMine()
    } catch (err) {
      setTxStatus('error')
      setTxMsg(err instanceof Error ? err.message : 'Listing failed')
    }
  }

  // ── Unlist ──────────────────────────────────────────────────────────────────

  const handleUnlist = async (serial: number) => {
    if (!isConnected || !accountId) return
    setActiveTxSerial(serial)
    setTxStatus('preparing')
    setTxMsg('Preparing unlist...')
    setSuccessMsg('')
    try {
      const r = await fetch('/api/market-unlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial_number: String(serial), user_address: accountId }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.apimessage || d.error || 'Failed to prepare unlist')

      setTxStatus('signing')
      setTxMsg('Approve the unlist in your wallet...')
      await execTx(d.transBytes.data)

      setTxStatus('confirming')
      setTxMsg('Confirming unlist...')
      const resR = await fetch(`/api/market-unlist-res?saleVerificationCode=${encodeURIComponent(d.saleVerificationCode)}`)
      const resD = await resR.json()
      if (!resD.success) throw new Error(resD.apimessage || resD.error || 'Unlist confirmation failed')

      setTxStatus('success')
      setSuccessMsg(`SLIME #${serial} has been unlisted.`)
      fetchMine()
      fetchListings()
    } catch (err) {
      setTxStatus('error')
      setTxMsg(err instanceof Error ? err.message : 'Unlist failed')
    } finally {
      setActiveTxSerial(null)
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const isTxBusy = txStatus === 'preparing' || txStatus === 'signing' || txStatus === 'confirming'
  const listedSerials = new Set(myListings.map(l => l.serialId))
  const unlistedNFTs = myNFTs.filter(n => !listedSerials.has(n.serial_number))

  const tabs: { id: Tab; label: string }[] = [
    { id: 'listings', label: 'Listings' },
    { id: 'activity', label: 'Activity' },
    { id: 'offers', label: 'Offers' },
    ...(isConnected ? [{ id: 'mylistings' as Tab, label: 'My Listings' }] : []),
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
            {/* Sort bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-widest mr-1">Sort</span>
                {(['price', 'listingDate', 'serialId'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                      sortBy === s
                        ? 'bg-slime-green text-black'
                        : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {s === 'price' ? 'Price' : s === 'listingDate' ? 'Recent' : 'Serial'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(['ASC', 'DESC'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setSortDir(d)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                      sortDir === d
                        ? 'bg-slime-green text-black'
                        : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {d === 'ASC' ? '↑ Low' : '↓ High'}
                  </button>
                ))}
              </div>
            </div>

            {loadingListings && (
              <div className="flex items-center justify-center h-72">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
              </div>
            )}

            {!loadingListings && listings.length === 0 && (
              <div className="text-center py-32 text-gray-500">
                <p className="text-lg font-bold text-white mb-2">No listings found</p>
                <p className="text-sm">Be the first to list a SLIME NFT.</p>
              </div>
            )}

            {!loadingListings && listings.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {listings.map(listing => {
                  const isThisBusy = isTxBusy && activeTxSerial === listing.serialId
                  const isOwn = listing.sellerAddress === accountId

                  return (
                    <div
                      key={listing.marketplaceListingId}
                      className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden flex flex-col hover:border-gray-600 transition group"
                    >
                      {/* NFT image */}
                      <div className="aspect-square bg-black/40 relative overflow-hidden">
                        {nftImages.get(listing.serialId) ? (
                          <img
                            src={nftImages.get(listing.serialId)}
                            alt={listing.nftName || `SLIME #${listing.serialId}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/Assets/SPLAT.png' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">
                            Loading...
                          </div>
                        )}
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

                        {isConnected ? (
                          isOwn ? (
                            <div className="mt-auto text-center text-xs text-gray-600 py-2 border border-gray-800 rounded-xl">
                              Your listing
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBuy(listing)}
                              disabled={isTxBusy}
                              className="mt-auto w-full bg-slime-green text-black py-2 rounded-xl font-black text-xs hover:bg-[#00cc33] transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isThisBusy ? (
                                <span className="flex items-center justify-center gap-1.5">
                                  <span className="inline-block w-3 h-3 border-b-2 border-black rounded-full animate-spin" />
                                  BUYING
                                </span>
                              ) : 'BUY NOW'}
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => connect().catch(() => {})}
                            className="mt-auto w-full border border-gray-700 text-gray-500 py-2 rounded-xl font-bold text-xs hover:border-slime-green hover:text-slime-green transition"
                          >
                            CONNECT
                          </button>
                        )}
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
                      {nftImages.get(a.nftSerialId) ? (
                        <img
                          src={nftImages.get(a.nftSerialId)}
                          alt={a.nftName}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
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

        {/* ════════════════════ OFFERS ════════════════════ */}
        {tab === 'offers' && (
          <>
            {loadingOffers && (
              <div className="flex items-center justify-center h-72">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
              </div>
            )}

            {!loadingOffers && offers.length === 0 && (
              <div className="text-center py-32 text-gray-500">
                <p className="text-lg font-bold text-white mb-2">No active offers</p>
                <p className="text-sm">Offers on SLIME NFTs will appear here.</p>
              </div>
            )}

            {!loadingOffers && offers.length > 0 && (
              <div className="flex flex-col gap-2">
                {offers.map((o, i) => (
                  <div
                    key={i}
                    className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-4 flex items-center gap-4 hover:border-gray-700 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold">SLIME #{o.serialId}</p>
                      <p className="text-gray-600 text-xs mt-0.5">Buyer: {shortAddr(o.buyerAccount)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-slime-green font-mono font-black text-base">
                        {o.offeredPrice.toLocaleString()} ℏ
                      </p>
                      {o.listedPrice > 0 && (
                        <p className="text-gray-600 text-xs">Listed: {o.listedPrice.toLocaleString()} ℏ</p>
                      )}
                    </div>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full font-bold flex-shrink-0">
                      {o.statusName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════════════ MY LISTINGS ════════════════════ */}
        {tab === 'mylistings' && isConnected && (
          <>
            {loadingMine && (
              <div className="flex items-center justify-center h-72">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
              </div>
            )}

            {!loadingMine && (
              <div className="flex flex-col gap-10">

                {/* Active listings */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-white">Your Active Listings</h2>
                    <span className="text-xs text-gray-500">{myListings.length} listed</span>
                  </div>

                  {myListings.length === 0 ? (
                    <p className="text-gray-500 text-sm">You have no active listings.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {myListings.map(listing => {
                        const isThisBusy = isTxBusy && activeTxSerial === listing.serialId
                        return (
                          <div
                            key={listing.marketplaceListingId}
                            className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden flex flex-col"
                          >
                            <div className="aspect-square bg-black/40 relative overflow-hidden">
                              {nftImages.get(listing.serialId) ? (
                                <img
                                  src={nftImages.get(listing.serialId)}
                                  alt={listing.nftName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/Assets/SPLAT.png' }}
                                />
                              ) : null}
                              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                                <span className="text-gray-300 text-xs font-mono">#{listing.serialId}</span>
                              </div>
                            </div>
                            <div className="p-3 flex flex-col gap-2.5 flex-1">
                              <p className="text-white text-xs font-bold truncate">
                                {listing.nftName || `SLIME #${listing.serialId}`}
                              </p>
                              <p className="text-slime-green font-mono font-black text-base leading-none">
                                {listing.salePrice.toLocaleString()} ℏ
                              </p>
                              <button
                                onClick={() => handleUnlist(listing.serialId)}
                                disabled={isTxBusy}
                                className="mt-auto w-full bg-red-500/10 border border-red-500/30 text-red-400 py-2 rounded-xl font-bold text-xs hover:bg-red-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {isThisBusy ? (
                                  <span className="flex items-center justify-center gap-1.5">
                                    <span className="inline-block w-3 h-3 border-b-2 border-red-400 rounded-full animate-spin" />
                                    UNLISTING
                                  </span>
                                ) : 'UNLIST'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800" />

                {/* List a new NFT */}
                <div>
                  <h2 className="text-lg font-black text-white mb-5">List an NFT</h2>

                  {unlistedNFTs.length === 0 && myNFTs.length === 0 && (
                    <p className="text-gray-500 text-sm">No SLIME NFTs found in your wallet.</p>
                  )}
                  {unlistedNFTs.length === 0 && myNFTs.length > 0 && (
                    <p className="text-gray-500 text-sm">All your SLIME NFTs are already listed.</p>
                  )}

                  {unlistedNFTs.length > 0 && (
                    <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 max-w-sm">
                      <div className="flex flex-col gap-5">
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">
                            Select NFT
                          </label>
                          <select
                            value={listSerial}
                            onChange={e => setListSerial(e.target.value)}
                            className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-slime-green transition"
                          >
                            <option value="">Choose a serial number</option>
                            {unlistedNFTs.map(n => (
                              <option key={n.serial_number} value={String(n.serial_number)}>
                                SLIME #{n.serial_number}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">
                            List Price (ℏ)
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={listPrice}
                            onChange={e => setListPrice(e.target.value)}
                            placeholder="e.g. 500"
                            className="w-full bg-black/40 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-slime-green transition"
                          />
                        </div>

                        <button
                          onClick={handleList}
                          disabled={isTxBusy || !listSerial || !listPrice || parseFloat(listPrice) <= 0}
                          className="w-full bg-slime-green text-black py-3.5 rounded-xl font-black text-sm hover:bg-[#00cc33] transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isTxBusy && !activeTxSerial ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="inline-block w-4 h-4 border-b-2 border-black rounded-full animate-spin" />
                              LISTING...
                            </span>
                          ) : 'LIST NFT'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

      </main>

      <Footer />
    </div>
  )
}
