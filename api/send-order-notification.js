const { Resend } = require('resend')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'orders@builtbyslime.org'
    const toEmail = process.env.RESEND_TO_EMAIL || 'orders@builtbyslime.org'

    if (!resendApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing Resend configuration',
        message: 'RESEND_API_KEY not set'
      })
    }

    const {
      orderMemo,
      customerName,
      customerEmail,
      productTitle,
      variantTitle,
      price,
      hbarAmount,
      shippingAddress
    } = req.body

    // Validate required fields
    if (!orderMemo || !customerName || !customerEmail || !productTitle || !hbarAmount || !shippingAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Order memo, customer info, product details, HBAR amount, and shipping address are required'
      })
    }

    const resend = new Resend(resendApiKey)

    // Create email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0f172a; color: #39ff14; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .section { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #39ff14; }
            .label { font-weight: bold; color: #0f172a; }
            .value { color: #555; }
            .memo { background: #39ff14; color: #0f172a; padding: 10px; font-size: 18px; font-weight: bold; text-align: center; border-radius: 6px; margin: 10px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; border-radius: 4px; }
            .link { color: #39ff14; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 NEW HBAR MERCH ORDER</h1>
            </div>
            <div class="content">
              <div class="section">
                <h2>📋 Order Details</h2>
                <p><span class="label">Order ID / MEMO:</span></p>
                <div class="memo">${orderMemo}</div>
                <p><span class="label">Product:</span> <span class="value">${productTitle}${variantTitle ? ` - ${variantTitle}` : ''}</span></p>
                <p><span class="label">Price:</span> <span class="value">$${price.toFixed(2)} USD</span></p>
              </div>

              <div class="section">
                <h2>💰 Payment Details</h2>
                <p><span class="label">Amount:</span> <span class="value">${hbarAmount} HBAR</span></p>
                <p><span class="label">Wallet:</span> <span class="value">${process.env.HBAR_TREASURY_WALLET || '0.0.9463056'}</span></p>
                <p><span class="label">MEMO:</span> <span class="value">${orderMemo}</span></p>
                <div class="warning">
                  ⚠️ <strong>IMPORTANT:</strong> Customer must include MEMO <strong>${orderMemo}</strong> when sending HBAR payment.
                </div>
              </div>

              <div class="section">
                <h2>👤 Customer Information</h2>
                <p><span class="label">Name:</span> <span class="value">${customerName}</span></p>
                <p><span class="label">Email:</span> <span class="value">${customerEmail}</span></p>
              </div>

              <div class="section">
                <h2>📦 Shipping Address</h2>
                <p class="value">
                  ${shippingAddress.first_name} ${shippingAddress.last_name}<br>
                  ${shippingAddress.address1}${shippingAddress.address2 ? `<br>${shippingAddress.address2}` : ''}<br>
                  ${shippingAddress.city}, ${shippingAddress.region} ${shippingAddress.zip}<br>
                  ${shippingAddress.country}
                </p>
              </div>

              <div class="section">
                <h2>🔍 Next Steps</h2>
                <ol>
                  <li>Verify HBAR payment on HashScan: <a href="https://hashscan.io/mainnet/account/${process.env.HBAR_TREASURY_WALLET || '0.0.9463056'}" class="link">View Transactions</a></li>
                  <li>Search for MEMO: <strong>${orderMemo}</strong></li>
                  <li>Confirm payment amount: <strong>${hbarAmount} HBAR</strong></li>
                  <li>Once verified, create order in Printify</li>
                </ol>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email
    const data = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `🎨 New HBAR Order - ${orderMemo}`,
      html: emailHtml,
    })

    return res.status(200).json({
      success: true,
      message: 'Order notification sent successfully',
      emailId: data.id
    })

  } catch (error) {
    console.error('Error sending order notification:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Failed to send order notification',
      message: error.message || 'Unknown error'
    })
  }
}

