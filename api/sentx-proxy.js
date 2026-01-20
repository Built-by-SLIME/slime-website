// Vercel Serverless Function: GET /api/sentx-proxy
// Proxies SentX API requests to avoid CORS issues

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { apikey, token, limit, page, sortBy, sortDirection } = req.query

    if (!apikey || !token) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const url = `https://api.sentx.io/v1/public/token/nfts?apikey=${apikey}&token=${token}&limit=${limit || 100}&page=${page || 1}&sortBy=${sortBy || 'rarity'}&sortDirection=${sortDirection || 'ASC'}`

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`SentX API error: ${response.status}`)
    }

    const data = await response.json()

    // Set CORS headers to allow frontend access
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    return res.status(200).json(data)
  } catch (error) {
    console.error('SentX proxy error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch from SentX',
      message: error.message 
    })
  }
}

