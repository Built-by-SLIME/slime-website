/**
 * Collection Rarity Calculator API
 * 
 * This endpoint:
 * 1. Fetches ALL NFTs from SentX API (paginated)
 * 2. Normalizes trait values (fixes Crown/crown capitalization)
 * 3. Calculates trait frequencies across the collection
 * 4. Computes proper rarity scores
 * 5. Returns NFTs sorted by corrected rarity
 */

// Cache configuration
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
let cachedData = null
let cacheTimestamp = 0

/**
 * Fetch all NFTs from SentX API (handles pagination)
 */
async function fetchAllNFTs(apiKey, tokenId) {
  const allNFTs = []
  let page = 1
  let hasMore = true
  const limit = 100 // Max per page

  console.log(`Starting to fetch NFTs for token ${tokenId}...`)

  while (hasMore) {
    try {
      const url = `https://api.sentx.io/v1/public/token/nfts?apikey=${apiKey}&token=${tokenId}&limit=${limit}&page=${page}&sortBy=serialId&sortDirection=ASC`

      console.log(`Fetching page ${page}...`)
      const response = await fetch(url)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`SentX API error on page ${page}:`, response.status, errorText)
        throw new Error(`SentX API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !data.nfts) {
        console.error('Invalid SentX response:', data)
        throw new Error('Invalid SentX API response')
      }

      console.log(`Page ${page}: Got ${data.nfts.length} NFTs`)
      allNFTs.push(...data.nfts)

      // Check if there are more pages
      hasMore = data.nfts.length === limit
      page++

      // Safety check - don't fetch more than 5000 NFTs
      if (allNFTs.length >= 5000) {
        console.log('Reached 5000 NFT limit, stopping pagination')
        break
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error)
      throw error
    }
  }

  console.log(`Total NFTs fetched: ${allNFTs.length}`)
  return allNFTs
}

/**
 * Normalize trait values (fix capitalization issues)
 */
function normalizeTraits(nft) {
  return {
    ...nft,
    attributes: nft.attributes.map(attr => ({
      ...attr,
      // Normalize Crown trait specifically
      value: attr.trait_type.toLowerCase() === 'head' && attr.value.toLowerCase() === 'crown'
        ? 'crown'
        : attr.value
    }))
  }
}

/**
 * Calculate trait frequencies across all NFTs
 */
function calculateTraitFrequencies(nfts) {
  const frequencies = {}

  nfts.forEach(nft => {
    nft.attributes.forEach(attr => {
      const key = `${attr.trait_type}:${attr.value}`
      frequencies[key] = (frequencies[key] || 0) + 1
    })
  })

  return frequencies
}

/**
 * Calculate rarity score for an NFT
 * Formula: Sum of (1 / trait_frequency) for all traits
 */
function calculateRarityScore(nft, frequencies, totalNFTs) {
  let score = 0

  nft.attributes.forEach(attr => {
    const key = `${attr.trait_type}:${attr.value}`
    const frequency = frequencies[key] || 1
    score += 1 / frequency
  })

  return score
}

/**
 * Process all NFTs and calculate corrected rarity
 */
function processNFTs(nfts) {
  // Step 1: Normalize traits
  const normalizedNFTs = nfts.map(normalizeTraits)

  // Step 2: Calculate trait frequencies
  const frequencies = calculateTraitFrequencies(normalizedNFTs)

  // Step 3: Calculate rarity scores
  const nftsWithRarity = normalizedNFTs.map(nft => ({
    ...nft,
    originalRarity: nft.rarity,
    originalRank: nft.rarityRank,
    correctedRarity: calculateRarityScore(nft, frequencies, normalizedNFTs.length)
  }))

  // Step 4: Sort by corrected rarity (higher score = more rare)
  nftsWithRarity.sort((a, b) => b.correctedRarity - a.correctedRarity)

  // Step 5: Assign corrected ranks
  nftsWithRarity.forEach((nft, index) => {
    nft.correctedRank = index + 1
    nft.rarityPct = ((index + 1) / nftsWithRarity.length) * 100
  })

  return nftsWithRarity
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('Collection rarity API called with params:', req.query)

  try {
    const { apikey, token, page = 1, limit = 50 } = req.query

    if (!apikey || !token) {
      console.error('Missing required parameters')
      return res.status(400).json({ error: 'Missing required parameters: apikey and token' })
    }

    // Check cache
    const now = Date.now()
    if (cachedData && (now - cacheTimestamp) < CACHE_TTL) {
      console.log('Returning cached rarity data (age:', Math.round((now - cacheTimestamp) / 1000), 'seconds)')
    } else {
      console.log('Cache miss or expired. Fetching and processing all NFTs from SentX...')

      try {
        // Fetch all NFTs
        const allNFTs = await fetchAllNFTs(apikey, token)
        console.log(`Successfully fetched ${allNFTs.length} NFTs from SentX`)

        // Process and calculate corrected rarity
        console.log('Processing NFTs and calculating rarity...')
        cachedData = processNFTs(allNFTs)
        cacheTimestamp = now

        console.log(`Rarity calculation complete. Processed ${cachedData.length} NFTs. Data cached.`)
      } catch (fetchError) {
        console.error('Error during fetch/process:', fetchError)
        throw fetchError
      }
    }

    // Paginate results
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedNFTs = cachedData.slice(startIndex, endIndex)

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    return res.status(200).json({
      success: true,
      nfts: paginatedNFTs,
      total: cachedData.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(cachedData.length / limitNum),
      cached: (now - cacheTimestamp) < CACHE_TTL
    })

  } catch (error) {
    console.error('Collection rarity API error:', error)
    console.error('Error stack:', error.stack)
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate rarity',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

