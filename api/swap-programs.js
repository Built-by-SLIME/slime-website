// GET /api/swap-programs
// Proxies Railway swap programs public endpoint
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const upstream = await fetch('https://hedera-nft-toolkit-production.up.railway.app/api/swap-programs/public')
    const data = await upstream.json()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
