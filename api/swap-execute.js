// POST /api/swap-execute?id={programId}
// Proxies Railway swap program execute endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing program id' })

  try {
    const upstream = await fetch(
      `https://hedera-nft-toolkit-production.up.railway.app/api/swap-programs/${id}/execute`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      }
    )
    const data = await upstream.json()
    res.setHeader('Cache-Control', 'no-store')
    return res.status(upstream.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
