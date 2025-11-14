// Script to check and update product visibility in Printify
// This ensures all products are visible and marked as published

import 'dotenv/config'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'
const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID

if (!PRINTIFY_API_TOKEN || !PRINTIFY_SHOP_ID) {
  console.error('❌ Missing environment variables!')
  console.error('Please set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID in your .env file')
  process.exit(1)
}

async function fetchProducts() {
  const url = `${PRINTIFY_API_BASE}/shops/${PRINTIFY_SHOP_ID}/products.json`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

async function updateProduct(productId, updates) {
  const url = `${PRINTIFY_API_BASE}/shops/${PRINTIFY_SHOP_ID}/products/${productId}.json`
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to update product ${productId}: ${response.status} - ${error}`)
  }

  return response.json()
}

async function main() {
  console.log('🔍 Fetching products from Printify...\n')
  
  const products = await fetchProducts()
  
  console.log(`Found ${products.length} products:\n`)
  
  for (const product of products) {
    console.log(`📦 ${product.title}`)
    console.log(`   ID: ${product.id}`)
    console.log(`   Visible: ${product.visible}`)
    console.log(`   Locked: ${product.is_locked}`)
    
    if (!product.visible) {
      console.log(`   ⚠️  Product is NOT visible - updating...`)
      try {
        await updateProduct(product.id, { visible: true })
        console.log(`   ✅ Product visibility updated to TRUE`)
      } catch (error) {
        console.log(`   ❌ Failed to update: ${error.message}`)
      }
    } else {
      console.log(`   ✅ Product is already visible`)
    }
    
    console.log('')
  }
  
  console.log('\n✨ Done!')
}

main().catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})

