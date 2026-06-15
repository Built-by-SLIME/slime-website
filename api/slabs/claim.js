import { createClient } from '@supabase/supabase-js'
import { Client, PrivateKey, AccountId, TransferTransaction, TokenId } from '@hashgraph/sdk'

// Operator account 0.0.9348822 is confirmed ECDSA_SECP256K1 via Mirror Node.
// PrivateKey.fromString() silently misparses raw ECDSA hex as ED25519 — must use fromStringECDSA.
function parsePrivateKey(raw) {
  return PrivateKey.fromStringECDSA(raw.trim())
}

const SLIME_TOKEN    = '0.0.9474754'
const SLAB_TOKEN     = '0.0.10480544'
const OPERATOR_ID    = '0.0.9348822'
const MIRROR_BASE    = 'https://mainnet.mirrornode.hedera.com/api/v1'
const FEE_TINYBARS   = 5_000_000   // 0.05 HBAR per slab
const BATCH_SIZE     = 10           // max NFT transfers per Hedera tx

// Convert SDK tx ID (0.0.123@1234567890.123456789) → Mirror Node format (0.0.123-1234567890-123456789)
function toMirrorTxId(txId) {
  return txId.replace('@', '-').replace(/\.(\d{9})$/, '-$1')
}

// Verify the HBAR payment tx on Mirror Node (retries to handle indexing lag)
async function verifyPayment(paymentTxId, wallet, numSerials) {
  const mirrorId = toMirrorTxId(paymentTxId)
  // Initial wait — Mirror Node typically takes 5–15s to index mainnet txs
  await new Promise(r => setTimeout(r, 3000))
  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 3000))
    try {
      const res = await fetch(`${MIRROR_BASE}/transactions/${encodeURIComponent(mirrorId)}`)
      if (!res.ok) continue
      const data = await res.json()
      const tx = data.transactions?.[0]
      if (!tx) continue
      if (tx.result !== 'SUCCESS') return { ok: false, reason: `Transaction failed on-chain: ${tx.result}` }

      // Verify credit to operator ≥ expected fee
      const operatorCredit = (tx.transfers || []).find(t => t.account === OPERATOR_ID && t.amount > 0)
      if (!operatorCredit) return { ok: false, reason: 'No payment to operator found in this transaction' }

      const expected = numSerials * FEE_TINYBARS
      if (operatorCredit.amount < expected) {
        return { ok: false, reason: `Underpayment: expected ${expected} tinybars, received ${operatorCredit.amount}` }
      }

      // Verify sender matches claimer
      const senderDebit = (tx.transfers || []).find(t => t.account === wallet && t.amount < 0)
      if (!senderDebit) return { ok: false, reason: 'Payment was not sent from the claiming wallet' }

      return { ok: true }
    } catch { continue }
  }
  return { ok: false, reason: 'Transaction not found on Mirror Node — please wait a moment and retry.' }
}

// Verify wallet still holds each SLIME serial
async function findUnownedSerials(wallet, serials) {
  const results = await Promise.all(serials.map(async serial => {
    try {
      const res = await fetch(`${MIRROR_BASE}/tokens/${SLIME_TOKEN}/nfts/${serial}`)
      if (!res.ok) return false
      const data = await res.json()
      return data.account_id === wallet
    } catch { return false }
  }))
  return serials.filter((_, i) => !results[i])
}

// Check wallet is associated with the Slab token
async function isAssociated(wallet) {
  try {
    const res = await fetch(`${MIRROR_BASE}/accounts/${wallet}/tokens?token.id=${SLAB_TOKEN}`)
    if (!res.ok) return false
    const data = await res.json()
    return (data.tokens || []).some(t => t.token_id === SLAB_TOKEN)
  } catch { return false }
}

// Transfer slabs in batches of BATCH_SIZE
async function transferSlabs(client, wallet, serials) {
  const txIds = []
  for (let i = 0; i < serials.length; i += BATCH_SIZE) {
    const batch = serials.slice(i, i + BATCH_SIZE)
    const tx = new TransferTransaction()
    for (const serial of batch) {
      tx.addNftTransfer(TokenId.fromString(SLAB_TOKEN), serial, AccountId.fromString(OPERATOR_ID), AccountId.fromString(wallet))
    }
    const response = await tx.execute(client)
    const receipt = await response.getReceipt(client)
    if (receipt.status.toString() !== 'SUCCESS') {
      throw new Error(`Slab transfer failed (batch ${Math.floor(i / BATCH_SIZE) + 1}): ${receipt.status}`)
    }
    txIds.push(response.transactionId.toString())
  }
  return txIds
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { wallet, serials, paymentTxId } = req.body || {}
  if (!wallet || !Array.isArray(serials) || serials.length === 0 || !paymentTxId) {
    return res.status(400).json({ error: 'Missing required fields: wallet, serials, paymentTxId' })
  }
  if (serials.length > 500) return res.status(400).json({ error: 'Too many serials (max 500 per request)' })

  const supabaseUrl    = process.env.SUPABASE_URL
  const supabaseKey    = process.env.SUPABASE_SERVICE_KEY
  const operatorKey    = process.env.OPERATOR_PRIVATE_KEY
  if (!supabaseUrl || !supabaseKey || !operatorKey) {
    return res.status(500).json({ error: 'Server not fully configured — missing env vars' })
  }

  // 1. Verify payment
  const paymentCheck = await verifyPayment(paymentTxId, wallet, serials.length)
  if (!paymentCheck.ok) return res.status(400).json({ error: paymentCheck.reason })

  // 2. Verify ownership
  const notOwned = await findUnownedSerials(wallet, serials)
  if (notOwned.length > 0) {
    return res.status(400).json({ error: `You no longer hold SLIME #${notOwned.join(', #')}` })
  }

  // 3. Check Slab token association
  const associated = await isAssociated(wallet)
  if (!associated) {
    return res.status(400).json({
      error: 'Wallet not associated with SLIME Slabs (0.0.10480544). Please associate in HashPack or Kabila first.',
    })
  }

  // 4. Filter out already-claimed serials
  //    Two-layer check: DB (fast) + operator wallet (on-chain truth, catches DB gaps)
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: existing } = await supabase.from('slab_claims').select('slime_serial').in('slime_serial', serials)
  const alreadyClaimed = new Set((existing || []).map(r => r.slime_serial))

  // For serials not in DB, verify the operator wallet actually still holds the slab
  const notInDb = serials.filter(s => !alreadyClaimed.has(s))
  const operatorChecks = await Promise.all(notInDb.map(async serial => {
    try {
      const r = await fetch(`${MIRROR_BASE}/tokens/${SLAB_TOKEN}/nfts/${serial}`)
      if (!r.ok) return { serial, available: false }
      const d = await r.json()
      return { serial, available: d.account_id === OPERATOR_ID }
    } catch { return { serial, available: false } }
  }))

  const unavailableOnChain = new Set(operatorChecks.filter(c => !c.available).map(c => c.serial))

  // Log any DB gaps detected (slab gone from operator wallet but no DB record — sync will fix nightly)
  const dbGaps = operatorChecks.filter(c => !c.available)
  if (dbGaps.length > 0) {
    console.error('[slabs/claim] DB sync gap detected — claimed on-chain but missing from DB:', dbGaps.map(c => c.serial))
  }

  const claimable = notInDb.filter(s => !unavailableOnChain.has(s))
  if (claimable.length === 0) return res.status(400).json({ error: 'All selected slabs have already been claimed.' })

  // 5. Transfer slabs from operator
  let parsedKey
  try {
    parsedKey = parsePrivateKey(operatorKey)
  } catch (err) {
    return res.status(500).json({ error: `Key parse error: ${err.message}` })
  }
  const client = Client.forMainnet()
  client.setOperator(AccountId.fromString(OPERATOR_ID), parsedKey)
  let slabTxIds
  try {
    slabTxIds = await transferSlabs(client, wallet, claimable)
  } catch (err) {
    return res.status(500).json({ error: `Slab transfer failed: ${err.message}` })
  }

  // 6. Record claims — upsert with 3-attempt retry + exponential backoff
  //    Uses upsert (not insert) so a duplicate serial never causes a silent failure.
  const records = claimable.map(serial => ({
    slime_serial: serial,
    claimed_by: wallet,
    payment_tx_id: paymentTxId,
    slab_tx_ids: slabTxIds,
    claimed_at: new Date().toISOString(),
  }))

  let dbError = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase
      .from('slab_claims')
      .upsert(records, { onConflict: 'slime_serial' })
    if (!error) { dbError = null; break }
    dbError = error
    if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
  }
  if (dbError) {
    // Slabs were already transferred on-chain — nightly sync will backfill this record.
    console.error('CRITICAL [slabs/claim]: DB write failed after 3 attempts — slabs transferred but not recorded:', {
      wallet, serials: claimable, txIds: slabTxIds, error: dbError.message,
    })
  }

  return res.status(200).json({ success: true, claimed: claimable, txIds: slabTxIds })
}
