import Navigation from './Navigation'
import Footer from './Footer'

const BRAND_COLORS = [
  { name: 'SLIME Green', hex: '#00FF40', textClass: 'text-black' },
  { name: 'Dark BG', hex: '#2A2A2A', textClass: 'text-white' },
  { name: 'Card BG', hex: '#1F1F1F', textClass: 'text-white' },
  { name: 'Surface', hex: '#252525', textClass: 'text-white' },
  { name: 'White', hex: '#FFFFFF', textClass: 'text-black' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h2>
        <div className="flex-1 h-px bg-gray-800" />
      </div>
      {children}
    </section>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1f1f1f] border border-gray-800 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  )
}

export default function BrandingPage() {
  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white flex flex-col">
      {/* Dot grid background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,255,64,1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)',
      }} />

      <Navigation />

      <main className="relative z-10 py-20 px-4 md:px-8 flex-grow">
        <div className="max-w-4xl mx-auto">

          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-black mb-4">BRANDING</h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Everything you need to represent your SLIME — legally and visually.
            </p>
          </div>

          {/* ── SECTION 1: IP RIGHTS ── */}
          <Section title="IP RIGHTS">
            <Card className="mb-6">
              <div className="flex items-start gap-4 mb-6">
                <span className="text-4xl">⚖️</span>
                <div>
                  <h3 className="text-xl font-black mb-2">Full Commercial IP — It's Yours.</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Every SLIME NFT holder owns <span className="text-white font-bold">full commercial intellectual property rights</span> to
                    their unique SLIME character. That means your SLIME is not just a profile picture — it's a brand
                    asset you can build on, profit from, and license however you choose.
                  </p>
                </div>
              </div>
              <p className="text-gray-500 text-sm border-t border-gray-800 pt-5">
                Your rights are tied to ownership of the NFT. Transferring or selling your SLIME transfers the IP rights to the new holder.
              </p>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <h4 className="text-slime-green font-black text-sm uppercase tracking-widest mb-4">✅ You CAN</h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Use your SLIME for personal and commercial purposes</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Print it on merchandise and sell it</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Use it as your brand identity, logo, or mascot</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Feature it in videos, streams, and media</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>License your character to third parties</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Create derivative artwork based on your SLIME</li>
                </ul>
              </Card>
              <Card>
                <h4 className="text-red-400 font-black text-sm uppercase tracking-widest mb-4">❌ You CANNOT</h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>Claim IP rights over another holder's SLIME</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>Use the SLIME brand name or logo without permission</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>Represent your SLIME as an official SLIME brand product</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span>Use hateful, illegal, or harmful content involving your SLIME</li>
                </ul>
              </Card>
            </div>
          </Section>


          {/* ── SECTION 2: BRAND GUIDELINES ── */}
          <Section title="BRAND GUIDELINES">

            {/* Colors */}
            <h3 className="text-sm font-black mb-4 text-gray-500 uppercase tracking-widest">Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-10">
              {BRAND_COLORS.map(c => (
                <div key={c.hex} className="rounded-xl overflow-hidden border border-gray-800">
                  <div className="h-20" style={{ backgroundColor: c.hex }} />
                  <div className="bg-[#1f1f1f] p-3">
                    <p className="text-white text-xs font-bold">{c.name}</p>
                    <p className="text-gray-500 text-xs font-mono mt-0.5">{c.hex}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Typography */}
            <h3 className="text-sm font-black mb-4 text-gray-500 uppercase tracking-widest">Typography</h3>
            <Card className="mb-10">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Primary Typeface</p>
                  <p className="text-3xl font-black">Space Grotesk</p>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800 text-center">
                  <div><p className="font-black text-lg">BLACK</p><p className="text-gray-500 text-xs mt-1">Headings</p></div>
                  <div><p className="font-bold text-lg">BOLD</p><p className="text-gray-500 text-xs mt-1">Labels / CTA</p></div>
                  <div><p className="font-medium text-lg">MEDIUM</p><p className="text-gray-500 text-xs mt-1">Body</p></div>
                </div>
              </div>
            </Card>

            {/* PFP Guide */}
            <h3 className="text-sm font-black mb-4 text-gray-500 uppercase tracking-widest">Using Your SLIME as a PFP</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              <Card>
                <h4 className="font-black mb-3">On X (Twitter)</h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>X crops profile photos to a circle — make sure your SLIME's face is centred</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Use the full 1:1 square image for best results — no manual cropping needed</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Recommended size: <span className="font-mono text-white">400 × 400 px</span> minimum</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Download your SLIME directly from your inventory on this site</li>
                </ul>
              </Card>
              <Card>
                <h4 className="font-black mb-3">Across Other Platforms</h4>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Discord, Telegram, Instagram — same square crop applies</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>The light backgrounds on most SLIMEs pop well on dark UIs</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Feel free to add custom borders, frames, or overlays — it's your IP!</li>
                  <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>When in doubt: less is more — let your SLIME speak for itself</li>
                </ul>
              </Card>
            </div>

            {/* Name usage */}
            <h3 className="text-sm font-black mb-4 text-gray-500 uppercase tracking-widest">Logo & Name Usage</h3>
            <Card>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                When referencing SLIME as a collection or community, keep things consistent:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-slime-green font-black text-xs uppercase tracking-widest mb-3">✅ Preferred</p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2"><span className="font-mono bg-[#2a2a2a] px-2 py-1 rounded text-white text-xs">SLIME</span> all caps</li>
                    <li className="flex items-center gap-2"><span className="font-mono bg-[#2a2a2a] px-2 py-1 rounded text-white text-xs">$SLIME</span> token reference</li>
                    <li className="flex items-center gap-2"><span className="font-mono bg-[#2a2a2a] px-2 py-1 rounded text-white text-xs">Built by SLIME</span> team reference</li>
                  </ul>
                </div>
                <div>
                  <p className="text-red-400 font-black text-xs uppercase tracking-widest mb-3">❌ Avoid</p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2"><span className="font-mono bg-[#2a2a2a] px-2 py-1 rounded text-gray-500 text-xs line-through">Slime</span> mixed case</li>
                    <li className="flex items-center gap-2"><span className="font-mono bg-[#2a2a2a] px-2 py-1 rounded text-gray-500 text-xs line-through">slime</span> lowercase</li>
                    <li className="flex items-center gap-2"><span className="font-mono bg-[#2a2a2a] px-2 py-1 rounded text-gray-500 text-xs line-through">The Slimes</span> informal</li>
                  </ul>
                </div>
              </div>
            </Card>

          </Section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
