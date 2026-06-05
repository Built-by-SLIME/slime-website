import { useState, type ReactNode } from 'react'

const API_BASE = 'https://api.slime.tools/api/v1/external'
const API_KEY  = '4790831456f307dd84e8b3aaeccbf19de0c9e2be85d0b993a3939fbb48b8644e'
const PROGRAM_ID = '85039cca3ef4ec78fa3ce10009c7b6d3333226385718be15ba66e58ee7521dd8'

const headers = { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers: { ...headers, ...opts?.headers } })
  const text = await res.text()
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) } }
  catch { return { ok: res.ok, status: res.status, data: text } }
}

function ResultBox({ label, result }: { label: string; result: unknown }) {
  return (
    <div className="mt-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <pre className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 text-xs text-green-300 overflow-auto max-h-64 whitespace-pre-wrap break-all">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
      <h2 className="text-white font-bold text-base">{title}</h2>
      {children}
    </div>
  )
}

function Btn({ onClick, loading, children }: { onClick: () => void; loading?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="bg-[#00ff40] text-black font-bold text-sm px-4 py-2 rounded-lg hover:bg-[#00e639] disabled:opacity-50 transition w-fit"
    >
      {loading ? 'Loading…' : children}
    </button>
  )
}

export default function StakingApiTestPage() {
  const [wallet, setWallet] = useState('0.0.9348822')
  const [results, setResults] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setLoading(l => ({ ...l, [key]: true }))
    try {
      const result = await fn()
      setResults(r => ({ ...r, [key]: result }))
    } catch (e) {
      setResults(r => ({ ...r, [key]: String(e) }))
    } finally {
      setLoading(l => ({ ...l, [key]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6 font-mono">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-[#00ff40] font-black text-2xl">Staking API — Test Page</h1>
          <p className="text-gray-500 text-xs mt-1">Hidden route · not linked from nav · delete when done</p>
          <p className="text-gray-600 text-xs mt-1 break-all">Program: {PROGRAM_ID}</p>
        </div>

        {/* Wallet input */}
        <div className="flex gap-2 items-center">
          <input
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            placeholder="Wallet (0.0.xxxxx)"
            className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm flex-1 focus:outline-none focus:border-[#00ff40]"
          />
          <span className="text-gray-600 text-xs">used for wallet endpoints</span>
        </div>

        <Card title="GET /staking-programs — List programs">
          <Btn loading={loading['list']} onClick={() => run('list', () => apiFetch('/staking-programs'))}>Run</Btn>
          {results['list'] && <ResultBox label="Response" result={results['list']} />}
        </Card>

        <Card title="GET /staking-programs/{id} — Program details + stats">
          <Btn loading={loading['details']} onClick={() => run('details', () => apiFetch(`/staking-programs/${PROGRAM_ID}`))}>Run</Btn>
          {results['details'] && <ResultBox label="Response" result={results['details']} />}
        </Card>

        <Card title="GET /staking-programs/{id}/participants — Participant list">
          <Btn loading={loading['participants']} onClick={() => run('participants', () => apiFetch(`/staking-programs/${PROGRAM_ID}/participants`))}>Run</Btn>
          {results['participants'] && <ResultBox label="Response" result={results['participants']} />}
        </Card>

        <Card title="GET /staking-programs/{id}/distributions — Distribution history">
          <Btn loading={loading['distributions']} onClick={() => run('distributions', () => apiFetch(`/staking-programs/${PROGRAM_ID}/distributions`))}>Run</Btn>
          {results['distributions'] && <ResultBox label="Response" result={results['distributions']} />}
        </Card>

        <Card title="GET /staking-programs/{id}/eligibility/{accountId} — Check eligibility">
          <Btn loading={loading['eligibility']} onClick={() => run('eligibility', () => apiFetch(`/staking-programs/${PROGRAM_ID}/eligibility/${wallet}`))}>Run</Btn>
          {results['eligibility'] && <ResultBox label="Response" result={results['eligibility']} />}
        </Card>

        <Card title="GET /staking-programs/{id}/position/{accountId} — Wallet position">
          <Btn loading={loading['position']} onClick={() => run('position', () => apiFetch(`/staking-programs/${PROGRAM_ID}/position/${wallet}`))}>Run</Btn>
          {results['position'] && <ResultBox label="Response" result={results['position']} />}
        </Card>

        <Card title="POST /staking-programs/{id}/register — Register wallet + trigger drip">
          <p className="text-yellow-400 text-xs">⚠ This registers the wallet above and triggers an immediate reward drip.</p>
          <Btn loading={loading['register']} onClick={() => run('register', () => apiFetch(`/staking-programs/${PROGRAM_ID}/register`, { method: 'POST', body: JSON.stringify({ accountId: wallet }) }))}>Run</Btn>
          {results['register'] && <ResultBox label="Response" result={results['register']} />}
        </Card>
      </div>
    </div>
  )
}
