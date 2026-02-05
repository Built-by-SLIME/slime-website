/**
 * Collection Rarity Calculator API
 *
 * This endpoint:
 * 1. Fetches ALL NFTs from SentX API (paginated) - ONCE and caches
 * 2. Normalizes trait values (fixes Crown/crown capitalization)
 * 3. Calculates trait frequencies across the collection
 * 4. Computes proper rarity scores
 * 5. Returns NFTs sorted by corrected rarity
 */

// Cache configuration
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
let cachedAllNFTs = null
let cacheTimestamp = 0
let isFetching = false

/**
 * Fetch all NFTs from SentX API (handles pagination) - PARALLEL FETCHING
 */
async function fetchAllNFTs(apiKey, tokenId) {
  const limit = 100

  console.log(`Fetching first page to determine total NFT count...`)

  // First, fetch page 1 to get total count
  const firstPageUrl = `https://api.sentx.io/v1/public/token/nfts?apikey=${apiKey}&token=${tokenId}&limit=${limit}&page=1&sortBy=serialId&sortDirection=ASC`
  const firstResponse = await fetch(firstPageUrl)

  if (!firstResponse.ok) {
    throw new Error(`SentX API error: ${firstResponse.status}`)
  }

  const firstData = await firstResponse.json()

  if (!firstData.success || !firstData.nfts) {
    throw new Error('Invalid SentX API response')
  }

  const totalNFTs = firstData.total || 1000
  const totalPages = Math.ceil(totalNFTs / limit)

  console.log(`Total NFTs: ${totalNFTs}, Total pages: ${totalPages}`)

  // Start with first page data
  const allNFTs = [...firstData.nfts]

  // If there are more pages, fetch them all in parallel
  if (totalPages > 1) {
    console.log(`Fetching remaining ${totalPages - 1} pages in parallel...`)

    const pagePromises = []
    for (let page = 2; page <= totalPages; page++) {
      const url = `https://api.sentx.io/v1/public/token/nfts?apikey=${apiKey}&token=${tokenId}&limit=${limit}&page=${page}&sortBy=serialId&sortDirection=ASC`
      pagePromises.push(
        fetch(url)
          .then(res => res.ok ? res.json() : Promise.reject(`Page ${page} failed`))
          .then(data => data.nfts || [])
      )
    }

    const results = await Promise.all(pagePromises)
    results.forEach(nfts => allNFTs.push(...nfts))
  }

  console.log(`Successfully fetched ${allNFTs.length} NFTs`)
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
    if (cachedAllNFTs && (now - cacheTimestamp) < CACHE_TTL) {
      console.log('Returning cached rarity data (age:', Math.round((now - cacheTimestamp) / 1000), 'seconds)')
    } else if (isFetching) {
      // If another request is already fetching, wait a bit and return error
      console.log('Another request is already fetching data, please retry in a moment')
      return res.status(503).json({
        success: false,
        error: 'Data is being calculated, please retry in a few seconds'
      })
    } else {
      isFetching = true
      console.log('Cache miss or expired. Fetching and processing all NFTs from SentX...')

      try {
        // Fetch all NFTs in parallel
        const allNFTs = await fetchAllNFTs(apikey, token)
        console.log(`Successfully fetched ${allNFTs.length} NFTs from SentX`)

        // Process and calculate corrected rarity
        console.log('Processing NFTs and calculating rarity...')
        cachedAllNFTs = processNFTs(allNFTs)
        cacheTimestamp = now

        console.log(`Rarity calculation complete. Processed ${cachedAllNFTs.length} NFTs. Data cached.`)
      } catch (fetchError) {
        console.error('Error during fetch/process:', fetchError)
        isFetching = false
        throw fetchError
      } finally {
        isFetching = false
      }
    }

    // Paginate results
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedNFTs = cachedAllNFTs.slice(startIndex, endIndex)

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    return res.status(200).json({
      success: true,
      nfts: paginatedNFTs,
      total: cachedAllNFTs.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(cachedAllNFTs.length / limitNum),
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

