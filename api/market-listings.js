// GET /api/market-listings
// Proxies SentX public market listings, always filtered to the SLIME NFT token.
// Optional query params: sortBy, sortDirection, limit, offset, filterUserAccount
const SLIME_TOKEN = '0.0.9474754'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const {
    sortBy = 'price',
    sortDirection = 'ASC',
    limit = '100',
    offset = '0',
    filterUserAccount,
  } = req.query

  const params = new URLSearchParams({ apikey, token: SLIME_TOKEN, sortBy, sortDirection, limit, offset })
  if (filterUserAccount) params.set('filterUserAccount', filterUserAccount)

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/public/market/listings?${params}`)
    const data = await upstream.json()
    res.setHeader('Cache-Control', filterUserAccount ? 'no-store' : 's-maxage=30, stale-while-revalidate=60')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
