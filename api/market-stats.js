// GET /api/market-stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns per-period market stats for the SLIME NFT collection from SentX.
const SLIME_TOKEN = '0.0.9474754'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const { startDate, endDate } = req.query
  if (!startDate || !endDate) return res.status(400).json({ error: 'Missing required params: startDate, endDate' })

  const params = new URLSearchParams({ apikey, token: SLIME_TOKEN, startDate, endDate, limit: '500', page: '1' })

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/public/market/stats/token?${params}`)
    const data = await upstream.json()
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
