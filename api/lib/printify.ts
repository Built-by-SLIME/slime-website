// Printify API Service Utility
// This runs on the server-side only (Vercel serverless functions)

import type { PrintifyProduct, PrintifyOrder, PrintifyOrderRequest } from '../../src/types/printify'

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'

export class PrintifyService {
  private apiToken: string
  private shopId: string

  constructor(apiToken: string, shopId: string) {
    if (!apiToken || !shopId) {
      throw new Error('Printify API token and shop ID are required')
    }
    this.apiToken = apiToken
    this.shopId = shopId
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${PRINTIFY_API_BASE}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SLIME-Website/1.0',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Printify API error (${response.status}): ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get all products from the Printify shop
   */
  async getProducts(page: number = 1, limit: number = 50): Promise<{
    current_page: number
    data: PrintifyProduct[]
    total: number
  }> {
    return this.request(`/shops/${this.shopId}/products.json?page=${page}&limit=${limit}`)
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<PrintifyProduct> {
    return this.request(`/shops/${this.shopId}/products/${productId}.json`)
  }

  /**
   * Create an order in Printify
   */
  async createOrder(orderData: PrintifyOrderRequest): Promise<PrintifyOrder> {
    return this.request(`/shops/${this.shopId}/orders.json`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<PrintifyOrder> {
    return this.request(`/shops/${this.shopId}/orders/${orderId}.json`)
  }

  /**
   * Send order to production (submit for fulfillment)
   */
  async sendOrderToProduction(orderId: string): Promise<PrintifyOrder> {
    return this.request(`/shops/${this.shopId}/orders/${orderId}/send_to_production.json`, {
      method: 'POST',
    })
  }
}

/**
 * Get initialized Printify service instance
 */
export function getPrintifyService(): PrintifyService {
  const apiToken = process.env.PRINTIFY_API_TOKEN
  const shopId = process.env.PRINTIFY_SHOP_ID

  if (!apiToken || !shopId) {
    throw new Error('Missing Printify configuration. Please set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID environment variables.')
  }

  return new PrintifyService(apiToken, shopId)
}

