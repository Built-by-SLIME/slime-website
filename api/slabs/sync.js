import { createClient } from '@supabase/supabase-js'

// POST /api/slabs/sync  (also accepts GET for Vercel cron)
//
// Reconciles the slab_claims DB against on-chain state.
// Any slab serial no longer held by the operator wallet is considered claimed.
// Missing DB records are backfilled so the DB stays the authoritative source of truth.
//
// Auth:
//   Manual run  → Authorization: Bearer <SYNC_SECRET>
//   Vercel cron → x-vercel-cron-secret: <CRON_SECRET>  (set in Vercel env vars)

const SLAB_TOKEN  = '0.0.10480544'
const OPERATOR_ID = '0.0.9348822'
const MIRROR_BASE = 'https://mainnet.mirrornode.hedera.com/api/v1'

async function fetchAllSlabNFTs() {
  const nfts = []
  let url = `${MIRROR_BASE}/tokens/${SLAB_TOKEN}/nfts?limit=100&order=asc`
  while (url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Mirror Node responded ${res.status} fetching slab NFTs`)
    const data = await res.json()
    nfts.push(...(data.nfts || []))
    url = data.links?.next
      ? `https://mainnet.mirrornode.hedera.com${data.links.next}`
      : null
  }
  return nfts
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Auth — manual bearer token OR Vercel cron secret
  const authHeader  = req.headers['authorization'] || ''
  const cronHeader  = req.headers['x-vercel-cron-secret'] || ''
  const isManual    = process.env.SYNC_SECRET && authHeader === `Bearer ${process.env.SYNC_SECRET}`
  const isCron      = process.env.CRON_SECRET  && cronHeader === process.env.CRON_SECRET
  if (!isManual && !isCron) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Server not configured' })

  try {
    // 1. Fetch every slab NFT from mirror node
    const allNFTs = await fetchAllSlabNFTs()

    // 2. Claimed on-chain = no longer held by operator
    const claimedOnChain = allNFTs
      .filter(n => n.account_id !== OPERATOR_ID)
      .map(n => ({ serial: Number(n.serial_number), holder: n.account_id }))

    if (claimedOnChain.length === 0) {
      return res.status(200).json({
        success: true, synced: 0,
        message: 'All slabs still in operator wallet — DB is current.',
      })
    }

    // 3. Check which of those are already recorded in DB
    const supabase = createClient(supabaseUrl, supabaseKey)
    const onChainSerials = claimedOnChain.map(c => c.serial)
    const { data: existing, error: selectErr } = await supabase
      .from('slab_claims')
      .select('slime_serial')
      .in('slime_serial', onChainSerials)
    if (selectErr) throw new Error(`DB read failed: ${selectErr.message}`)

    const inDb = new Set((existing || []).map(r => r.slime_serial))

    // 4. Find the gap — claimed on-chain but missing from DB
    const missing = claimedOnChain.filter(c => !inDb.has(c.serial))

    if (missing.length === 0) {
      return res.status(200).json({
        success: true, synced: 0,
        message: 'DB is fully in sync with on-chain state.',
      })
    }

    // 5. Backfill missing records
    const records = missing.map(c => ({
      slime_serial:   c.serial,
      claimed_by:     c.holder,         // current on-chain holder
      payment_tx_id:  'backfill-sync',  // historical — payment tx unknown
      slab_tx_ids:    [],
      claimed_at:     new Date().toISOString(),
    }))

    const { error: insertErr } = await supabase
      .from('slab_claims')
      .upsert(records, { onConflict: 'slime_serial' })
    if (insertErr) throw new Error(`DB backfill failed: ${insertErr.message}`)

    console.log(`[slabs/sync] Backfilled ${missing.length} records:`, missing.map(c => c.serial))

    return res.status(200).json({
      success: true,
      synced: missing.length,
      serials: missing.map(c => c.serial),
      message: `Backfilled ${missing.length} missing claim record(s) into DB.`,
    })
  } catch (err) {
    console.error('[slabs/sync] Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
