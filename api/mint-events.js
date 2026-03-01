// GET /api/mint-events
// Proxies SentX public mintevents endpoint, filtered to SLIME NFT token
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  try {
    const params = new URLSearchParams({ apikey, tokenAddress: '0.0.9474754' })
    const upstream = await fetch(`https://api.sentx.io/v1/public/launchpad/mintevents?${params}`)
    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
