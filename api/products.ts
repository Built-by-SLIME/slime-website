// Vercel Serverless Function: GET /api/products
// Fetches products from Printify API

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getPrintifyService } from './lib/printify'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const printify = getPrintifyService()
    
    // Get page and limit from query params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50

    // Fetch products from Printify
    const productsData = await printify.getProducts(page, limit)

    // Return products
    return res.status(200).json({
      success: true,
      data: productsData.data,
      pagination: {
        current_page: productsData.current_page,
        total: productsData.total,
      }
    })
  } catch (error) {
    console.error('Error fetching products from Printify:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

