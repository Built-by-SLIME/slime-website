// Cache configuration
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
let cachedAllNFTs = null
let cacheTimestamp = 0

/**
 * Fetch all NFTs from SentX API (handles pagination)
 */
async function fetchAllNFTs(apiKey, tokenId) {
  const limit = 100
  const allNFTs = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const url = `https://api.sentx.io/v1/public/token/nfts?apikey=${apiKey}&token=${tokenId}&limit=${limit}&page=${page}&sortBy=rarity&sortDirection=ASC`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`SentX API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success || !data.nfts) {
      throw new Error('Invalid SentX API response')
    }

    allNFTs.push(...data.nfts)
    hasMore = data.nfts.length === limit && allNFTs.length < 5000
    page++
  }

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

  try {
    const { apikey, token, page = 1, limit = 50 } = req.query

    if (!apikey || !token) {
      return res.status(400).json({ error: 'Missing required parameters: apikey and token' })
    }

    // Check cache
    const now = Date.now()
    if (!cachedAllNFTs || (now - cacheTimestamp) >= CACHE_TTL) {
      const allNFTs = await fetchAllNFTs(apikey, token)
      cachedAllNFTs = processNFTs(allNFTs)
      cacheTimestamp = now
    }

    // Paginate results
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedNFTs = cachedAllNFTs.slice(startIndex, endIndex)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    return res.status(200).json({
      success: true,
      nfts: paginatedNFTs,
      total: cachedAllNFTs.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(cachedAllNFTs.length / limitNum)
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate rarity',
      message: error.message
    })
  }
}

