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
      <Navigation />

      <main className="py-20 px-4 md:px-8 flex-grow">
        <div className="max-w-4xl mx-auto">

          {/* Page Header */}
          <div className="mb-12">
            <span className="text-slime-green text-xs font-bold uppercase tracking-widest">Your Assets</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mt-2">BRANDING</h1>
            <p className="text-gray-400 text-base mt-3 max-w-2xl leading-relaxed">
              Everything you need to represent your SLIME.
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
                Every SLIME NFT is a one-of-a-kind, hashgraph-verified asset that grants you{' '}
                <span className="text-white font-bold">perpetual, worldwide commercial IP rights</span> for that specific design.
                We exist to empower our holders, not restrict them.
              </p>
              <p className="text-white font-black text-lg">Welcome to the SLIME. Make it yours. Make it loud.</p>
            </Card>
          </Section>


          {/* ── SECTION 2: BRAND GUIDELINES ── */}
          <Section title="BRAND GUIDELINES">

            {/* PFP Guide */}
            <h3 className="text-sm font-black mb-4 text-gray-500 uppercase tracking-widest">Using Your SLIME as a PFP</h3>
            <Card className="mb-10">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Visual reference */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <div className="w-40 h-40 rounded-full border-4 border-gray-700 overflow-hidden flex-shrink-0">
                    <img
                      src="/Assets/pfp-example.png"
                      alt="SLIME PFP example — tilted and zoomed in on face"
                      className="w-full h-full object-cover scale-[1.2] object-center"
                    />
                  </div>
                  <p className="text-center text-gray-600 text-xs mt-2">Reference style</p>
                </div>
                {/* Copy */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="font-black mb-2">The SLIME PFP Look</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      The best SLIME PFPs aren't just a square image dropped in — they're <span className="text-white font-bold">tilted, zoomed in, and cropped to show off the face and head traits.</span> Let the crown, sunglasses, hat, or whatever makes your SLIME unique fill the circle. That's the look. That's the vibe.
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Zoom in to the face — head traits are the star of the show</li>
                    <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Tilt the image slightly for character and personality</li>
                    <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>X, Discord, Telegram — this cropped style works everywhere</li>
                    <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Download your full SLIME image from your wallet or inventory on this site</li>
                    <li className="flex items-start gap-2"><span className="text-slime-green mt-0.5">•</span>Feel free to add custom borders or frames — it's your IP!</li>
                  </ul>
                </div>
              </div>
            </Card>

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
