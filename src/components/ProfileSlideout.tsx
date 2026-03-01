import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ProfileSlideout({ open, onClose }: Props) {
  const { accountId, slimeNFTs, slimeTokenBalance, disconnect } = useWallet()
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
        className={`fixed top-0 right-0 h-full w-full md:w-72 bg-[#1a1a1a] border-l border-gray-800 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
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
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Connected</p>
            <p className="text-slime-green font-mono text-sm truncate">{accountId}</p>
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
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link
            to="/inventory"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition"
          >
            <svg className="w-4 h-4 text-slime-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H7m12 0l-4-4m4 4l-4 4M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-wider">Inventory</span>
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
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 cursor-not-allowed select-none">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-sm font-bold uppercase tracking-wider">Domains</span>
            <span className="ml-auto text-xs bg-gray-800/80 text-gray-600 px-2 py-0.5 rounded-full">SOON</span>
          </div>

          {/* Mobile-only nav links — hidden on desktop where they live in the header */}
          <div className="md:hidden">
            <Link to="/home" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition">
              <svg className="w-4 h-4 text-slime-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm font-bold uppercase tracking-wider">Home</span>
            </Link>
            <Link to="/mint" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition">
              <svg className="w-4 h-4 text-slime-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-bold uppercase tracking-wider">Mint</span>
            </Link>
            <Link to="/market" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition">
              <svg className="w-4 h-4 text-slime-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-bold uppercase tracking-wider">Market</span>
            </Link>
            <Link to="/collection" onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition">
              <svg className="w-4 h-4 text-slime-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-sm font-bold uppercase tracking-wider">Collection</span>
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 cursor-not-allowed select-none">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span className="text-sm font-bold uppercase tracking-wider">$SLIME</span>
            </div>
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
