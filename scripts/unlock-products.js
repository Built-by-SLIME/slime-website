// Script to unlock all products in Printify
// This allows you to edit them in the Printify dashboard

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

async function unlockProduct(productId) {
  // Try publishing_failed endpoint to unlock the product
  const url = `${PRINTIFY_API_BASE}/shops/${PRINTIFY_SHOP_ID}/products/${productId}/publishing_failed.json`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: "Unlocking for manual editing"
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to unlock product ${productId}: ${response.status} - ${error}`)
  }

  return response.json()
}

async function main() {
  console.log('🔍 Fetching products from Printify...\n')
  
  const products = await fetchProducts()
  
  console.log(`Found ${products.length} products\n`)
  
  let unlockedCount = 0
  let alreadyUnlockedCount = 0
  
  for (const product of products) {
    console.log(`📦 ${product.title}`)
    console.log(`   ID: ${product.id}`)
    console.log(`   Locked: ${product.is_locked}`)
    
    if (product.is_locked) {
      console.log(`   🔓 Unlocking product...`)
      try {
        await unlockProduct(product.id)
        console.log(`   ✅ Product unlocked successfully!`)
        unlockedCount++
      } catch (error) {
        console.log(`   ❌ Failed to unlock: ${error.message}`)
      }
    } else {
      console.log(`   ✅ Product is already unlocked`)
      alreadyUnlockedCount++
    }
    
    console.log('')
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`✨ Done!`)
  console.log(`   Unlocked: ${unlockedCount}`)
  console.log(`   Already unlocked: ${alreadyUnlockedCount}`)
  console.log(`   Total: ${products.length}`)
  console.log('='.repeat(50))
  console.log('\n💡 You can now edit these products in the Printify dashboard!')
}

main().catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})

