/**
 * NFT Swap API Endpoint
 * 
 * This endpoint handles the swap of old SLIME NFTs for new ones.
 * 
 * Flow:
 * 1. User approves allowance for old NFTs (done client-side)
 * 2. Backend transfers old NFT from user to blackhole wallet
 * 3. Backend transfers new NFT from treasury to user
 * 
 * Environment Variables Required (set in Vercel):
 * - HEDERA_NETWORK: mainnet or testnet
 * - TREASURY_ACCOUNT_ID: Treasury wallet account ID
 * - TREASURY_PRIVATE_KEY: Treasury wallet private key
 * - OLD_TOKEN_ID: Old SLIME collection token ID
 * - NEW_TOKEN_ID: New SLIME collection token ID
 * - BLACKHOLE_ACCOUNT_ID: Blackhole wallet account ID
 */

import {
  Client,
  PrivateKey,
  AccountId,
  TokenId,
  NftId,
  TransferTransaction,
  TransactionId,
} from '@hiero-ledger/sdk'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userAccountId, serialNumbers } = req.body

    // Validate input
    if (!userAccountId || !serialNumbers || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return res.status(400).json({ error: 'Invalid request. userAccountId and serialNumbers are required.' })
    }

    // Get environment variables
    const network = process.env.HEDERA_NETWORK || 'mainnet'
    const treasuryAccountId = process.env.TREASURY_ACCOUNT_ID
    const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY
    const oldTokenId = process.env.OLD_TOKEN_ID || '0.0.8357917'
    const newTokenId = process.env.NEW_TOKEN_ID || '0.0.9474754'
    const blackholeAccountId = process.env.BLACKHOLE_ACCOUNT_ID || '0.0.10172931'

    // Validate environment variables
    if (!treasuryAccountId || !treasuryPrivateKey) {
      console.error('Missing environment variables: TREASURY_ACCOUNT_ID or TREASURY_PRIVATE_KEY')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Initialize Hedera client
    const client = network === 'mainnet' 
      ? Client.forMainnet()
      : Client.forTestnet()

    const treasuryKey = PrivateKey.fromStringDer(treasuryPrivateKey)
    client.setOperator(AccountId.fromString(treasuryAccountId), treasuryKey)

    const results = []

    // Process each NFT swap
    for (const serialNumber of serialNumbers) {
      try {
        // Step 1: Transfer old NFT from user to blackhole
        // Note: User must have approved allowance for this to work
        const transferOldTx = new TransferTransaction()
          .addApprovedNftTransfer(
            new NftId(TokenId.fromString(oldTokenId), serialNumber),
            AccountId.fromString(userAccountId),
            AccountId.fromString(blackholeAccountId)
          )
          .setTransactionId(TransactionId.generate(AccountId.fromString(treasuryAccountId)))
          .freezeWith(client)

        const signedOldTx = await transferOldTx.sign(treasuryKey)
        const oldTxResponse = await signedOldTx.execute(client)
        const oldTxReceipt = await oldTxResponse.getReceipt(client)

        if (oldTxReceipt.status.toString() !== 'SUCCESS') {
          throw new Error(`Failed to transfer old NFT #${serialNumber} to blackhole`)
        }

        // Step 2: Transfer new NFT from treasury to user
        const transferNewTx = new TransferTransaction()
          .addNftTransfer(
            new NftId(TokenId.fromString(newTokenId), serialNumber),
            AccountId.fromString(treasuryAccountId),
            AccountId.fromString(userAccountId)
          )
          .freezeWith(client)

        const signedNewTx = await transferNewTx.sign(treasuryKey)
        const newTxResponse = await signedNewTx.execute(client)
        const newTxReceipt = await newTxResponse.getReceipt(client)

        if (newTxReceipt.status.toString() !== 'SUCCESS') {
          throw new Error(`Failed to transfer new NFT #${serialNumber} to user`)
        }

        results.push({
          serialNumber,
          success: true,
          oldTxId: oldTxResponse.transactionId.toString(),
          newTxId: newTxResponse.transactionId.toString(),
        })
      } catch (error) {
        console.error(`Error swapping NFT #${serialNumber}:`, error)
        results.push({
          serialNumber,
          success: false,
          error: error.message,
        })
      }
    }

    // Check if all swaps were successful
    const allSuccess = results.every(r => r.success)
    const successCount = results.filter(r => r.success).length

    return res.status(allSuccess ? 200 : 207).json({
      success: allSuccess,
      message: `Successfully swapped ${successCount} of ${serialNumbers.length} NFT(s)`,
      results,
    })

  } catch (error) {
    console.error('Swap API error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}

