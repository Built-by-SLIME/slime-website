/**
 * Simple test endpoint to check if SentX API is working
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { apikey, token } = req.query

    if (!apikey || !token) {
      return res.status(400).json({ error: 'Missing apikey or token' })
    }

    console.log('Testing SentX API with token:', token)

    // Try fetching just the first page
    const url = `https://api.sentx.io/v1/public/token/nfts?apikey=${apikey}&token=${token}&limit=10&page=1&sortBy=serialId&sortDirection=ASC`
    
    console.log('Fetching from:', url)
    
    const response = await fetch(url)
    
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('SentX error response:', errorText)
      return res.status(500).json({
        success: false,
        error: `SentX API returned ${response.status}`,
        details: errorText
      })
    }

    const data = await response.json()
    
    console.log('Got data:', {
      success: data.success,
      nftCount: data.nfts?.length,
      total: data.total
    })

    return res.status(200).json({
      success: true,
      message: 'SentX API is working',
      sampleData: {
        nftCount: data.nfts?.length || 0,
        total: data.total,
        firstNFT: data.nfts?.[0] || null
      }
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}

