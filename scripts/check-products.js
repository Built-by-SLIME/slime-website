// Script to check current product data from Printify API
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

async function main() {
  console.log('🔍 Fetching current product data from Printify...\n')
  
  const products = await fetchProducts()
  
  console.log(`Found ${products.length} products:\n`)
  
  for (const product of products) {
    console.log(`📦 ${product.title}`)
    console.log(`   ID: ${product.id}`)
    console.log(`   Visible: ${product.visible}`)
    console.log(`   Locked: ${product.is_locked}`)
    console.log(`   Variants: ${product.variants.length}`)
    
    // Show first 3 variants with pricing
    console.log(`   Pricing (first 3 variants):`)
    product.variants.slice(0, 3).forEach((variant, idx) => {
      const price = variant.price / 100
      console.log(`      ${idx + 1}. ${variant.title}: $${price.toFixed(2)}`)
    })
    
    if (product.variants.length > 3) {
      console.log(`      ... and ${product.variants.length - 3} more variants`)
    }
    
    console.log('')
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})

