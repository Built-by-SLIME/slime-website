import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

const API_BASE = 'https://api.slime.tools/api/v1/external'
const API_KEY  = '4790831456f307dd84e8b3aaeccbf19de0c9e2be85d0b993a3939fbb48b8644e'
const headers = { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }

interface Program {
  id: string; name: string; description: string; stake_token_id: string; stake_token_type: 'NFT' | 'FT'
  reward_token_id: string; treasury_account_id: string; reward_rate_per_day: string; min_stake_amount: string; frequency: string
}
interface Stats { participantCount: number; totalDistributed: number }
interface Position {
  accountId: string; isRegistered: boolean; holdings: { unitsHeld: number; meetsMinimum: boolean }
  totalEarned: number; nextDripAt: string; estimatedNextReward: number
}
interface Eligibility { isRegistered: boolean; isEligible: boolean; holdings: number; estimatedReward: number; currency: string }

export default function StakingApiTestPage() {
  const { isConnected, accountId, connect } = useWallet()
  const [program, setProgram] = useState<Program | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingWallet, setCheckingWallet] = useState(false)
  const [regStatus, setRegStatus] = useState<'idle' | 'registering' | 'success' | 'error'>('idle')
  const [regMsg, setRegMsg] = useState('')
  const [manualWallet, setManualWallet] = useState('')
  const [programId, setProgramId] = useState<string | null>(null)
  const wallet = accountId || manualWallet.trim()

  // Discover program ID from /staking-programs list, then fetch details
  useEffect(() => {
    fetch(`${API_BASE}/staking-programs`, { headers })
      .then(r => r.json())
      .then(list => {
        const prog = list.programs?.[0] as Program | undefined
        if (prog) {
          setProgramId(prog.id)
          return fetch(`${API_BASE}/staking-programs/${prog.id}`, { headers }).then(r => r.json())
        }
        throw new Error('No programs found')
      })
      .then(d => { if (d.success) { setProgram(d.program); setStats(d.stats) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!wallet || !programId) { setPosition(null); setEligibility(null); return }
    setCheckingWallet(true); setRegStatus('idle')
    Promise.all([
      fetch(`${API_BASE}/staking-programs/${programId}/position/${wallet}`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/staking-programs/${programId}/eligibility/${wallet}`, { headers }).then(r => r.json()),
    ])
      .then(([pos, eli]) => { if (pos.success) setPosition(pos); if (eli.success) setEligibility(eli) })
      .catch(() => {})
      .finally(() => setCheckingWallet(false))
  }, [wallet, programId])

  const handleRegister = async () => {
    if (!wallet || !programId) return
    setRegStatus('registering')
    try {
      const res = await fetch(`${API_BASE}/staking-programs/${programId}/register`, { method: 'POST', headers, body: JSON.stringify({ accountId: wallet }) })
      const data = await res.json()
      if (data.success) {
        setRegStatus('success')
        setRegMsg(data.drip?.success ? 'Registered! First reward sent.' : 'Registered! Future drips will include you.')
        const pos = await fetch(`${API_BASE}/staking-programs/${programId}/position/${wallet}`, { headers }).then(r => r.json())
        if (pos.success) setPosition(pos)
      } else { throw new Error(data.error || 'Registration failed') }
    } catch (e) { setRegStatus('error'); setRegMsg(e instanceof Error ? e.message : 'Registration failed') }
  }

  const freqLabel = (f: string) => ({ '1d': 'Daily', '7d': 'Weekly', '14d': 'Bi-weekly', '30d': 'Monthly', '90d': 'Quarterly', '180d': 'Bi-annually', '365d': 'Yearly' } as Record<string, string>)[f] ?? f

  return (
    <div className="min-h-screen bg-[#2a2a2a] flex flex-col">
      <Navigation />
      <main className="flex-1 px-4 py-20 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-4xl font-black tracking-tight text-white">STAKING <span className="text-gray-600 text-sm font-normal ml-2">(API TEST)</span></h1>
          <p className="text-gray-500 text-sm mt-1">Hidden test page — verify SLIME staking API integration.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" /></div>
        ) : !program ? (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 text-center text-red-400">Failed to load program.</div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-bold text-xl">{program.name}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{program.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs">Participants</p>
                  <p className="text-white font-bold">{stats?.participantCount ?? '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Stake</p>
                  <p className="text-white font-bold text-sm">{program.stake_token_id}</p>
                  <p className="text-gray-600 text-xs">{program.stake_token_type}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Reward</p>
                  <p className="text-white font-bold text-sm">{program.reward_token_id}</p>
                  <p className="text-slime-green text-xs">+{program.reward_rate_per_day}/day</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Schedule</p>
                  <p className="text-white font-bold text-sm">{freqLabel(program.frequency)}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Min Stake</p>
                  <p className="text-white font-bold text-sm">{program.min_stake_amount}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 p-6">
              {!isConnected && (
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    value={manualWallet}
                    onChange={e => setManualWallet(e.target.value)}
                    placeholder="Wallet (0.0.xxxxx) or connect"
                    className="flex-1 bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-slime-green"
                  />
                  <button onClick={() => connect().catch(() => {})}
                    className="bg-slime-green text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition">
                    CONNECT WALLET
                  </button>
                </div>
              )}
              {isConnected && <p className="text-gray-400 text-sm mb-4">Connected: <span className="text-white font-mono">{accountId}</span></p>}

              {wallet && checkingWallet && (
                <div className="flex items-center gap-2 text-gray-500 text-sm"><div className="animate-spin rounded-full h-3 w-3 border-b border-slime-green" />Checking position...</div>
              )}

              {wallet && !checkingWallet && position && (
                <div className="bg-black/20 rounded-xl p-4 border border-gray-800/60">
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Your Position</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div><p className="text-gray-500 text-xs">Registered</p><p className={position.isRegistered ? 'text-slime-green font-bold' : 'text-gray-400 font-bold'}>{position.isRegistered ? '✓ Yes' : '✗ No'}</p></div>
                    <div><p className="text-gray-500 text-xs">You Hold</p><p className="text-white font-bold">{position.holdings.unitsHeld}</p></div>
                    <div><p className="text-gray-500 text-xs">Meets Min</p><p className={position.holdings.meetsMinimum ? 'text-slime-green font-bold' : 'text-red-400 font-bold'}>{position.holdings.meetsMinimum ? '✓ Yes' : '✗ No'}</p></div>
                    <div><p className="text-gray-500 text-xs">Total Earned</p><p className="text-white font-bold">{position.totalEarned}</p></div>
                  </div>
                  {position.isRegistered && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-gray-500 text-xs">Next Drip</p><p className="text-white">{position.nextDripAt ? new Date(position.nextDripAt).toLocaleString() : '—'}</p></div>
                      <div><p className="text-gray-500 text-xs">Est. Next Reward</p><p className="text-slime-green font-bold">{position.estimatedNextReward}</p></div>
                    </div>
                  )}
                  {!position.isRegistered && eligibility && (
                    <div className="mt-3">
                      <p className="text-gray-500 text-xs">Eligibility</p>
                      <p className={eligibility.isEligible ? 'text-slime-green text-sm' : 'text-red-400 text-sm'}>
                        {eligibility.isEligible ? `Eligible — est. reward ${eligibility.estimatedReward} ${eligibility.currency}` : `Not eligible — holdings ${eligibility.holdings}`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {wallet && !checkingWallet && position && !position.isRegistered && (
                <div className="mt-4">
                  {regStatus === 'error' && <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{regMsg}</p></div>}
                  {regStatus === 'success' && <div className="mb-3 bg-slime-green/10 border border-slime-green/30 rounded-xl px-4 py-3"><p className="text-slime-green text-sm font-bold">{regMsg}</p></div>}
                  <button
                    onClick={handleRegister}
                    disabled={regStatus === 'registering'}
                    className="w-full bg-slime-green text-black py-3 px-5 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition disabled:opacity-50"
                  >
                    {regStatus === 'registering' ? 'REGISTERING...' : 'REGISTER FOR REWARDS'}
                  </button>
                </div>
              )}

              {wallet && !checkingWallet && position && position.isRegistered && (
                <div className="mt-4 bg-slime-green/10 border border-slime-green/30 rounded-xl px-4 py-3">
                  <p className="text-slime-green text-sm font-bold">✓ You are registered and earning rewards.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
