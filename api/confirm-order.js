// Vercel Serverless Function: POST /api/confirm-order
// Confirms Stripe payment and creates + sends Printify order to production

import Stripe from 'stripe'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'

async function sendCustomerConfirmationEmail(customerEmail, orderDetails) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'orders@builtbyslime.org'

    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set - cannot send email')
      return
    }

    console.log('Sending confirmation email to:', customerEmail)
    console.log('From email:', fromEmail)
    console.log('Order details:', orderDetails)

    const resend = new Resend(resendApiKey)

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #00ff40; color: #222222; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .section { background: white; padding: 30px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #00ff40; }
            .divider { border-top: 2px solid #f0f0f0; margin: 30px 0; }
            .label { font-weight: bold; color: #0f172a; }
            .value { color: #555; }
            .order-id { background: #00ff40; color: #0f172a; padding: 15px; font-size: 20px; font-weight: bold; text-align: center; border-radius: 6px; margin: 15px 0; font-family: monospace; }
            .logo { width: 120px; height: 120px; margin: 0 auto 15px; display: block; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            .discord-button { display: inline-block; background: #5865F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
            ul { padding-left: 20px; }
            li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://builtbyslime.org/slime-logo.png" alt="SLIME Logo" class="logo" />
              <h1 style="color: #222222;">ORDER CONFIRMED!</h1>
              <p style="margin: 0; color: #222222;">Thank you for your purchase</p>
            </div>
            <div class="content">
              <div class="section">
                <h2>📋 Order Details</h2>
                <p><span class="label">Order ID:</span></p>
                <div class="order-id">${orderDetails.orderId}</div>
                <p><span class="label">Product:</span> <span class="value">${orderDetails.productTitle}</span></p>
                <p><span class="label">Amount Paid:</span> <span class="value">$${orderDetails.amount.toFixed(2)} USD</span></p>
                <p><span class="label">Payment Method:</span> <span class="value">Credit Card</span></p>

                <div class="divider"></div>

                <h2>📦 What's Next?</h2>
                <ul>
                  <li><strong>Processing:</strong> Your order will be processed within 24-48 hours</li>
                  <li><strong>Production:</strong> Your item will be printed and prepared for shipping</li>
                  <li><strong>Shipping:</strong> You'll receive tracking information via email once shipped</li>
                  <li><strong>Delivery:</strong> Estimated delivery is 5-7 business days after shipping</li>
                </ul>

                <div class="divider"></div>

                <h2>💬 Questions?</h2>
                <p>If you have any questions about your order, join our Discord community!</p>
                <p style="text-align: center;">
                  <a href="https://discord.gg/8X9PvNFyzK" class="discord-button">Join SLIME Discord</a>
                </p>
                <p style="font-size: 12px; color: #666;">Please have your Order ID ready: <strong>${orderDetails.orderId}</strong></p>
              </div>

              <div class="footer">
                <p>This is an automated confirmation email from SLIME</p>
                <p>Built by SLIME | <a href="https://builtbyslime.org" style="color: #39ff14;">builtbyslime.org</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: `✅ Order Confirmed - ${orderDetails.orderId}`,
      html: emailHtml,
    })

    console.log('Customer confirmation email sent successfully!')
    console.log('Email ID:', emailResult.id)
    console.log('Sent to:', customerEmail)
  } catch (error) {
    console.error('❌ ERROR sending customer confirmation email:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    // Don't throw - we don't want to fail the order if email fails
  }
}

async function createAndSendPrintifyOrder(apiToken, shopId, orderData) {
  // Step 1: Create the order
  const createUrl = `${PRINTIFY_API_BASE}/shops/${shopId}/orders.json`

  console.log('Creating Printify order with data:', JSON.stringify(orderData, null, 2))

  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SLIME-Website/1.0',
    },
    body: JSON.stringify(orderData),
  })

  console.log('Create order response status:', createResponse.status)

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    console.error('Create order error:', errorText)
    throw new Error(`Printify create order error (${createResponse.status}): ${errorText}`)
  }

  const createdOrder = await createResponse.json()
  console.log('Created order response:', JSON.stringify(createdOrder, null, 2))
  const orderId = createdOrder.id
  console.log('Extracted order ID:', orderId)
  console.log('Order ID type:', typeof orderId)

  // IMPORTANT: According to Printify docs, orders created via API start in "pending" status
  // and CANNOT be sent to production immediately. We need to return the order without
  // sending to production, as Printify will handle fulfillment automatically.

  console.log('Order created successfully. Printify will handle fulfillment.')
  return createdOrder

  /* REMOVED: Attempting to send to production immediately causes error 8502
  // Step 2: Send order to production
  const sendUrl = `${PRINTIFY_API_BASE}/shops/${shopId}/orders/${orderId}/send_to_production.json`
  console.log('Send to production URL:', sendUrl)

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
  */
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

    // Create order in Printify
    const order = await createAndSendPrintifyOrder(apiToken, shopId, orderData)

    // Send customer confirmation email
    const customerEmail = orderData.address_to.email
    const productTitle = paymentIntent.metadata.productTitle || 'SLIME Merch'
    const amount = paymentIntent.amount / 100 // Convert cents to dollars

    await sendCustomerConfirmationEmail(customerEmail, {
      orderId: order.id,
      productTitle: productTitle,
      amount: amount
    })

    // Return success
    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        paymentIntentId: paymentIntentId,
        status: 'pending_manual_submission'
      },
      message: 'Order created successfully! You will receive a confirmation email shortly.'
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

