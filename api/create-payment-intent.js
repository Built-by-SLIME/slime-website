// Vercel Serverless Function: POST /api/create-payment-intent
// Creates a Stripe Payment Intent for checkout

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { amount, productTitle, customerEmail } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      })
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount is already in cents from Printify
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        productTitle: productTitle || 'SLIME Merch',
        customerEmail: customerEmail || 'unknown'
      },
      description: `SLIME Merch: ${productTitle || 'Product'}`,
    })

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create payment intent',
      message: error.message || 'Unknown error'
    })
  }
}

