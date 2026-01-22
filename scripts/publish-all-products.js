#!/usr/bin/env node

/**
 * Script to set all Printify products to "published" status
 *
 * This script:
 * 1. Fetches all products from your Printify shop
 * 2. Calls the publishing_succeeded endpoint for each product
 * 3. This changes the status from "publishing" to "published"
 *
 * Usage:
 *   node scripts/publish-all-products.js
 *
 * Requirements:
 *   - PRINTIFY_API_TOKEN environment variable
 *   - PRINTIFY_SHOP_ID environment variable
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

async function setProductPublished(apiToken, shopId, productId, productTitle) {
  const url = `${PRINTIFY_API_BASE}/shops/${shopId}/products/${productId}/publishing_succeeded.json`
  
  // The external object is required - we'll use the product ID as both id and handle
  const body = {
    external: {
      id: productId,
      handle: `https://builtbyslime.org/merch#${productId}`
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SLIME-Website/1.0',
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to publish product ${productId}: ${errorText}`)
  }

  return response.json()
}

async function main() {
  console.log('🚀 Starting Printify Product Publishing Script\n')

  // Check environment variables or command-line arguments
  const apiToken = process.env.PRINTIFY_API_TOKEN || process.argv[2]
  const shopId = process.env.PRINTIFY_SHOP_ID || process.argv[3]

  if (!apiToken || !shopId) {
    console.error('❌ Error: Missing Printify credentials')
    console.error('\nUsage:')
    console.error('   node scripts/publish-all-products.js <API_TOKEN> <SHOP_ID>')
    console.error('\nOr set environment variables:')
    console.error('   PRINTIFY_API_TOKEN=your_token')
    console.error('   PRINTIFY_SHOP_ID=your_shop_id')
    console.error('\nYou can find these in your Vercel environment variables.')
    process.exit(1)
  }

  console.log(`✅ Credentials loaded`)
  console.log(`   Shop ID: ${shopId}\n`)

  try {
    // Fetch all products
    console.log('📦 Fetching all products from Printify...')
    const products = await fetchAllProducts(apiToken, shopId)
    console.log(`   Found ${products.length} products\n`)

    if (products.length === 0) {
      console.log('⚠️  No products found. Exiting.')
      return
    }

    // Publish each product
    console.log('📤 Setting products to "published" status...\n')
    
    let successCount = 0
    let errorCount = 0

    for (const product of products) {
      try {
        console.log(`   Processing: ${product.title} (ID: ${product.id})`)
        await setProductPublished(apiToken, shopId, product.id, product.title)
        console.log(`   ✅ Success: ${product.title}`)
        successCount++
      } catch (error) {
        console.error(`   ❌ Error: ${product.title} - ${error.message}`)
        errorCount++
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`   Total products: ${products.length}`)
    console.log(`   ✅ Successfully published: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log('='.repeat(60))

    if (errorCount === 0) {
      console.log('\n🎉 All products successfully set to "published" status!')
    } else {
      console.log('\n⚠️  Some products failed. Check the errors above.')
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run the script
main()

