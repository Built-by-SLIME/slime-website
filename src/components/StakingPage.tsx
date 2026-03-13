import { useState, useEffect } from 'react'
import { TokenAssociateTransaction, TokenId, AccountId } from '@hashgraph/sdk'
import { useWallet } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

const MIRROR = 'https://mainnet-public.mirrornode.hedera.com'

interface StakingProgram {
  id: string
  name: string
  description: string | null
  stake_token_id: string
  stake_token_type: 'NFT' | 'FT'
  reward_token_id: string
  treasury_account_id: string
  reward_rate_per_day: number
  min_stake_amount: number
  frequency: string
  last_distributed_at: string | null
}

interface TokenInfo { symbol: string; decimals: number }
type RegStatus = 'idle' | 'checking' | 'associating' | 'registering' | 'success' | 'already' | 'error'

export default function StakingPage() {
  const { isConnected, accountId, dAppConnector, connect } = useWallet()

  const [programs, setPrograms] = useState<StakingProgram[]>([])
  const [tokenInfo, setTokenInfo] = useState<Map<string, TokenInfo>>(new Map())
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [regStatus, setRegStatus] = useState<RegStatus>('idle')
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/staking-programs/public')
        const data = await res.json()
        const progs: StakingProgram[] = data.programs || []
        setPrograms(progs)
        const tokenIds = new Set<string>()
        progs.forEach(p => { tokenIds.add(p.stake_token_id); tokenIds.add(p.reward_token_id) })
        const infoMap = new Map<string, TokenInfo>()
        await Promise.all([...tokenIds].map(async id => {
          try {
            const r = await fetch(`${MIRROR}/api/v1/tokens/${id}`)
            const t = await r.json()
            infoMap.set(id, { symbol: t.symbol || id, decimals: Number(t.decimals) || 0 })
          } catch { /* fallback */ }
        }))
        setTokenInfo(infoMap)
      } catch (e) {
        console.error('Failed to load staking programs', e)
      } finally {
        setLoadingPrograms(false)
      }
    }
    load()
  }, [])

  useEffect(() => { setRegStatus('idle'); setStatusMsg('') }, [activeId])

  const freqLabel = (f: string) =>
    ({ '1d': 'Daily', '7d': 'Weekly', '14d': 'Bi-Weekly', '30d': 'Monthly', '90d': 'Quarterly', '180d': 'Bi-Annually', '365d': 'Annually' } as Record<string, string>)[f] ?? f

  const handleRegister = async (program: StakingProgram) => {
    if (!isConnected || !accountId || !dAppConnector) {
      await connect().catch(() => {})
      return
    }
    const signer = dAppConnector.signers.find(s => s.getAccountId().toString() === accountId)
      ?? dAppConnector.signers[0]
    if (!signer) { setRegStatus('error'); setStatusMsg('Wallet signer not available — please reconnect'); return }

    setRegStatus('checking'); setStatusMsg('Checking registration status...')
    try {
      const partRes = await fetch(`/api/staking-programs/${program.id}/participants`)
      const partData = await partRes.json()
      const alreadyIn = (partData.participants || []).some((p: { account_id: string }) => p.account_id === accountId)
      if (alreadyIn) { setRegStatus('already'); setStatusMsg('You are already registered in this program!'); return }

      setStatusMsg('Checking token association...')
      const assocRes = await fetch(`${MIRROR}/api/v1/accounts/${accountId}/tokens?token.id=${program.reward_token_id}&limit=1`)
      const assocData = await assocRes.json()
      const isAssociated = (assocData.tokens || []).length > 0

      if (!isAssociated) {
        setRegStatus('associating'); setStatusMsg('Associating reward token — please approve in your wallet...')
        const assocTx = new TokenAssociateTransaction()
          .setAccountId(AccountId.fromString(accountId))
          .setTokenIds([TokenId.fromString(program.reward_token_id)])
        await signer.call(assocTx)
      }

      setRegStatus('registering'); setStatusMsg('Registering...')
      const regRes = await fetch(`/api/staking-programs/${program.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      const regData = await regRes.json()
      if (!regRes.ok || !regData.success) throw new Error(regData.error || 'Registration failed')
      setRegStatus('success'); setStatusMsg('Successfully registered! You will receive rewards at the next drip cycle.')
    } catch (err) {
      setRegStatus('error'); setStatusMsg(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a] flex flex-col">
      <Navigation />
      <main className="flex-1 px-4 py-20 max-w-4xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-white">STAKING</h1>
          <p className="text-gray-500 text-sm mt-1">Soft-stake your tokens — no locking required. Holdings are snapshotted at each drip cycle.</p>
        </div>

        {!isConnected && (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 text-center">
            <p className="text-gray-400 mb-4">Connect your wallet to view and join staking programs.</p>
            <button onClick={() => connect().catch(() => {})}
              className="bg-slime-green text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition">
              CONNECT WALLET
            </button>
          </div>
        )}

        {isConnected && loadingPrograms && (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slime-green" />
          </div>
        )}

        {isConnected && !loadingPrograms && programs.length === 0 && (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 text-center text-gray-500">
            <p className="font-bold text-white mb-1">No active staking programs</p>
            <p className="text-sm">Check back soon.</p>
          </div>
        )}

        {isConnected && !loadingPrograms && programs.length > 0 && (
          <div className="flex flex-col gap-4">
            {programs.map(p => {
              const isActive = activeId === p.id
              const stakeSymbol = tokenInfo.get(p.stake_token_id)?.symbol ?? p.stake_token_id
              const rewardSymbol = tokenInfo.get(p.reward_token_id)?.symbol ?? p.reward_token_id
              const busy = isActive && (regStatus === 'checking' || regStatus === 'associating' || regStatus === 'registering')
              const done = isActive && (regStatus === 'success' || regStatus === 'already')

              return (
                <div key={p.id} className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="flex items-center justify-between p-6">
                    <div>
                      <p className="text-white font-bold text-lg">{p.name}</p>
                      {p.description && <p className="text-gray-500 text-sm mt-0.5">{p.description}</p>}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-slime-green font-bold text-sm">{stakeSymbol} ({p.stake_token_type})</span>
                        <span className="text-gray-600 text-xs">→</span>
                        <span className="text-white text-sm">{rewardSymbol} rewards</span>
                        <span className="text-gray-700 text-xs">·</span>
                        <span className="text-gray-500 text-xs">{freqLabel(p.frequency)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveId(isActive ? null : p.id)}
                      className="bg-slime-green text-black px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition flex-shrink-0 ml-4"
                    >
                      {isActive ? 'CLOSE' : 'STAKE'}
                    </button>
                  </div>

                  {isActive && (
                    <div className="border-t border-gray-800 p-6">
                      {busy && (
                        <div className="flex items-center gap-3 mb-5 text-sm text-gray-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slime-green flex-shrink-0" />
                          {statusMsg}
                        </div>
                      )}
                      {done && (
                        <div className="mb-5 bg-slime-green/10 border border-slime-green/30 rounded-xl px-4 py-3">
                          <p className="text-slime-green text-sm font-bold">{statusMsg}</p>
                        </div>
                      )}
                      {regStatus === 'error' && (
                        <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                          <p className="text-red-400 text-sm">{statusMsg}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        <div className="bg-black/30 rounded-xl p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Stake Token</p>
                          <p className="text-white font-bold text-sm">{stakeSymbol}</p>
                          <p className="text-gray-600 text-xs">{p.stake_token_type}</p>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Reward</p>
                          <p className="text-white font-bold text-sm">{rewardSymbol}</p>
                          <p className="text-slime-green text-xs">+{p.reward_rate_per_day}/day per unit</p>
                        </div>
                        <div className="bg-black/30 rounded-xl p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Schedule</p>
                          <p className="text-white font-bold text-sm">{freqLabel(p.frequency)}</p>
                          {p.last_distributed_at && (
                            <p className="text-gray-600 text-xs">Last: {new Date(p.last_distributed_at).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div className="bg-black/30 rounded-xl p-3">
                          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Min Stake</p>
                          <p className="text-white font-bold text-sm">{p.min_stake_amount}</p>
                        </div>
                      </div>

                      <p className="text-gray-600 text-xs mb-4">
                        No tokens are locked. Holdings are snapshotted at each drip cycle. If you have not yet associated the reward token, you will be prompted to do so.
                      </p>

                      <button
                        onClick={() => handleRegister(p)}
                        disabled={busy || done}
                        className="w-full bg-slime-green text-black py-3 px-5 rounded-xl font-bold text-sm hover:bg-[#00cc33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busy ? 'PROCESSING...' : done ? 'REGISTERED ✓' : 'REGISTER FOR REWARDS'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}


