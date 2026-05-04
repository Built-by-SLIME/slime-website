import { createClient } from '@supabase/supabase-js'

const SLIME_TOKEN = '0.0.9474754'
const SLIME_HTS   = '0.0.10294707'
const MIRROR_BASE = 'https://mainnet.mirrornode.hedera.com/api/v1'

async function getHederaData(wallet) {
  try {
    const [nftRes, balRes] = await Promise.allSettled([
      fetch(`${MIRROR_BASE}/accounts/${wallet}/nfts?token.id=${SLIME_TOKEN}&limit=1000`),
      fetch(`${MIRROR_BASE}/accounts/${wallet}`),
    ])

    let nftCount = 0
    if (nftRes.status === 'fulfilled' && nftRes.value.ok) {
      const d = await nftRes.value.json()
      nftCount = d.nfts?.length ?? 0
    }

    let slimeBalance = 0
    if (balRes.status === 'fulfilled' && balRes.value.ok) {
      const d = await balRes.value.json()
      const token = d.balance?.tokens?.find(t => t.token_id === SLIME_HTS)
      slimeBalance = token ? Number(token.balance) : 0
    }

    return { nftCount, slimeBalance }
  } catch {
    return { nftCount: 0, slimeBalance: 0 }
  }
}

// GET /api/leaderboard
// Returns all linked users enriched with live Hedera data, sorted by NFT count desc.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Server not configured' })

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: users, error } = await supabase
    .from('leaderboard_users')
    .select('x_user_id, x_username, x_avatar_url, wallet_address, linked_at')
    .order('linked_at', { ascending: true })

  if (error) return res.status(500).json({ error: 'Failed to fetch leaderboard' })

  // Enrich each user with live on-chain data in parallel
  const enriched = await Promise.all(
    users.map(async (u) => {
      const { nftCount, slimeBalance } = await getHederaData(u.wallet_address)
      return { ...u, nftCount, slimeBalance }
    })
  )

  // Sort by NFT count desc, then $SLIME balance desc
  enriched.sort((a, b) => b.nftCount - a.nftCount || b.slimeBalance - a.slimeBalance)

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
  return res.status(200).json({ leaderboard: enriched })
}
