#!/usr/bin/env tsx
/**
 * Test script to verify Printify API connection
 *
 * Usage:
 *   1. Make sure you have a .env file with PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID
 *   2. Run: npx tsx scripts/test-printify.ts
 */

import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ES module compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') })

const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID

async function testPrintifyConnection() {
  console.log('🧪 Testing Printify API Connection...\n')

  // Check environment variables
  if (!PRINTIFY_API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not found in .env file')
    process.exit(1)
  }

  console.log('✅ API Token found')
  console.log(`   Token: ${PRINTIFY_API_TOKEN.substring(0, 10)}...\n`)

  try {
    // Test 1: Fetch shops
    console.log('📋 Fetching your Printify shops...')
    const shopsResponse = await fetch('https://api.printify.com/v1/shops.json', {
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
        'User-Agent': 'SLIME-Website-Test/1.0'
      }
    })

    if (!shopsResponse.ok) {
      throw new Error(`Failed to fetch shops: ${shopsResponse.status} ${shopsResponse.statusText}`)
    }

    const shops = await shopsResponse.json()
    console.log(`✅ Found ${shops.length} shop(s)\n`)

    if (shops.length === 0) {
      console.log('❌ No shops found. Please create a shop in Printify first.')
      process.exit(1)
    }

    shops.forEach((shop: any) => {
      console.log(`   📍 ${shop.title}`)
      console.log(`      Shop ID: ${shop.id}`)
      console.log(`      Sales Channel: ${shop.sales_channel || 'N/A'}`)
      console.log()
    })

    // If no shop ID is set, stop here and show instructions
    if (!PRINTIFY_SHOP_ID) {
      console.log('🎯 Next Step: Add your Shop ID to .env file')
      console.log(`   Copy one of the Shop IDs above and add it to your .env file:\n`)
      console.log(`   PRINTIFY_SHOP_ID=${shops[0].id}\n`)
      console.log('   Then run this script again to test product fetching.')
      process.exit(0)
    }

    // Verify the shop ID exists
    const shopExists = shops.some((shop: any) => shop.id.toString() === PRINTIFY_SHOP_ID)
    if (!shopExists) {
      console.warn(`⚠️  Warning: Shop ID ${PRINTIFY_SHOP_ID} not found in your shops`)
    }
    console.log()

    // Test 2: Fetch products
    console.log('📦 Test 2: Fetching products...')
    const productsResponse = await fetch(
      `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products.json?limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
          'User-Agent': 'SLIME-Website-Test/1.0'
        }
      }
    )

    if (!productsResponse.ok) {
      throw new Error(`Failed to fetch products: ${productsResponse.status} ${productsResponse.statusText}`)
    }

    const productsData = await productsResponse.json()
    console.log(`✅ Found ${productsData.data.length} product(s)`)
    
    if (productsData.data.length === 0) {
      console.log('   ℹ️  No products found. Create products in Printify dashboard.')
    } else {
      productsData.data.forEach((product: any) => {
        console.log(`   - ${product.title} (ID: ${product.id})`)
        console.log(`     Variants: ${product.variants.length}`)
        console.log(`     Images: ${product.images.length}`)
      })
    }
    console.log()

    // Summary
    console.log('✅ All tests passed!')
    console.log('\n📝 Next steps:')
    if (productsData.data.length === 0) {
      console.log('   1. Create products in Printify dashboard')
      console.log('   2. Publish them to your API shop')
      console.log('   3. Run this test again to verify')
    } else {
      console.log('   1. Start your dev server: npm run dev')
      console.log('   2. Visit http://localhost:5173/merch')
      console.log('   3. Your products should appear!')
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run the test
testPrintifyConnection()

