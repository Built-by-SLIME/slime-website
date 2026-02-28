import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import type { PfpData, SocialInfo } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

interface NFTWithImage {
  serial_number: number
  name: string
  imageUrl: string
  rank?: number
}

export default function ProfilePage() {
  const {
    isConnected, accountId, slimeNFTs, slimeTokenBalance,
    pfp, socialInfo, connect, disconnect, setPfp, setSocialInfo
  } = useWallet()

  const [nftsWithImages, setNftsWithImages] = useState<NFTWithImage[]>([])
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [editingSocial, setEditingSocial] = useState(false)
  const [socialDraft, setSocialDraft] = useState<SocialInfo>({ twitter: '', discord: '', bio: '' })
  const [expandedNFT, setExpandedNFT] = useState<NFTWithImage | null>(null)

  useEffect(() => {
    if (isConnected && slimeNFTs.length > 0) {
      loadNFTImages()
    }
    if (!isConnected) {
      setNftsWithImages([])
    }
  }, [isConnected, slimeNFTs])

  // Close modal on Escape
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

  const handleSelectPfp = (nft: NFTWithImage) => {
    const data: PfpData = { serial_number: nft.serial_number, imageUrl: nft.imageUrl, name: nft.name }
    setPfp(data)
  }

  // Not connected — show connect prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#2a2a2a] text-white flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-20">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full border-2 border-gray-700 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black mb-3">YOUR PROFILE</h1>
            <p className="text-gray-500 text-sm mb-8">
              Connect your wallet to manage your SLIME profile, set your PFP, and more.
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

        {/* Profile Hero */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-slime-green flex-shrink-0 bg-[#1f1f1f] flex items-center justify-center">
            {pfp?.imageUrl ? (
              <img src={pfp.imageUrl} alt="Profile" className="w-full h-full object-cover" style={{ objectPosition: 'center 65%' }} />
            ) : (
              <svg className="w-10 h-10 text-slime-green" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Connected Wallet</p>
            <p className="text-slime-green font-mono text-sm md:text-base font-bold truncate">{accountId}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-black/30 border border-gray-700 rounded-full px-3 py-1 text-gray-400">
                <span className="text-white font-bold">{slimeNFTs.length}</span> SLIME NFTs
              </span>
              <span className="text-xs bg-black/30 border border-gray-700 rounded-full px-3 py-1 text-gray-400">
                <span className="text-white font-bold">{Number(slimeTokenBalance).toLocaleString()}</span> $SLIME
              </span>
            </div>
          </div>
        </div>

        {/* NFT Gallery */}
        {slimeNFTs.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your NFTs</h2>
              <p className="text-xs text-gray-600">Click to view &amp; set PFP</p>
            </div>
            {loadingNFTs ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slime-green" />
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {nftsWithImages.map(nft => (
                  <button
                    key={nft.serial_number}
                    onClick={() => setExpandedNFT(nft)}
                    title={nft.name}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition hover:scale-105 ${
                      pfp?.serial_number === nft.serial_number
                        ? 'border-slime-green ring-2 ring-slime-green/30'
                        : 'border-gray-700 hover:border-slime-green/50'
                    }`}
                  >
                    {nft.imageUrl ? (
                      <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" style={{ objectPosition: 'center 65%' }} />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-600">
                        #{nft.serial_number}
                      </div>
                    )}
                    {pfp?.serial_number === nft.serial_number && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-slime-green text-black text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                        PFP
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

        {/* Social Info */}
        <div className="mb-10 bg-black/20 border border-gray-800 rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Social</h2>
            {!editingSocial && (
              <button
                onClick={() => { setEditingSocial(true); setSocialDraft({ ...socialInfo }) }}
                className="text-xs text-slime-green hover:underline"
              >
                EDIT
              </button>
            )}
          </div>
          {editingSocial ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Twitter / X handle"
                value={socialDraft.twitter}
                onChange={e => setSocialDraft(d => ({ ...d, twitter: e.target.value }))}
                className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-slime-green focus:outline-none"
              />
              <input
                type="text"
                placeholder="Discord handle"
                value={socialDraft.discord}
                onChange={e => setSocialDraft(d => ({ ...d, discord: e.target.value }))}
                className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-slime-green focus:outline-none"
              />
              <textarea
                placeholder="Bio"
                value={socialDraft.bio}
                onChange={e => setSocialDraft(d => ({ ...d, bio: e.target.value }))}
                rows={3}
                className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-slime-green focus:outline-none resize-none"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setSocialInfo(socialDraft); setEditingSocial(false) }}
                  className="flex-1 bg-slime-green text-black py-2 rounded-lg text-xs font-bold hover:bg-[#00cc33] transition"
                >
                  SAVE
                </button>
                <button
                  onClick={() => setEditingSocial(false)}
                  className="flex-1 bg-gray-800 text-gray-400 py-2 rounded-lg text-xs font-bold hover:bg-gray-700 transition"
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {socialInfo.twitter && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-gray-600 text-xs w-12">X</span>
                  <span>@{socialInfo.twitter}</span>
                </div>
              )}
              {socialInfo.discord && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-gray-600 text-xs w-12">Discord</span>
                  <span>{socialInfo.discord}</span>
                </div>
              )}
              {socialInfo.bio && (
                <p className="text-sm text-gray-400 pt-1">{socialInfo.bio}</p>
              )}
              {!socialInfo.twitter && !socialInfo.discord && !socialInfo.bio && (
                <p className="text-xs text-gray-600">No social info added yet.</p>
              )}
            </div>
          )}
        </div>

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
            {/* Close button */}
            <button
              onClick={() => setExpandedNFT(null)}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-gray-400 hover:text-white transition"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="aspect-square w-full bg-gray-900">
              {expandedNFT.imageUrl ? (
                <img src={expandedNFT.imageUrl} alt={expandedNFT.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                  #{expandedNFT.serial_number}
                </div>
              )}
            </div>

            {/* Info + actions */}
            <div className="p-4">
              <p className="text-white font-bold text-sm mb-0.5">{expandedNFT.name}</p>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-gray-500 text-xs">Serial #{expandedNFT.serial_number}</p>
                {expandedNFT.rank && (
                  <p className="text-xs text-slime-green font-bold">Rank #{expandedNFT.rank}</p>
                )}
              </div>

              {pfp?.serial_number === expandedNFT.serial_number ? (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center justify-center text-xs font-bold text-slime-green border border-slime-green/40 rounded-lg py-2.5">
                    CURRENT PFP
                  </div>
                  <button
                    onClick={() => { setPfp(null); setExpandedNFT(null) }}
                    className="flex-1 bg-gray-800 text-gray-400 py-2.5 rounded-lg text-xs font-bold hover:text-red-400 hover:bg-red-900/20 transition"
                  >
                    REMOVE
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { handleSelectPfp(expandedNFT); setExpandedNFT(null) }}
                  className="w-full bg-slime-green text-black py-2.5 rounded-lg text-xs font-bold hover:bg-[#00cc33] transition"
                >
                  SET AS PFP
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
