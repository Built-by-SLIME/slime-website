import { useState, useEffect } from 'react'
import { TransferTransaction, AccountId, Hbar } from '@hashgraph/sdk'
import { useWallet } from '../context/WalletContext'
import Navigation from './Navigation'
import Footer from './Footer'

const API_BASE = 'https://api.slime.tools'
const SUPPORTED_TLDS = ['hedera', 'slime', 'gib', 'tigers', 'buds'] as const
type Tld = typeof SUPPORTED_TLDS[number]

interface CheckResult {
  available: boolean
  priceHbar: number
  priceUsd: number
  feeAccountId: string
}

interface OwnedDomain {
  domain: string
  name: string
  tld: string
  owner: string
  expiresAt: string
  nftTokenId: string
  nftSerial: number
  hcsSequenceNumber: number
}

type RegStatus = 'idle' | 'checking' | 'paying' | 'registering' | 'success' | 'error'

export default function DomainsPage() {
  const { isConnected, accountId, dAppConnector, connect } = useWallet()

  const [name, setName] = useState('')
  const [tld, setTld] = useState<Tld>('slime')
  const [years, setYears] = useState(1)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [status, setStatus] = useState<RegStatus>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [ownedDomains, setOwnedDomains] = useState<OwnedDomain[]>([])
  const [loadingOwned, setLoadingOwned] = useState(false)

  useEffect(() => {
    if (isConnected && accountId) {
      loadOwnedDomains()
    } else {
      setOwnedDomains([])
    }
  }, [isConnected, accountId])

  useEffect(() => {
    setCheckResult(null)
    setStatus('idle')
    setStatusMsg('')
  }, [name, tld, years])

  const loadOwnedDomains = async () => {
    setLoadingOwned(true)
    try {
      const res = await fetch(`${API_BASE}/api/domains/owned/${accountId}`)
      const data = await res.json()
      if (data.success) setOwnedDomains(data.domains || [])
    } catch { /* silently fail */ } finally {
      setLoadingOwned(false)
    }
  }

  const handleCheck = async () => {
    if (!name.trim()) return
    setStatus('checking')
    setCheckResult(null)
    setStatusMsg('')
    try {
      const res = await fetch(
        `${API_BASE}/api/domains/check?name=${encodeURIComponent(name.trim().toLowerCase())}&tld=${tld}&years=${years}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Check failed')
      setCheckResult({
        available: data.available,
        priceHbar: data.priceHbar,
        priceUsd: data.priceUsd,
        feeAccountId: data.feeAccountId,
      })
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setStatusMsg(err instanceof Error ? err.message : 'Check failed')
    }
  }

  const handleRegister = async () => {
    if (!checkResult || !dAppConnector) return
    const signer = dAppConnector.signers.find(s => s.getAccountId().toString() === accountId)
      ?? dAppConnector.signers[0]
    if (!signer) {
      setStatus('error')
      setStatusMsg('Wallet signer not available — please reconnect')
      return
    }

    setStatus('paying')
    setStatusMsg('Confirm the HBAR payment in your wallet...')
    try {
      const tinybars = Math.round(checkResult.priceHbar * 1e8)
      const payTx = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(accountId), Hbar.fromTinybars(-tinybars))
        .addHbarTransfer(AccountId.fromString(checkResult.feeAccountId), Hbar.fromTinybars(tinybars))
      const response = await signer.call(payTx)
      const txId = response.transactionId?.toString() ?? ''

      setStatus('registering')
      setStatusMsg('Minting your domain NFT...')
      const regRes = await fetch(`${API_BASE}/api/domains/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim().toLowerCase(),
          tld,
          years,
          ownerAccountId: accountId,
          paymentTxId: txId,
        }),
      })
      const regData = await regRes.json()
      if (!regRes.ok || !regData.success) throw new Error(regData.error || 'Registration failed')

      setStatus('success')
      setStatusMsg(`${name.trim().toLowerCase()}.${tld} is yours! NFT minted to your wallet.`)
      setName('')
      setCheckResult(null)
      await loadOwnedDomains()
    } catch (err) {
      setStatus('error')
      setStatusMsg(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  const formatExpiry = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  const busy = status === 'checking' || status === 'paying' || status === 'registering'
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#2a2a2a' }}>
      <Navigation />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <h1 className="font-mono text-3xl font-bold text-white mb-2">DOMAIN REGISTRATION</h1>
        <p className="text-gray-400 text-sm mb-8">Claim your identity on Hedera. Backed by HCS + HTS.</p>

        {/* Search Card */}
        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#1a1a1a' }}>
          <label className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-3 block">Domain Name</label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.replace(/\s/g, '').toLowerCase())}
              onKeyDown={e => e.key === 'Enter' && !busy && handleCheck()}
              placeholder="yourname"
              disabled={busy}
              className="flex-1 bg-transparent border border-gray-600 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-green-400 disabled:opacity-50"
            />
            <select
              value={tld}
              onChange={e => setTld(e.target.value as Tld)}
              disabled={busy}
              className="bg-gray-800 border border-gray-600 rounded-xl px-3 py-3 text-green-400 font-mono focus:outline-none focus:border-green-400 disabled:opacity-50"
            >
              {SUPPORTED_TLDS.map(t => (
                <option key={t} value={t}>.{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">Years</span>
            {[1, 3, 5, 10].map(y => (
              <button
                key={y}
                onClick={() => setYears(y)}
                disabled={busy}
                className={`w-10 h-10 rounded-lg font-mono text-sm font-bold border transition-colors disabled:opacity-50 ${ years === y ? 'border-green-400 text-green-400 bg-green-400/10' : 'border-gray-600 text-gray-400 hover:border-gray-400' }`}
              >{y}</button>
            ))}
          </div>

          <button
            onClick={handleCheck}
            disabled={!name.trim() || busy}
            className="w-full py-3 rounded-xl font-mono text-sm font-bold tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#00ff40', color: '#1a1a1a' }}
          >
            {status === 'checking' ? 'CHECKING...' : 'CHECK AVAILABILITY'}
          </button>

          {/* Availability Result */}
          {checkResult && (
            <div className={`mt-4 p-4 rounded-xl border ${ checkResult.available ? 'border-green-400/40 bg-green-400/5' : 'border-red-400/40 bg-red-400/5' }`}>
              {checkResult.available ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-green-400 font-bold">{name.trim().toLowerCase()}.{tld}</p>
                    <p className="text-gray-400 text-sm mt-1">{checkResult.priceHbar.toFixed(2)} HBAR / yr &middot; ~${checkResult.priceUsd.toFixed(2)} USD</p>
                  </div>
                  {isConnected ? (
                    <button
                      onClick={handleRegister}
                      disabled={busy}
                      className="px-5 py-2 rounded-xl font-mono text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                      style={{ backgroundColor: '#00ff40', color: '#1a1a1a' }}
                    >
                      {status === 'paying' ? 'CONFIRM...' : status === 'registering' ? 'MINTING...' : 'REGISTER'}
                    </button>
                  ) : (
                    <button
                      onClick={connect}
                      className="px-5 py-2 rounded-xl font-mono text-sm font-bold uppercase tracking-widest"
                      style={{ backgroundColor: '#00ff40', color: '#1a1a1a' }}
                    >CONNECT WALLET</button>
                  )}
                </div>
              ) : (
                <p className="font-mono text-red-400 font-bold">{name.trim().toLowerCase()}.{tld} is taken</p>
              )}
            </div>
          )}

          {/* Status Messages */}
          {statusMsg && (
            <p className={`mt-3 text-sm font-mono ${ status === 'error' ? 'text-red-400' : status === 'success' ? 'text-green-400' : 'text-gray-400' }`}>
              {statusMsg}
            </p>
          )}
        </div>

        {/* My Domains */}
        {isConnected && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-lg font-bold text-white">MY DOMAINS</h2>
              <button onClick={loadOwnedDomains} disabled={loadingOwned} className="text-xs font-mono text-gray-500 hover:text-green-400 transition-colors disabled:opacity-40">
                {loadingOwned ? 'LOADING...' : 'REFRESH'}
              </button>
            </div>
            {loadingOwned ? (
              <p className="text-gray-500 font-mono text-sm">Loading...</p>
            ) : ownedDomains.length === 0 ? (
              <p className="text-gray-500 font-mono text-sm">No domains yet. Register your first one above!</p>
            ) : (
              <div className="space-y-3">
                {ownedDomains.map(d => (
                  <div key={`${d.nftTokenId}-${d.nftSerial}`} className="flex items-center justify-between p-3 rounded-xl border border-gray-700">
                    <div>
                      <p className="font-mono text-green-400 font-bold">{d.domain}</p>
                      <p className="text-gray-500 text-xs mt-1">Expires {formatExpiry(d.expiresAt)}</p>
                    </div>
                    <span className="text-xs font-mono text-gray-600">#{d.nftSerial}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
