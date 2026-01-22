#!/usr/bin/env node

/**
 * Script to cancel orders that are stuck in "on-hold" status
 * 
 * This script:
 * 1. Fetches all orders from your Printify shop
 * 2. Identifies orders with "on-hold" status (digitization errors, etc.)
 * 3. Cancels those orders to clear the error state
 * 
 * Usage:
 *   node scripts/cancel-onhold-orders.js <API_TOKEN> <SHOP_ID>
 * 
 * Or with environment variables:
 *   PRINTIFY_API_TOKEN=xxx PRINTIFY_SHOP_ID=xxx node scripts/cancel-onhold-orders.js
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'

async function fetchAllOrders(apiToken, shopId) {
  const url = `${PRINTIFY_API_BASE}/shops/${shopId}/orders.json?limit=50`
  
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

async function cancelOrder(apiToken, shopId, orderId) {
  const url = `${PRINTIFY_API_BASE}/shops/${shopId}/orders/${orderId}/cancel.json`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SLIME-Website/1.0',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to cancel order ${orderId}: ${errorText}`)
  }

  return response.json()
}

async function main() {
  console.log('🚀 Starting Printify Order Cancellation Script\n')

  // Check environment variables or command-line arguments
  const apiToken = process.env.PRINTIFY_API_TOKEN || process.argv[2]
  const shopId = process.env.PRINTIFY_SHOP_ID || process.argv[3]

  if (!apiToken || !shopId) {
    console.error('❌ Error: Missing Printify credentials')
    console.error('\nUsage:')
    console.error('   node scripts/cancel-onhold-orders.js <API_TOKEN> <SHOP_ID>')
    console.error('\nOr set environment variables:')
    console.error('   PRINTIFY_API_TOKEN=your_token')
    console.error('   PRINTIFY_SHOP_ID=your_shop_id')
    process.exit(1)
  }

  console.log(`✅ Credentials loaded`)
  console.log(`   Shop ID: ${shopId}\n`)

  try {
    // Fetch all orders
    console.log('📦 Fetching all orders from Printify...')
    const orders = await fetchAllOrders(apiToken, shopId)
    console.log(`   Found ${orders.length} orders\n`)

    if (orders.length === 0) {
      console.log('⚠️  No orders found. Exiting.')
      return
    }

    // Find orders with "on-hold" or "payment-not-received" status
    const onHoldOrders = orders.filter(order => {
      const hasOnHoldItems = order.line_items?.some(item => 
        item.status === 'on-hold' || item.status === 'payment-not-received'
      )
      return hasOnHoldItems
    })

    console.log(`   Found ${onHoldOrders.length} orders with "on-hold" or "payment-not-received" status\n`)

    if (onHoldOrders.length === 0) {
      console.log('✅ No orders need to be canceled. All clear!')
      return
    }

    // Display orders that will be canceled
    console.log('📋 Orders to be canceled:')
    onHoldOrders.forEach(order => {
      console.log(`   - Order ID: ${order.id}`)
      console.log(`     App Order ID: ${order.app_order_id || 'N/A'}`)
      order.line_items.forEach(item => {
        console.log(`     • ${item.metadata?.title || 'Unknown product'} - Status: ${item.status}`)
      })
      console.log('')
    })

    // Ask for confirmation (in a real scenario, you'd use readline or similar)
    console.log('⚠️  About to cancel these orders. Press Ctrl+C to abort, or wait 5 seconds to continue...\n')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Cancel each order
    console.log('🗑️  Canceling orders...\n')
    
    let successCount = 0
    let errorCount = 0

    for (const order of onHoldOrders) {
      try {
        console.log(`   Canceling: Order ${order.id}`)
        await cancelOrder(apiToken, shopId, order.id)
        console.log(`   ✅ Success: Order ${order.id} canceled`)
        successCount++
      } catch (error) {
        console.error(`   ❌ Error: Order ${order.id} - ${error.message}`)
        errorCount++
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`   Total on-hold orders: ${onHoldOrders.length}`)
    console.log(`   ✅ Successfully canceled: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log('='.repeat(60))

    if (errorCount === 0) {
      console.log('\n🎉 All on-hold orders successfully canceled!')
    } else {
      console.log('\n⚠️  Some orders failed to cancel. Check the errors above.')
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run the script
main()

