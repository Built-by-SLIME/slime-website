// Script to "publish" (lock) products after making changes in Printify dashboard
// This marks them as published so changes take effect
import 'dotenv/config'

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'
const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID

if (!PRINTIFY_API_TOKEN || !PRINTIFY_SHOP_ID) {
  console.error('❌ Missing environment variables!')
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

async function publishSucceeded(productId, productTitle) {
  const url = `${PRINTIFY_API_BASE}/shops/${PRINTIFY_SHOP_ID}/products/${productId}/publishing_succeeded.json`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external: {
        id: productId,
        handle: `https://www.builtbyslime.org/merch#${productId}`
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to publish product ${productId}: ${response.status} - ${error}`)
  }

  return response.json()
}

async function main() {
  console.log('🔍 Fetching products from Printify...\n')
  
  const products = await fetchProducts()
  
  console.log(`Found ${products.length} products\n`)
  
  let publishedCount = 0
  let alreadyLockedCount = 0
  
  for (const product of products) {
    console.log(`📦 ${product.title}`)
    console.log(`   ID: ${product.id}`)
    console.log(`   Visible: ${product.visible}`)
    console.log(`   Locked: ${product.is_locked}`)
    
    if (!product.is_locked && product.visible) {
      console.log(`   🔒 Publishing product to lock changes...`)
      try {
        await publishSucceeded(product.id, product.title)
        console.log(`   ✅ Product published and locked!`)
        publishedCount++
      } catch (error) {
        console.log(`   ❌ Failed to publish: ${error.message}`)
      }
    } else if (product.is_locked) {
      console.log(`   ✅ Product is already locked`)
      alreadyLockedCount++
    } else {
      console.log(`   ⏭️  Skipping (not visible)`)
    }
    
    console.log('')
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`✨ Done!`)
  console.log(`   Published: ${publishedCount}`)
  console.log(`   Already locked: ${alreadyLockedCount}`)
  console.log(`   Total: ${products.length}`)
  console.log('='.repeat(50))
  console.log('\n💡 Your changes are now live!')
}

main().catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})

