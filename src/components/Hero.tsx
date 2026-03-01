import { Link } from 'react-router-dom'
import Navigation from './Navigation'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col bg-[#2a2a2a] overflow-visible">
      {/* Dot pattern background with gradient fade */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0, 255, 64, 1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)'
      }}></div>

      <Navigation />

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
        <div className="h-full flex items-center justify-center pt-8 md:pt-32">
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
              <Link to="/collection" className="bg-transparent border-2 border-slime-green text-slime-green px-10 py-3.5 rounded-md font-bold text-sm hover:bg-slime-green hover:text-black transition text-center">
                VIEW COLLECTION
              </Link>
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

