import Navigation from './Navigation'
import Footer from './Footer'

const allocations = [
  {
    dot: '#16a34a',
    label: 'Staking Rewards — 20%',
    amount: '2,000,000 $SLIME',
    desc: 'Minted at TGE. Dedicated exclusively to staking rewards. Anyone holding a SLIME NFT earns $SLIME weekly, pro-rata based on their holdings.',
    note: '* Rewards early supporters and NFT holders from launch.',
  },
  {
    dot: '#4ade80',
    label: 'Mining Rewards — 75%',
    amount: '7,500,000 $SLIME',
    desc: 'Minted monthly based on real usage of slime.tools. Users earn $SLIME proportional to verified activity each month.',
    note: '* NFT unlocks access — it does not determine mining reward amounts.',
  },
  {
    dot: '#dcfce7',
    label: 'Team Allocation — 2%',
    amount: '200,000 $SLIME',
    desc: 'Minted gradually each month alongside community & usage rewards.',
    note: null,
  },
  {
    dot: '#bbf7d0',
    label: 'Marketing & Operations — 3%',
    amount: '300,000 $SLIME',
    desc: 'Minted gradually each month alongside community & usage rewards.',
    note: null,
  },
]

const roadmap = [
  { q: 'Q1 2026', items: ['TGE', 'Initial 2M mint', 'Weekly staking rewards live'] },
  { q: 'Q2 2026', items: ['Usage-based monthly rewards', 'Staking perks'] },
  { q: 'Q4 2027+', items: ['Governance activation', 'Platform expansions', 'Ongoing integrations driven by the community'] },
]

export default function TokenPage() {
  return (
    <div className="min-h-screen bg-[#2a2a2a] flex flex-col">
      <Navigation />
      <main className="flex-1 px-4 py-16 max-w-4xl mx-auto w-full">

        {/* Header */}
        <div className="mb-12">
          <span className="text-slime-green text-xs font-bold uppercase tracking-widest">White Lite Paper</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mt-2">$SLIME TOKEN</h1>
          <p className="text-gray-400 text-base mt-3 max-w-2xl leading-relaxed">
            The utility reward token for the{' '}
            <a href="https://slime.tools/" target="_blank" rel="noopener noreferrer" className="text-slime-green hover:underline">
              slime.tools
            </a>{' '}
            ecosystem — a powerful, affordable creator kit built on Hedera.
          </p>
        </div>

        {/* Overview */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 mb-10">
          <p className="text-gray-300 leading-relaxed">
            slime.tools gives users everything they need to mint and manage NFTs, fungible tokens, custom domains, and more.
            The platform is primarily gated by <span className="text-slime-green font-bold">SLIME NFTs</span>, which act as your key to the full toolkit.
          </p>
          <p className="text-gray-400 mt-3 leading-relaxed">
            $SLIME rewards active users, encourages real usage, and builds long-term community ownership — without ever being required to access core features.
          </p>
        </div>

        {/* Tokenomics */}
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Tokenomics</h2>

        {/* Fixed Supply */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-slime-green/30 p-6 mb-4">
          <p className="text-slime-green font-bold text-xs uppercase tracking-wider mb-1">Total Supply — Fixed Forever</p>
          <p className="text-white font-black text-3xl">10,000,000 $SLIME</p>
          <p className="text-gray-500 text-sm mt-2">No more can ever be minted. This capped supply creates scarcity and supports long-term value in a growing ecosystem.</p>
        </div>

        {/* Allocation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {allocations.map(a => (
            <div key={a.label} className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.dot }} />
                <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">{a.label}</p>
              </div>
              <p className="text-white font-black text-xl mb-2">{a.amount}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{a.desc}</p>
              {a.note && <p className="text-slime-green/60 text-xs mt-2 italic">{a.note}</p>}
            </div>
          ))}
        </div>

        {/* Longevity note */}
        <div className="bg-slime-green/5 border border-slime-green/20 rounded-2xl p-5 mb-10">
          <p className="text-slime-green font-bold text-sm uppercase tracking-wider mb-1">Built for Longevity</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            The 7.5M usage pool (plus 0.5M Team + Marketing) is structured to last a minimum of{' '}
            <span className="text-white font-bold">80 months</span>, with an average monthly emission of ~93,750 $SLIME.
            Actual payouts vary with platform usage but are capped to guarantee the pool survives into{' '}
            <span className="text-white font-bold">2032+</span>.
          </p>
        </div>

        {/* Distribution Chart */}
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Distribution</h2>
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 mb-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 relative">
            <div
              className="w-44 h-44 rounded-full shadow-lg"
              style={{ background: 'conic-gradient(#16a34a 0% 20%, #4ade80 20% 95%, #bbf7d0 95% 98%, #dcfce7 98% 100%)' }}
            />
          </div>
          <div className="flex flex-col gap-3 w-full">
            {[
              { color: '#4ade80', label: 'Mining Rewards', pct: '75%', amt: '7,500,000' },
              { color: '#16a34a', label: 'Staking Rewards', pct: '20%', amt: '2,000,000' },
              { color: '#bbf7d0', label: 'Marketing', pct: '3%', amt: '300,000' },
              { color: '#dcfce7', label: 'Team', pct: '2%', amt: '200,000' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-300 text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold text-sm">{item.pct}</span>
                  <span className="text-gray-600 text-xs w-28 text-right">{item.amt} $SLIME</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Utility & Perks */}
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Utility & Perks</h2>
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 mb-6">
          <p className="text-gray-400 text-sm mb-4">Holding $SLIME is optional but rewarding:</p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '⚡', title: 'Staking Rewards', desc: 'Weekly distributions from the 2M initial pool to all SLIME NFT holders.' },
              { icon: '🗳️', title: 'Governance Voting Rights', desc: 'Vote on features, treasury use, reward parameters, and future upgrades.' },
              { icon: '🛍️', title: 'Merch Discounts', desc: 'Exclusive discounts on SLIME merchandise for token holders.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4 p-4 bg-black/30 rounded-xl">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-white font-bold text-sm">{item.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-4 italic">
            Core slime.tools functionality remains available with just your SLIME NFT — $SLIME simply makes the experience better.
          </p>
        </div>

        {/* Rewards System */}
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Rewards System</h2>
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="flex flex-col gap-5">
            {[
              { tag: 'W', title: 'Weekly Staking Rewards', desc: 'From the 2M initial pool — distributed to all SLIME NFT holders.' },
              { tag: 'M', title: 'Monthly Usage Rewards', desc: 'From the 7.5M pool, distributed based on tracked platform activity — tools used, actions completed, etc.' },
              { tag: '⛓', title: 'Off-chain Tracking + On-chain Claims', desc: 'Efficient and fair — activity is tracked off-chain and rewards are claimed on Hedera.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-slime-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-slime-green text-xs font-black">{item.tag}</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{item.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Governance */}
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Governance</h2>
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 mb-6">
          <p className="text-white font-bold mb-2">Lightweight DAO Model</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            $SLIME holders (with NFT multipliers) vote on features, treasury use, reward parameters, and future upgrades.
            Starts team-guided and transitions to full community control.
          </p>
        </div>

        {/* Roadmap */}
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Roadmap Highlights</h2>
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="flex flex-col gap-5">
            {roadmap.map((phase, i) => (
              <div key={phase.q} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slime-green flex-shrink-0 mt-1" />
                  {i < roadmap.length - 1 && <div className="w-0.5 bg-gray-800 flex-1 mt-1 min-h-[20px]" />}
                </div>
                <div className="pb-2">
                  <p className="text-slime-green font-bold text-sm">{phase.q}</p>
                  <ul className="mt-1 space-y-0.5">
                    {phase.items.map(it => (
                      <li key={it} className="text-gray-400 text-sm">· {it}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why $SLIME CTA */}
        <div className="bg-slime-green/10 border border-slime-green/30 rounded-2xl p-8 mb-10 text-center">
          <h2 className="text-2xl font-black text-white mb-3">Why $SLIME?</h2>
          <p className="text-gray-300 leading-relaxed max-w-xl mx-auto">
            $SLIME turns real usage into real rewards. With a fixed supply, transparent monthly minting, and a clear path
            to 2032+, it rewards creators who actually build and engage on slime.tools — keeping the ecosystem healthy
            and sustainable for years to come.
          </p>
          <p className="text-slime-green font-black text-lg mt-5">Shape the Future of Hedera. Join SLIME.</p>
          <a
            href="https://x.com/builtbyslime"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 bg-slime-green text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition"
          >
            Follow @builtbyslime on X
          </a>
        </div>

        {/* Disclaimer */}
        <p className="text-gray-700 text-xs text-center leading-relaxed">
          This litepaper is for informational purposes only. It does not constitute financial advice.
          Cryptocurrencies involve risk and token values can fluctuate or go to zero.
        </p>

      </main>
      <Footer />
    </div>
  )
}
