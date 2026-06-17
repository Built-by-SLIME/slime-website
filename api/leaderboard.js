import { createClient } from '@supabase/supabase-js'

const SLIME_TOKEN = '0.0.9474754'
const SLIME_HTS   = '0.0.10294707'
const MIRROR_BASE = 'https://mainnet.mirrornode.hedera.com/api/v1'

async function getHederaData(wallet) {
  try {
    // Paginate NFT results — Mirror Node hard-caps at 100 per page regardless of limit param
    const balPromise = fetch(`${MIRROR_BASE}/accounts/${wallet}`)
    let nftCount = 0
    let nftUrl = `${MIRROR_BASE}/accounts/${wallet}/nfts?token.id=${SLIME_TOKEN}&limit=100`
    while (nftUrl) {
      const res = await fetch(nftUrl)
      if (!res.ok) break
      const d = await res.json()
      nftCount += d.nfts?.length ?? 0
      nftUrl = d.links?.next ? `https://mainnet.mirrornode.hedera.com${d.links.next}` : null
    }

    const balRes = await balPromise

    let slimeBalance = 0
    if (balRes.ok) {
      const d = await balRes.json()
      const token = d.balance?.tokens?.find(t => t.token_id === SLIME_HTS)
      slimeBalance = token ? Number(token.balance) : 0
    }

    return { nftCount, slimeBalance }
  } catch {
    return { nftCount: 0, slimeBalance: 0 }
  }
}

// Fetch fresh avatar URLs from the X API using app-level Bearer token.
// Returns a map of { x_user_id -> fresh_avatar_url }.
// Also fires-and-forgets Supabase updates so stored URLs stay current.
async function refreshAvatars(users, supabase) {
  const bearerToken = process.env.X_BEARER_TOKEN
  if (!bearerToken || users.length === 0) return {}

  try {
    // X API v2 supports up to 100 ids per request
    const ids = users.map(u => u.x_user_id).slice(0, 100).join(',')
    const xRes = await fetch(
      `https://api.twitter.com/2/users?ids=${ids}&user.fields=profile_image_url`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    )
    if (!xRes.ok) return {}

    const { data } = await xRes.json()
    if (!data) return {}

    const avatarMap = {}
    const updates = data
      .filter(u => u.profile_image_url)
      .map(u => {
        const url = u.profile_image_url.replace('_normal', '_400x400')
        avatarMap[u.id] = url
        // Update Supabase in the background — don't await
        return supabase
          .from('leaderboard_users')
          .update({ x_avatar_url: url })
          .eq('x_user_id', u.id)
      })

    Promise.all(updates).catch(() => {})
    return avatarMap
  } catch {
    return {}
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

  // Fetch fresh avatars from X API and enrich Hedera data in parallel
  const [avatarMap, hederaResults] = await Promise.all([
    refreshAvatars(users, supabase),
    Promise.all(users.map(u => getHederaData(u.wallet_address))),
  ])

  const enriched = users.map((u, i) => ({
    ...u,
    // Use fresh avatar from X API if available, else fall back to stored value
    x_avatar_url: avatarMap[u.x_user_id] ?? u.x_avatar_url,
    nftCount: hederaResults[i].nftCount,
    slimeBalance: hederaResults[i].slimeBalance,
  }))

  // Hide users who no longer hold any SLIME NFTs
  const activeHolders = enriched.filter(u => u.nftCount > 0)

  // Sort by NFT count desc, then $SLIME balance desc
  activeHolders.sort((a, b) => b.nftCount - a.nftCount || b.slimeBalance - a.slimeBalance)

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
  return res.status(200).json({ leaderboard: activeHolders })
}
