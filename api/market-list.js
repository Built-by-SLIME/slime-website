// POST /api/market-list
// Initiates an NFT listing. Returns transBytes (allowance approval tx) + saleVerificationCode.
// token_address is always hardcoded to the SLIME NFT.
// Body: { serial_number, price, user_address }
const SLIME_TOKEN = '0.0.9474754'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const { serial_number, price, user_address } = req.body
  if (!serial_number || !price || !user_address) {
    return res.status(400).json({ error: 'Missing required parameters: serial_number, price, user_address' })
  }

  const params = new URLSearchParams({
    apikey,
    token_address: SLIME_TOKEN,
    serial_number: String(serial_number),
    price: String(price),
    user_address,
  })

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/affiliate/market/listnft?${params}`, {
      method: 'POST',
    })
    const data = await upstream.json()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
