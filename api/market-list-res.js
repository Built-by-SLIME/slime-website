// GET /api/market-list-res?saleVerificationCode=
// Called after the user has successfully signed the listing allowance transaction.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const { saleVerificationCode } = req.query
  if (!saleVerificationCode) return res.status(400).json({ error: 'Missing saleVerificationCode' })

  const params = new URLSearchParams({ apikey, saleVerificationCode })

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/affiliate/market/listnftres?${params}`, {
      method: 'POST',
    })
    const data = await upstream.json()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
