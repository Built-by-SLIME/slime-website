// POST /api/market-unlist
// Initiates an NFT unlisting. Returns transBytes (revoke allowance tx) + saleVerificationCode.
// Body: { serial_number, user_address }
const SLIME_TOKEN = '0.0.9474754'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const { serial_number, user_address } = req.body
  if (!serial_number || !user_address) {
    return res.status(400).json({ error: 'Missing required parameters: serial_number, user_address' })
  }

  const body = new URLSearchParams({
    token_address: SLIME_TOKEN,
    serial_number: String(serial_number),
    user_address,
  })

  try {
    const upstream = await fetch(`https://api.sentx.io/v1/affiliate/market/unlistnft?apikey=${encodeURIComponent(apikey)}`, {
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
