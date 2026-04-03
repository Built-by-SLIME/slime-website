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
          <span className="text-slime-green text-xs font-bold uppercase tracking-widest">Token Details</span>
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

        {/* Liquidity */}
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Community-Funded & Liquidity</h2>
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 mb-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-7 h-7 rounded-full bg-slime-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-slime-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-0.5">100% Community Funded</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                $SLIME is 100% community funded. The initial liquidity pool was created and seeded in the{' '}
                <span className="text-slime-green font-bold">HBAR / $SLIME</span> pair at launch.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-7 h-7 rounded-full bg-slime-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-slime-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-0.5">Add Liquidity</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Community members can add liquidity to existing pools or create new token pairings directly through{' '}
                <a href="https://slime.tools/" target="_blank" rel="noopener noreferrer" className="text-slime-green hover:underline">SLIME Tools</a>{' '}
                or via{' '}
                <a href="https://www.saucerswap.finance/" target="_blank" rel="noopener noreferrer" className="text-slime-green hover:underline">SaucerSwap</a>.
              </p>
            </div>
          </div>
          <div className="bg-black/30 rounded-xl px-4 py-3 border border-slime-green/10">
            <p className="text-slime-green/80 text-xs leading-relaxed">
              This fully decentralized approach ensures all liquidity comes from the community — with no pre-allocated team or VC allocations for liquidity provision.
            </p>
          </div>
        </div>

        {/* Utility & Perks */}
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Utility & Perks</h2>
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 mb-6">
          <p className="text-gray-400 text-sm mb-4">Holding $SLIME is optional but rewarding:</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4 p-4 bg-black/30 rounded-xl">
              <svg className="w-5 h-5 text-slime-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-white font-bold text-sm">Staking Rewards</p>
                <p className="text-gray-500 text-sm mt-0.5">Weekly distributions from the 2M initial pool to all SLIME NFT holders.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-black/30 rounded-xl">
              <svg className="w-5 h-5 text-slime-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <div>
                <p className="text-white font-bold text-sm">Governance Voting Rights</p>
                <p className="text-gray-500 text-sm mt-0.5">Vote on features, treasury use, reward parameters, and future upgrades.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-black/30 rounded-xl">
              <svg className="w-5 h-5 text-slime-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <div>
                <p className="text-white font-bold text-sm">Merch Discounts</p>
                <p className="text-gray-500 text-sm mt-0.5">Exclusive discounts on SLIME merchandise for token holders.</p>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-4 italic">
            Core slime.tools functionality remains available with just your SLIME NFT — $SLIME simply makes the experience better.
          </p>
        </div>

        {/* Rewards System */}
        <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4">Rewards System</h2>
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-slime-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-slime-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Weekly Staking Rewards</p>
                <p className="text-gray-500 text-sm mt-0.5">From the 2M initial pool — distributed to all SLIME NFT holders.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-slime-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-slime-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Monthly Usage Rewards</p>
                <p className="text-gray-500 text-sm mt-0.5">From the 7.5M pool, distributed based on tracked platform activity — tools used, actions completed, etc.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-slime-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-slime-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Off-chain Tracking + On-chain Claims</p>
                <p className="text-gray-500 text-sm mt-0.5">Efficient and fair — activity is tracked off-chain and rewards are claimed on Hedera.</p>
              </div>
            </div>
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
