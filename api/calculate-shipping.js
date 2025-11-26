// Vercel Serverless Function: POST /api/calculate-shipping
// Calculates shipping costs from Printify API

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'

async function calculatePrintifyShipping(apiToken, shopId, orderData) {
  const url = `${PRINTIFY_API_BASE}/shops/${shopId}/orders/shipping.json`
  
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
    // Check if environment variables are set
    const apiToken = process.env.PRINTIFY_API_TOKEN
    const shopId = process.env.PRINTIFY_SHOP_ID
    
    if (!apiToken || !shopId) {
      return res.status(500).json({
        success: false,
        error: 'Missing Printify configuration',
        message: 'PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID not set in environment variables'
      })
    }

    // Get order data from request body
    const { line_items, address_to } = req.body

    if (!line_items || !address_to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'line_items and address_to are required'
      })
    }

    // Validate line_items
    if (!Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid line_items',
        message: 'line_items must be a non-empty array'
      })
    }

    // Validate address_to
    const requiredAddressFields = ['first_name', 'last_name', 'country', 'city', 'zip', 'address1']
    const missingFields = requiredAddressFields.filter(field => !address_to[field])
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing address fields',
        message: `Required fields: ${missingFields.join(', ')}`
      })
    }

    // Calculate shipping from Printify
    const shippingCosts = await calculatePrintifyShipping(apiToken, shopId, {
      line_items,
      address_to
    })

    // Transform response to include method names and codes
    const shippingOptions = [
      {
        code: 1,
        name: 'Standard',
        description: '5-7 business days',
        cost: shippingCosts.standard || 0,
        costFormatted: `$${((shippingCosts.standard || 0) / 100).toFixed(2)}`
      },
      {
        code: 2,
        name: 'Priority',
        description: '3-5 business days',
        cost: shippingCosts.priority || 0,
        costFormatted: `$${((shippingCosts.priority || 0) / 100).toFixed(2)}`
      },
      {
        code: 3,
        name: 'Express',
        description: '2-3 business days',
        cost: shippingCosts.express || shippingCosts.printify_express || 0,
        costFormatted: `$${((shippingCosts.express || shippingCosts.printify_express || 0) / 100).toFixed(2)}`
      },
      {
        code: 4,
        name: 'Economy',
        description: '7-14 business days',
        cost: shippingCosts.economy || 0,
        costFormatted: `$${((shippingCosts.economy || 0) / 100).toFixed(2)}`
      }
    ].filter(option => option.cost > 0) // Only return available shipping methods

    // Return shipping options
    return res.status(200).json({
      success: true,
      shippingOptions,
      raw: shippingCosts // Include raw response for debugging
    })
  } catch (error) {
    console.error('Error calculating shipping from Printify:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate shipping',
      message: error.message || 'Unknown error'
    })
  }
}

