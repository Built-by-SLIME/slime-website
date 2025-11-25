// Vercel Serverless Function: POST /api/confirm-order
// Confirms Stripe payment and creates + sends Printify order to production

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'

async function createAndSendPrintifyOrder(apiToken, shopId, orderData) {
  // Step 1: Create the order
  const createUrl = `${PRINTIFY_API_BASE}/shops/${shopId}/orders.json`
  
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SLIME-Website/1.0',
    },
    body: JSON.stringify(orderData),
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    throw new Error(`Printify create order error (${createResponse.status}): ${errorText}`)
  }

  const createdOrder = await createResponse.json()
  const orderId = createdOrder.id

  // Step 2: Send order to production
  const sendUrl = `${PRINTIFY_API_BASE}/shops/${shopId}/orders/${orderId}/send_to_production.json`
  
  const sendResponse = await fetch(sendUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SLIME-Website/1.0',
    },
  })

  if (!sendResponse.ok) {
    const errorText = await sendResponse.text()
    throw new Error(`Printify send to production error (${sendResponse.status}): ${errorText}`)
  }

  return createdOrder
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { paymentIntentId, orderData } = req.body

    // Validate required fields
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing payment intent ID'
      })
    }

    if (!orderData || !orderData.line_items || orderData.line_items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data',
        message: 'Order must contain at least one line item'
      })
    }

    // Verify the payment was successful
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
        message: `Payment status: ${paymentIntent.status}`
      })
    }

    // Get Printify credentials
    const apiToken = process.env.PRINTIFY_API_TOKEN
    const shopId = process.env.PRINTIFY_SHOP_ID
    
    if (!apiToken || !shopId) {
      return res.status(500).json({
        success: false,
        error: 'Missing Printify configuration',
        message: 'PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID not set'
      })
    }

    // Create order in Printify and send to production
    const order = await createAndSendPrintifyOrder(apiToken, shopId, orderData)

    // Return success
    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        paymentIntentId: paymentIntentId,
        status: 'sent_to_production'
      },
      message: 'Order created and sent to production successfully!'
    })
  } catch (error) {
    console.error('Error confirming order:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Failed to confirm order',
      message: error.message || 'Unknown error'
    })
  }
}

