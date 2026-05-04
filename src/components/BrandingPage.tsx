import Navigation from './Navigation'
import Footer from './Footer'

const SLIME_COLORS = [
  { name: 'Green',  hex: '#00FF40' },
  { name: 'Red',    hex: '#FE3300' },
  { name: 'Purple', hex: '#9400D3' },
  { name: 'Pink',   hex: '#FF1493' },
  { name: 'Cyan',   hex: '#00FFFF' },
  { name: 'Blue',   hex: '#0055FF' },
  { name: 'Black',  hex: '#3D2A3F' },
  { name: 'Gold',   hex: '#FFD700' },
]

const BG_COLORS = [
  { name: 'Sage',   hex: '#A5D6A7' },
  { name: 'Blue',   hex: '#89CFF0' },
  { name: 'Purple', hex: '#B39DDB' },
  { name: 'Salmon', hex: '#FF7F7F' },
  { name: 'Rose',   hex: '#F8BABA' },
  { name: 'Peach',  hex: '#FFCC99' },
  { name: 'Canary', hex: '#FFFF99' },
  { name: 'Beige',  hex: '#FFFFE0' },
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
          <div className="mb-12">
            <span className="text-slime-green text-xs font-bold uppercase tracking-widest">Community</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mt-2">BRANDING</h1>
            <p className="text-gray-400 text-base mt-3 max-w-2xl leading-relaxed">
              Everything you need to represent your SLIME — legally and visually.
            </p>
          </div>

          {/* ── SECTION 1: IP RIGHTS ── */}
          <Section title="IP RIGHTS">
            {/* Intro */}
            <Card className="mb-6">
              <p className="text-gray-300 leading-relaxed mb-5">
                At SLIME on Hedera, we believe true ownership means real creative and commercial freedom. When you own a SLIME NFT,
                you don't just get a digital collectible — you receive{' '}
                <span className="text-white font-bold">full commercial intellectual property rights</span> to your unique SLIME character.
              </p>
              <p className="text-gray-300 leading-relaxed">
                This means you can freely use your SLIME across any personal or commercial projects, including:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                {[
                  'Business branding and logos',
                  'Vehicle wraps and fleet graphics (trucks, vans, cars, etc.)',
                  'Merchandise and apparel',
                  'Marketing materials, websites, social media, and advertising',
                  'Physical products, packaging, and promotional items',
                  'Books, animations, games, or any other creative media',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-slime-green mt-0.5 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            {/* No restrictions callout */}
            <Card className="mb-6 border-slime-green/30 bg-slime-green/5">
              <p className="text-gray-200 leading-relaxed mb-3">
                Your SLIME is yours to build with. <span className="text-white font-bold">Print it, plaster it, monetize it</span> — no royalties owed back
                to the project, no additional licenses required.
              </p>
              <p className="text-slime-green font-black text-lg">Ownership on Hedera = Real Utility.</p>
            </Card>

            {/* Closing copy */}
            <Card>
              <p className="text-gray-300 leading-relaxed mb-4">
                Every SLIME NFT is a one-of-a-kind, blockchain-verified asset that grants you{' '}
                <span className="text-white font-bold">perpetual, worldwide commercial IP rights</span> for that specific design.
                We exist to empower our holders, not restrict them.
              </p>
              <p className="text-white font-black text-lg">Welcome to the SLIME. Make it yours. Make it loud.</p>
            </Card>
          </Section>


          {/* ── SECTION 2: BRAND GUIDELINES ── */}
          <Section title="BRAND GUIDELINES">

            {/* SLIME Colors */}
            <h3 className="text-sm font-black mb-4 text-gray-500 uppercase tracking-widest">SLIME Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              {SLIME_COLORS.map(c => (
                <div key={c.hex} className="rounded-xl overflow-hidden border border-gray-800">
                  <div className="h-20" style={{ backgroundColor: c.hex }} />
                  <div className="bg-[#1f1f1f] p-3">
                    <p className="text-white text-xs font-bold">{c.name}</p>
                    <p className="text-gray-500 text-xs font-mono mt-0.5">{c.hex}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Background Colors */}
            <h3 className="text-sm font-black mb-4 text-gray-500 uppercase tracking-widest">Background Colors</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              {BG_COLORS.map(c => (
                <div key={c.hex} className="rounded-xl overflow-hidden border border-gray-800">
                  <div className="h-20" style={{ backgroundColor: c.hex }} />
                  <div className="bg-[#1f1f1f] p-3">
                    <p className="text-white text-xs font-bold">{c.name}</p>
                    <p className="text-gray-500 text-xs font-mono mt-0.5">{c.hex}</p>
                  </div>
                </div>
              ))}
            </div>

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
