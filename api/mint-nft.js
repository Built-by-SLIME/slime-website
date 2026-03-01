// GET /api/mint-nft?user_address=&mintCode=&price=
// Proxies SentX affiliate mintnft endpoint — returns transBytes + saleVerificationCode
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { user_address, mintCode, price } = req.query
  if (!user_address || !mintCode || !price) {
    return res.status(400).json({ error: 'Missing required parameters: user_address, mintCode, price' })
  }

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  try {
    const params = new URLSearchParams({ apikey, user_address, mintCode, price })
    const upstream = await fetch(`https://api.sentx.io/v1/affiliate/launchpad/mintnft?${params}`, { method: 'POST' })
    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
