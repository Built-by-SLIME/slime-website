// Script to analyze how images map to color variants
import 'dotenv/config'

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'
const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID

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

async function main() {
  // Fetch the SLIME Face T-Shirt as an example
  const productId = '69167ae71a5c37acc20f4ddc'
  
  console.log('🔍 Analyzing image structure...\n')
  
  const product = await fetchProductDetail(productId)
  
  console.log(`Product: ${product.title}`)
  console.log(`Total Images: ${product.images.length}`)
  console.log(`Total Variants: ${product.variants.length}`)
  
  // Find color option
  const colorOption = product.options.find(opt => opt.type === 'color')
  console.log(`\nColors Available: ${colorOption ? colorOption.values.length : 0}`)
  
  // Group images by position
  const imagesByPosition = {}
  product.images.forEach(img => {
    if (!imagesByPosition[img.position]) {
      imagesByPosition[img.position] = []
    }
    imagesByPosition[img.position].push(img)
  })
  
  console.log('\nImages by Position:')
  Object.keys(imagesByPosition).forEach(position => {
    console.log(`  ${position}: ${imagesByPosition[position].length} images`)
  })
  
  // Show front images with their variant mappings
  console.log('\nFront Images (first 5):')
  const frontImages = imagesByPosition['front'] || []
  frontImages.slice(0, 5).forEach((img, idx) => {
    console.log(`\n  Image ${idx + 1}:`)
    console.log(`    Default: ${img.is_default}`)
    console.log(`    Variant IDs: ${img.variant_ids.length} variants`)
    console.log(`    URL: ${img.src}`)
    
    // Find which variants this image represents
    const variants = product.variants.filter(v => img.variant_ids.includes(v.id))
    if (variants.length > 0) {
      const colors = new Set(variants.map(v => {
        const colorId = v.options.find(opt => colorOption.values.some(c => c.id === opt))
        const color = colorOption.values.find(c => c.id === colorId)
        return color ? color.title : 'Unknown'
      }))
      console.log(`    Colors: ${Array.from(colors).join(', ')}`)
    }
  })
}

main().catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})

