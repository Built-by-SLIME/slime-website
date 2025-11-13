// Vercel Serverless Function: POST /api/orders
// Creates orders in Printify API

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPrintifyService } from './printify-service'
import type { PrintifyOrderRequest } from './types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const printify = getPrintifyService()
    
    // Validate request body
    const orderData = req.body as PrintifyOrderRequest
    
    if (!orderData.line_items || orderData.line_items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data: line_items is required'
      })
    }

    if (!orderData.address_to) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data: address_to is required'
      })
    }

    // Create order in Printify
    const order = await printify.createOrder(orderData)

    // Optionally send to production immediately
    // Uncomment the following lines if you want orders to be automatically sent to production
    // const productionOrder = await printify.sendOrderToProduction(order.id)
    // return res.status(201).json({ success: true, data: productionOrder })

    return res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    })
  } catch (error) {
    console.error('Error creating order in Printify:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

