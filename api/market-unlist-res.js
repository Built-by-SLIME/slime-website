// GET /api/market-unlist-res?saleVerificationCode=
// Called after the user has successfully signed the unlist transaction.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const { saleVerificationCode } = req.query
  if (!saleVerificationCode) return res.status(400).json({ error: 'Missing saleVerificationCode' })

  const body = new URLSearchParams({ saleVerificationCode })

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/affiliate/market/unlistnftres?apikey=${encodeURIComponent(apikey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await upstream.json()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
