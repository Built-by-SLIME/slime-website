// GET /api/market-activity
// Returns recent market activity (sales and listings) for the SLIME NFT collection.
// Optional query params: amount, page, activityFilter (Sales | Listings | All)
const SLIME_TOKEN = '0.0.9474754'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const { amount = '50', page = '1', activityFilter = 'All' } = req.query
  const params = new URLSearchParams({
    apikey,
    token: SLIME_TOKEN,
    amount,
    page,
    activityFilter,
    hbarMarketOnly: '1',
  })

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/public/market/activity?${params}`)
    const data = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
