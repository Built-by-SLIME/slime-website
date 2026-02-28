import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ProfileSlideout({ open, onClose }: Props) {
  const { accountId, slimeNFTs, slimeTokenBalance, pfp, disconnect } = useWallet()
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-72 bg-[#1a1a1a] border-l border-gray-800 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
          <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">SLIME</span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Account Info */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-slime-green flex-shrink-0 bg-[#1f1f1f] flex items-center justify-center">
              {pfp?.imageUrl ? (
                <img src={pfp.imageUrl} alt="PFP" className="w-full h-full object-cover" style={{ objectPosition: 'center 65%' }} />
              ) : (
                <svg className="w-5 h-5 text-slime-green" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Connected</p>
              <p className="text-slime-green font-mono text-sm truncate">{accountId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="flex-1 text-center bg-black/40 rounded-lg px-2 py-2 text-xs text-gray-400">
              <span className="block text-white font-bold text-base">{slimeNFTs.length}</span>
              NFTs
            </span>
            <span className="flex-1 text-center bg-black/40 rounded-lg px-2 py-2 text-xs text-gray-400">
              <span className="block text-white font-bold text-base">{Number(slimeTokenBalance).toLocaleString()}</span>
              $SLIME
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition"
          >
            <svg className="w-4 h-4 text-slime-green flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-wider">Profile</span>
          </Link>
          <Link
            to="/swap"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition"
          >
            <svg className="w-4 h-4 text-slime-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-wider">Swaps</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 cursor-not-allowed select-none">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-wider">Rewards</span>
            <span className="ml-auto text-xs bg-gray-800/80 text-gray-600 px-2 py-0.5 rounded-full">SOON</span>
          </div>
        </nav>

        {/* Disconnect */}
        <div className="px-5 py-5 border-t border-gray-800">
          <button
            onClick={() => { disconnect(); onClose() }}
            className="w-full text-xs text-gray-500 hover:text-red-400 transition font-bold uppercase tracking-wider py-2"
          >
            Disconnect Wallet
          </button>
        </div>
      </div>
    </>
  )
}
