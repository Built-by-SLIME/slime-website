// Vercel Serverless Function: GET /api/products
// Fetches products from Printify API with caching

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'

// Cache configuration
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
let cachedProducts = null
let cacheTimestamp = 0

async function fetchPrintifyProducts(apiToken, shopId, page = 1, limit = 50) {
  const url = `${PRINTIFY_API_BASE}/shops/${shopId}/products.json?page=${page}&limit=${limit}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SLIME-Website/1.0',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Printify API error (${response.status}): ${errorText}`)
  }

  return response.json()
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const now = Date.now()

    // Return cached data if still fresh
    if (cachedProducts && (now - cacheTimestamp) < CACHE_TTL) {
      console.log('Returning cached products (age:', Math.round((now - cacheTimestamp) / 1000), 'seconds)')
      return res.status(200).json(cachedProducts)
    }

    // Check if environment variables are set
    const apiToken = process.env.PRINTIFY_API_TOKEN
    const shopId = process.env.PRINTIFY_SHOP_ID

    console.log('Environment check:', {
      hasToken: !!apiToken,
      hasShopId: !!shopId,
      nodeVersion: process.version
    })

    if (!apiToken || !shopId) {
      return res.status(500).json({
        success: false,
        error: 'Missing Printify configuration',
        message: 'PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID not set in environment variables',
        debug: {
          hasToken: !!apiToken,
          hasShopId: !!shopId
        }
      })
    }

    // Get page and limit from query params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50

    console.log('Fetching fresh products from Printify...')

    // Fetch products from Printify
    const productsData = await fetchPrintifyProducts(apiToken, shopId, page, limit)

    // Filter out products that are not visible
    const visibleProducts = productsData.data.filter(product => product.visible === true)

    // Build response
    const response = {
      success: true,
      data: visibleProducts,
      pagination: {
        current_page: productsData.current_page,
        total: visibleProducts.length,
      }
    }

    // Cache the response
    cachedProducts = response
    cacheTimestamp = now
    console.log('Products cached for', CACHE_TTL / 1000, 'seconds')

    // Return products
    return res.status(200).json(response)
  } catch (error) {
    console.error('Error fetching products from Printify:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message || 'Unknown error',
      stack: error.stack
    })
  }
}

