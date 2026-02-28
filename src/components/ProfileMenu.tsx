import { useState, useEffect, useRef } from 'react'
import { useWallet, PfpData, SocialInfo } from '../context/WalletContext'
import { decodeMetadata } from '../utils/nft'

type Tab = 'profile' | 'rewards' | 'swaps'

interface NFTWithImage {
  serial_number: number
  name: string
  imageUrl: string
}

export default function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [nftsWithImages, setNftsWithImages] = useState<NFTWithImage[]>([])
  const [loadingNFTs, setLoadingNFTs] = useState(false)
  const [editingSocial, setEditingSocial] = useState(false)
  const [socialDraft, setSocialDraft] = useState<SocialInfo>({ twitter: '', discord: '', bio: '' })
  const panelRef = useRef<HTMLDivElement>(null)

  const {
    accountId, slimeNFTs, slimeTokenBalance,
    pfp, socialInfo, disconnect, setPfp, setSocialInfo
  } = useWallet()

  // Load NFT images when profile tab opens
  useEffect(() => {
    if (open && activeTab === 'profile' && slimeNFTs.length > 0 && nftsWithImages.length === 0) {
      loadNFTImages()
    }
  }, [open, activeTab, slimeNFTs])

  // Reset NFT images if wallet changes
  useEffect(() => {
    setNftsWithImages([])
  }, [accountId])

  const loadNFTImages = async () => {
    setLoadingNFTs(true)
    const results: NFTWithImage[] = []

    await Promise.all(
      slimeNFTs.slice(0, 24).map(async (nft) => {
        if (nft.metadata) {
          const meta = await decodeMetadata(nft.metadata)
          if (meta) {
            results.push({
              serial_number: nft.serial_number,
              name: meta.name || `SLIME #${nft.serial_number}`,
              imageUrl: meta.image || ''
            })
          }
        }
      })
    )

    results.sort((a, b) => a.serial_number - b.serial_number)
    setNftsWithImages(results)
    setLoadingNFTs(false)
  }

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelectPfp = (nft: NFTWithImage) => {
    const data: PfpData = {
      serial_number: nft.serial_number,
      imageUrl: nft.imageUrl,
      name: nft.name
    }
    setPfp(data)
  }

  const truncateAccount = (id: string) => {
    if (!id) return ''
    const parts = id.split('.')
    return `${parts[0]}.${parts[1]}.${parts[2]}`
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-slime-green hover:border-[#00cc33] transition flex items-center justify-center bg-[#1f1f1f] flex-shrink-0"
        aria-label="Profile menu"
      >
        {pfp?.imageUrl ? (
          <img src={pfp.imageUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-5 h-5 text-slime-green" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 bg-[#1a1a1a] border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden">

          {/* Account Header */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Connected</p>
                <p className="text-slime-green font-mono text-sm">{truncateAccount(accountId)}</p>
              </div>
              <button
                onClick={() => { disconnect(); setOpen(false) }}
                className="text-xs text-gray-500 hover:text-red-400 transition font-medium"
              >
                DISCONNECT
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {(['profile', 'rewards', 'swaps'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === tab
                    ? 'text-slime-green border-b-2 border-slime-green'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-h-[70vh] overflow-y-auto">

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="p-5 space-y-5">

                {/* Holdings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-xl p-4 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">SLIME NFTs</p>
                    <p className="text-2xl font-black text-white">{slimeNFTs.length}</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">$SLIME</p>
                    <p className="text-2xl font-black text-white">{Number(slimeTokenBalance).toLocaleString()}</p>
                  </div>
                </div>

                {/* PFP Selector */}
                {slimeNFTs.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Set Profile Picture</p>
                    {loadingNFTs ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slime-green"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {pfp && (
                          <button
                            onClick={() => setPfp(null)}
                            title="Remove PFP"
                            className="aspect-square rounded-lg bg-black/30 border-2 border-gray-700 hover:border-red-500 transition flex items-center justify-center text-gray-600 hover:text-red-400 text-xs font-bold"
                          >
                            NONE
                          </button>
                        )}
                        {nftsWithImages.map(nft => (
                          <button
                            key={nft.serial_number}
                            onClick={() => handleSelectPfp(nft)}
                            title={nft.name}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                              pfp?.serial_number === nft.serial_number
                                ? 'border-slime-green ring-1 ring-slime-green'
                                : 'border-gray-700 hover:border-slime-green/50'
                            }`}
                          >
                            {nft.imageUrl ? (
                              <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-600">
                                #{nft.serial_number}
                              </div>
                            )}
                          </button>
                        ))}
                        {nftsWithImages.length === 0 && !loadingNFTs && (
                          <p className="col-span-4 text-xs text-gray-600">Loading your NFTs...</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Social Info */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Social</p>
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
                        rows={2}
                        className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-slime-green focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
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
                          <span className="text-gray-600 text-xs">X</span>
                          <span>@{socialInfo.twitter}</span>
                        </div>
                      )}
                      {socialInfo.discord && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="text-gray-600 text-xs">Discord</span>
                          <span>{socialInfo.discord}</span>
                        </div>
                      )}
                      {socialInfo.bio && (
                        <p className="text-sm text-gray-400">{socialInfo.bio}</p>
                      )}
                      {!socialInfo.twitter && !socialInfo.discord && !socialInfo.bio && (
                        <p className="text-xs text-gray-600">No social info added yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REWARDS TAB */}
            {activeTab === 'rewards' && (
              <div className="p-5">
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-slime-green/10 border border-slime-green/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-slime-green/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-400 mb-2">REWARDS COMING SOON</p>
                  <p className="text-xs text-gray-600 max-w-48 mx-auto">Staking rewards will appear here once configured on SLIME Tools.</p>
                </div>
              </div>
            )}

            {/* SWAPS TAB */}
            {activeTab === 'swaps' && (
              <div className="p-5">
                <div className="text-center py-8">
                  <p className="text-xs text-gray-600 mb-5 max-w-48 mx-auto">Configured swaps from SLIME Tools will appear here automatically.</p>
                  <a
                    href="/swap"
                    onClick={() => setOpen(false)}
                    className="inline-block bg-slime-green text-black px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#00cc33] transition"
                  >
                    GO TO SWAP
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
