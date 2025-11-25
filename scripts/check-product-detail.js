// Script to check detailed product data to see what pricing fields Printify provides
import 'dotenv/config'

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'
const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID

if (!PRINTIFY_API_TOKEN || !PRINTIFY_SHOP_ID) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

async function fetchProductDetail(productId) {
  const url = `${PRINTIFY_API_BASE}/shops/${PRINTIFY_SHOP_ID}/products/${productId}.json`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`)
  }

  return response.json()
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
  console.log('🔍 Fetching products...\n')
  
  const products = await fetchProducts()
  
  // Get first product for detailed inspection
  const firstProduct = products[0]
  
  console.log(`📦 Fetching detailed data for: ${firstProduct.title}\n`)
  
  const detail = await fetchProductDetail(firstProduct.id)
  
  console.log('='.repeat(80))
  console.log('FULL PRODUCT OBJECT (showing all fields):')
  console.log('='.repeat(80))
  console.log(JSON.stringify(detail, null, 2))
  console.log('='.repeat(80))
}

main().catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})

