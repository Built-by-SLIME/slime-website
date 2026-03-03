// GET /api/market-floor
// Returns the current floor price for the SLIME NFT collection.
const SLIME_TOKEN = '0.0.9474754'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const params = new URLSearchParams({ apikey, token: SLIME_TOKEN })

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/public/market/floor?${params}`)
    const data = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
