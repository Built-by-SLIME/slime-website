// GET /api/mint-nft-res?user_address=&saleVerificationCode=
// Called after user has signed the transaction from mintnft.
// Executes the actual NFT transfer and returns the minted NFT details.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { user_address, saleVerificationCode } = req.query
  if (!user_address || !saleVerificationCode) {
    return res.status(400).json({ error: 'Missing required parameters: user_address, saleVerificationCode' })
  }

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  try {
    const params = new URLSearchParams({ apikey, user_address, saleVerificationCode })
    const upstream = await fetch(`https://api.sentx.io/v1/affiliate/launchpad/mintnftres?${params}`)
    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
