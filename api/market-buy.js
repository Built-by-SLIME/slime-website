// POST /api/market-buy
// Initiates an NFT purchase. Returns transBytes (for wallet signing) + saleVerificationCode.
// Body: { token_address, serial_number, user_address, price }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const { token_address, serial_number, user_address, price } = req.body
  if (!token_address || !serial_number || !user_address || !price) {
    return res.status(400).json({ error: 'Missing required parameters: token_address, serial_number, user_address, price' })
  }

  const params = new URLSearchParams({
    apikey,
    token_address,
    serial_number: String(serial_number),
    user_address,
    price: String(price),
  })

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/affiliate/market/buynft?${params}`, {
      method: 'POST',
    })
    const data = await upstream.json()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
