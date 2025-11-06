import { useState } from 'react'

export default function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <section className="relative min-h-screen flex flex-col bg-[#2a2a2a] overflow-visible">
      {/* Dot pattern background with gradient fade */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0, 255, 64, 1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)'
      }}></div>

      {/* Navigation */}
      <nav className="relative flex justify-between items-center px-4 py-5 z-10" style={{ paddingLeft: undefined, paddingRight: undefined }}>
        <style>{`
          @media (min-width: 768px) {
            nav { padding-left: 76.5px !important; padding-right: 60px !important; }
          }
        `}</style>
        <div className="flex items-center md:mt-[4px]">
          <img src="/Assets/SPLAT.png" alt="SLIME" className="h-auto w-10 md:w-12" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10" style={{ marginTop: '4px' }}>
          <div className="flex gap-10 text-sm font-medium">
            <a href="https://altlantis.market/live/QQaupimisf3YogPk2hdq" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-slime-green transition">MINT</a>
            {/* <a href="/merch" className="text-gray-300 hover:text-slime-green transition">MERCH</a> */}
            <a href="/collection" className="text-gray-300 hover:text-slime-green transition">COLLECTION</a>
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
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden text-gray-300 hover:text-slime-green transition z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#2a2a2a] z-40 flex flex-col items-center justify-center">
          {/* Close Button */}
          <button
            className="absolute top-6 right-6 text-gray-300 hover:text-slime-green transition"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col items-center gap-8 text-center">
            <a
              href="https://altlantis.market/live/QQaupimisf3YogPk2hdq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-slime-green transition text-2xl font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              MINT
            </a>
            <a
              href="/collection"
              className="text-gray-300 hover:text-slime-green transition text-2xl font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              COLLECTION
            </a>

            {/* Social Icons */}
            <div className="flex items-center gap-6 mt-8">
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

      {/* Hero Content - Match BEANZ: text centered, characters at bottom */}
      <div className="flex-1 relative overflow-visible">
        {/* Left Character - STAYS at bottom left corner */}
        <div className="hidden lg:block absolute left-0 bottom-0 z-0" style={{ transform: 'rotate(8deg)', transformOrigin: 'bottom left' }}>
          <img
            src="/Assets/slime1.png"
            alt="SLIME Character"
            className="object-contain object-bottom"
            style={{ width: '384px', height: '384px' }}
          />
        </div>

        {/* Center - Text Content - Centered in viewport */}
        <div className="h-full flex items-center justify-center pt-32">
          <div className="text-center z-10 max-w-5xl px-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-none tracking-tight mb-6" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace" }}>
              SHAPE THE FUTURE OF HEDERA.<br />
              JOIN SLIME.
            </h1>
            <p className="text-gray-400 text-base md:text-lg mb-8 max-w-2xl mx-auto">
              SLIME is a development collective dedicated to delivering production-grade FOSS to the Hedera ecosystem. We scout, and mentor new builders - then ship production-ready FOSS for Hedera, governed 100% by our DAO.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://sentx.io/nft-marketplace/slime" target="_blank" rel="noopener noreferrer" className="bg-slime-green text-black px-10 py-3.5 rounded-md font-bold text-sm hover:bg-[#00cc33] transition text-center">
                BUY SLIME
              </a>
              <a href="/collection" className="bg-transparent border-2 border-slime-green text-slime-green px-10 py-3.5 rounded-md font-bold text-sm hover:bg-slime-green hover:text-black transition text-center">
                VIEW COLLECTION
              </a>
            </div>
          </div>
        </div>

        {/* Right Character - STAYS at bottom right corner */}
        <div className="hidden lg:block absolute right-0 bottom-0 z-0" style={{ transform: 'rotate(-8deg)', transformOrigin: 'bottom right' }}>
          <img
            src="/Assets/slime2.png"
            alt="SLIME Character"
            className="object-contain object-bottom"
            style={{ width: '340px', height: '340px' }}
          />
        </div>
      </div>
    </section>
  )
}

