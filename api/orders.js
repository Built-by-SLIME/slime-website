// Vercel Serverless Function: POST /api/orders
// Creates orders in Printify API

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'

async function createPrintifyOrder(apiToken, shopId, orderData) {
  const url = `${PRINTIFY_API_BASE}/shops/${shopId}/orders.json`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SLIME-Website/1.0',
    },
    body: JSON.stringify(orderData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Printify API error (${response.status}): ${errorText}`)
  }

  return response.json()
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const apiToken = process.env.PRINTIFY_API_TOKEN
    const shopId = process.env.PRINTIFY_SHOP_ID
    
    if (!apiToken || !shopId) {
      return res.status(500).json({
        success: false,
        error: 'Missing Printify configuration',
        message: 'PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID not set'
      })
    }

    // Get order data from request body
    const orderData = req.body

    if (!orderData || !orderData.line_items || orderData.line_items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data',
        message: 'Order must contain at least one line item'
      })
    }

    // Create order in Printify
    const order = await createPrintifyOrder(apiToken, shopId, orderData)

    // Return created order
    return res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully. Note: Order is NOT automatically sent to production.'
    })
  } catch (error) {
    console.error('Error creating order in Printify:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error.message || 'Unknown error'
    })
  }
}

