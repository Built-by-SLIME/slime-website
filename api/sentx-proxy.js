// Vercel Serverless Function: GET /api/sentx-proxy
// Proxies SentX API requests to avoid CORS issues with caching

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cache = new Map()

// Clean up old cache entries periodically
function cleanupCache() {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key)
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { apikey, token, limit, page, sortBy, sortDirection } = req.query

    if (!apikey || !token) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    // Create cache key from query parameters
    const cacheKey = `${token}-${limit || 100}-${page || 1}-${sortBy || 'rarity'}-${sortDirection || 'ASC'}`
    const now = Date.now()

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log('Returning cached SentX data (age:', Math.round((now - cached.timestamp) / 1000), 'seconds)')

      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      return res.status(200).json(cached.data)
    }

    console.log('Fetching fresh data from SentX...')

    const url = `https://api.sentx.io/v1/public/token/nfts?apikey=${apikey}&token=${token}&limit=${limit || 100}&page=${page || 1}&sortBy=${sortBy || 'rarity'}&sortDirection=${sortDirection || 'ASC'}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`SentX API error: ${response.status}`)
    }

    const data = await response.json()

    // Cache the response
    cache.set(cacheKey, { data, timestamp: now })
    console.log('SentX data cached for', CACHE_TTL / 1000, 'seconds')

    // Cleanup old cache entries (don't let cache grow indefinitely)
    if (cache.size > 50) {
      cleanupCache()
    }

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

