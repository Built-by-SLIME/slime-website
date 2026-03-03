// GET /api/market-offers
// Returns active marketplace offers for the SLIME NFT collection.
// Optional query params: page, limit, filterUserAccount
const SLIME_TOKEN = '0.0.9474754'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const { page = '1', limit = '50', filterUserAccount } = req.query
  const params = new URLSearchParams({ apikey, token: SLIME_TOKEN, page, limit, statusFilterTypeId: '0' })
  if (filterUserAccount) params.set('filterUserAccount', filterUserAccount)

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/public/market/offers?${params}`)
    const data = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
