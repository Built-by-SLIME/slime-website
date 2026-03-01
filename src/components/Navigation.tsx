import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import ProfileSlideout from './ProfileSlideout'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [slideoutOpen, setSlideoutOpen] = useState(false)
  const { isConnected, pfp, connect } = useWallet()

  const handleConnect = async () => {
    try { await connect() } catch (err) { console.error('Connect failed:', err) }
  }

  return (
    <>
      {/* Navigation */}
      <nav className="relative flex justify-between items-center px-4 py-5 z-10" style={{ paddingLeft: undefined, paddingRight: undefined }}>
        <style>{`
          @media (min-width: 768px) {
            nav { padding-left: 76.5px !important; padding-right: 60px !important; }
          }
        `}</style>
        <div className="flex items-center md:mt-[4px]">
          <Link to="/">
            <img src="/Assets/SPLAT.png" alt="SLIME" className="h-auto w-8 md:w-9" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10" style={{ marginTop: '4px' }}>
          <div className="flex gap-10 text-sm font-medium">
            <Link to="/home" className="text-gray-300 hover:text-slime-green transition">HOME</Link>
            <Link to="/mint" className="text-gray-300 hover:text-slime-green transition">MINT</Link>
            <Link to="/market" className="text-gray-300 hover:text-slime-green transition">MARKET</Link>
            <a href="https://slime.tools/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">TOOLS</a>
            <Link to="/collection" className="text-gray-300 hover:text-slime-green transition">COLLECTION</Link>
            <span className="text-gray-600 cursor-not-allowed select-none">$SLIME</span>
          </div>
          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a href="https://github.com/Built-by-SLIME" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="https://x.com/builtbyslime" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://discord.gg/8X9PvNFyzK" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
          {/* Desktop: Connect button or PFP avatar → slideout */}
          {isConnected ? (
            <button
              onClick={() => setSlideoutOpen(true)}
              className="w-11 h-11 rounded-full overflow-hidden border-2 border-slime-green hover:border-[#00cc33] transition flex items-center justify-center bg-[#1f1f1f] flex-shrink-0"
              aria-label="Open profile"
            >
              {pfp?.imageUrl ? (
                <img src={pfp.imageUrl} alt="Profile" className="w-full h-full object-cover" style={{ objectPosition: 'center 75%', transform: 'scale(1.5)', transformOrigin: 'center 75%' }} />
              ) : (
                <svg className="w-5 h-5 text-slime-green" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              )}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="bg-slime-green text-black px-5 py-2 rounded-md font-bold text-xs hover:bg-[#00cc33] transition"
            >
              CONNECT
            </button>
          )}
        </div>

        {/* Mobile: PFP (connected → slideout) or hamburger (disconnected → nav overlay) */}
        {isConnected ? (
          <button
            className="md:hidden transition z-50 flex items-center justify-center"
            onClick={() => setSlideoutOpen(true)}
            aria-label="Open profile"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slime-green flex items-center justify-center bg-[#1f1f1f]">
              {pfp?.imageUrl ? (
                <img src={pfp.imageUrl} alt="Profile" className="w-full h-full object-cover" style={{ objectPosition: 'center 75%', transform: 'scale(1.5)', transformOrigin: 'center 75%' }} />
              ) : (
                <svg className="w-4 h-4 text-slime-green" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              )}
            </div>
          </button>
        ) : (
          <button
            className="md:hidden transition z-50 flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-300 hover:text-slime-green transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#2a2a2a] z-40 flex flex-col">
          <button
            className="absolute top-6 right-6 text-gray-300 hover:text-slime-green transition"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center px-8">
            {/* Nav Links — always visible */}
            <Link to="/home" className="text-gray-300 hover:text-slime-green transition text-xl font-medium" onClick={() => setMobileMenuOpen(false)}>HOME</Link>
            <Link to="/mint" className="text-gray-300 hover:text-slime-green transition text-xl font-medium" onClick={() => setMobileMenuOpen(false)}>MINT</Link>
            <Link to="/market" className="text-gray-300 hover:text-slime-green transition text-xl font-medium" onClick={() => setMobileMenuOpen(false)}>MARKET</Link>
            <Link to="/collection" className="text-gray-300 hover:text-slime-green transition text-xl font-medium" onClick={() => setMobileMenuOpen(false)}>COLLECTION</Link>
            <span className="text-gray-600 cursor-not-allowed select-none text-xl font-medium">$SLIME</span>

            <button
              onClick={() => { handleConnect(); setMobileMenuOpen(false) }}
              className="bg-slime-green text-black px-8 py-3 rounded-md font-bold text-sm hover:bg-[#00cc33] transition"
            >
              CONNECT
            </button>

            {/* Social Icons */}
            <div className="flex items-center gap-6 mt-4">
              <a href="https://github.com/Built-by-SLIME" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://x.com/builtbyslime" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://discord.gg/8X9PvNFyzK" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Slideout Panel */}
      <ProfileSlideout open={slideoutOpen} onClose={() => setSlideoutOpen(false)} />
    </>
  )
}
