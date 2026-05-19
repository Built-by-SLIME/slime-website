// GET /api/market-floor
// Returns the current floor price for the requested token (defaults to SLIME).
// Optional query param: token
const SLIME_TOKEN = '0.0.9474754'
const ALLOWED_TOKENS = new Set([SLIME_TOKEN, '0.0.10480544'])

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const token = ALLOWED_TOKENS.has(req.query.token) ? req.query.token : SLIME_TOKEN
  const params = new URLSearchParams({ apikey, token })

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/public/market/floor?${params}`)
    const data = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
