#!/usr/bin/env node

/**
 * Script to publish specific products that are stuck in "publishing" status
 * 
 * This will call the publishing_succeeded endpoint to change status from "publishing" to "published"
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

async function setProductPublished(apiToken, shopId, productId) {
  const url = `${PRINTIFY_API_BASE}/shops/${shopId}/products/${productId}/publishing_succeeded.json`
  
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
  console.log('🚀 Publishing Products Script\n')

  const apiToken = process.env.PRINTIFY_API_TOKEN || process.argv[2]
  const shopId = process.env.PRINTIFY_SHOP_ID || process.argv[3]

  if (!apiToken || !shopId) {
    console.error('❌ Error: Missing Printify credentials')
    console.error('\nUsage:')
    console.error('   node scripts/publish-specific-products.js <API_TOKEN> <SHOP_ID>')
    console.error('\nOr add to .env.local:')
    console.error('   PRINTIFY_API_TOKEN=your_token')
    console.error('   PRINTIFY_SHOP_ID=your_shop_id')
    process.exit(1)
  }

  console.log(`✅ Credentials loaded`)
  console.log(`   Shop ID: ${shopId}\n`)

  try {
    console.log('📦 Fetching all products...')
    const products = await fetchAllProducts(apiToken, shopId)
    console.log(`   Found ${products.length} total products\n`)

    // Filter products that are NOT locked (these are in "publishing" status)
    const publishingProducts = products.filter(p => !p.is_locked && p.visible)
    
    console.log(`🔍 Found ${publishingProducts.length} products in "publishing" status:\n`)
    
    if (publishingProducts.length === 0) {
      console.log('✅ All products are already published!')
      return
    }

    publishingProducts.forEach(p => {
      console.log(`   - ${p.title} (ID: ${p.id})`)
    })
    
    console.log('\n📤 Publishing these products...\n')
    
    let successCount = 0
    let errorCount = 0

    for (const product of publishingProducts) {
      try {
        console.log(`   Processing: ${product.title}`)
        await setProductPublished(apiToken, shopId, product.id)
        console.log(`   ✅ Published: ${product.title}`)
        successCount++
      } catch (error) {
        console.error(`   ❌ Error: ${product.title} - ${error.message}`)
        errorCount++
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✨ Done!`)
    console.log(`   ✅ Successfully published: ${successCount}`)
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`)
    }
    console.log('='.repeat(50))

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

main()

