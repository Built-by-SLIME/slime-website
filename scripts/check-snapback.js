// Script to check Code Bracket Snapback images
import 'dotenv/config'

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'
const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID

async function fetchProducts() {
  const url = `${PRINTIFY_API_BASE}/shops/${PRINTIFY_SHOP_ID}/products.json`
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await response.json()
  
  // Find the snapback
  const snapback = data.data.find(p => p.title.toLowerCase().includes('snapback'))
  if (snapback) {
    console.log('Found:', snapback.title)
    console.log('Product ID:', snapback.id)
  }
  return snapback
}

async function fetchProductDetail(productId) {
  const url = `${PRINTIFY_API_BASE}/shops/${PRINTIFY_SHOP_ID}/products/${productId}.json`
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}

async function main() {
  const product = await fetchProducts()
  if (!product) {
    console.log('Snapback not found')
    return
  }
  
  const detail = await fetchProductDetail(product.id)
  
  console.log('\nEnabled Variants:')
  const enabled = detail.variants.filter(v => v.is_enabled)
  enabled.forEach(v => {
    console.log('  -', v.title, '(ID:', v.id + ')')
  })
  
  console.log('\nColor Options:')
  const colorOption = detail.options.find(opt => opt.type === 'color')
  if (colorOption) {
    colorOption.values.forEach(color => {
      const hasEnabledVariant = enabled.some(v => v.options.includes(color.id))
      if (hasEnabledVariant) {
        console.log('  -', color.title, '(ID:', color.id + ')')
      }
    })
  }
  
  console.log('\nImages:')
  detail.images.forEach((img, idx) => {
    console.log(`  Image ${idx + 1}:`)
    console.log('    Position:', img.position)
    console.log('    Is Default:', img.is_default)
    console.log('    Is Selected for Publishing:', img.is_selected_for_publishing)
    console.log('    Variant IDs:', img.variant_ids.length, 'variants')
    console.log('    URL:', img.src)
    
    // Find which colors this image represents
    const variants = detail.variants.filter(v => img.variant_ids.includes(v.id))
    if (variants.length > 0 && colorOption) {
      const colors = new Set(variants.map(v => {
        const colorId = v.options.find(opt => colorOption.values.some(c => c.id === opt))
        const color = colorOption.values.find(c => c.id === colorId)
        return color ? color.title : 'Unknown'
      }))
      console.log('    Colors:', Array.from(colors).join(', '))
    }
    console.log('')
  })
}

main().catch(error => {
  console.error('Error:', error.message)
  process.exit(1)
})

