#!/usr/bin/env node

/**
 * Script to check detailed product information
 * 
 * This script fetches all products and displays their full details
 * to help identify any errors or issues
 * 
 * Usage:
 *   node scripts/check-product-details.js <API_TOKEN> <SHOP_ID>
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'

async function fetchAllProducts(apiToken, shopId) {
  const url = `${PRINTIFY_API_BASE}/shops/${shopId}/products.json?limit=50`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SLIME-Website/1.0',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Printify API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data.data || []
}

async function fetchProductDetails(apiToken, shopId, productId) {
  const url = `${PRINTIFY_API_BASE}/shops/${shopId}/products/${productId}.json`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SLIME-Website/1.0',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Printify API error (${response.status}): ${errorText}`)
  }

  return response.json()
}

async function main() {
  console.log('🔍 Checking Product Details\n')

  const apiToken = process.env.PRINTIFY_API_TOKEN || process.argv[2]
  const shopId = process.env.PRINTIFY_SHOP_ID || process.argv[3]

  if (!apiToken || !shopId) {
    console.error('❌ Error: Missing Printify credentials')
    console.error('\nUsage:')
    console.error('   node scripts/check-product-details.js <API_TOKEN> <SHOP_ID>')
    process.exit(1)
  }

  console.log(`✅ Credentials loaded`)
  console.log(`   Shop ID: ${shopId}\n`)

  try {
    console.log('📦 Fetching all products...')
    const products = await fetchAllProducts(apiToken, shopId)
    console.log(`   Found ${products.length} products\n`)

    // Filter embroidery products
    const embroideryProducts = products.filter(p => 
      p.title.toLowerCase().includes('beanie') || 
      p.title.toLowerCase().includes('embroid')
    )

    console.log(`   Found ${embroideryProducts.length} embroidery products\n`)

    for (const product of embroideryProducts) {
      console.log('='.repeat(80))
      console.log(`📦 Product: ${product.title}`)
      console.log(`   ID: ${product.id}`)
      console.log(`   Visible: ${product.visible}`)
      console.log(`   Blueprint ID: ${product.blueprint_id}`)
      console.log(`   Print Provider ID: ${product.print_provider_id}`)
      
      // Fetch detailed info
      console.log('\n   Fetching detailed information...')
      const details = await fetchProductDetails(apiToken, shopId, product.id)
      
      console.log(`\n   Full Product Details:`)
      console.log(JSON.stringify(details, null, 2))
      console.log('='.repeat(80))
      console.log('')
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n✅ Done!')

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

main()

