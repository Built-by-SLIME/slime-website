// Vercel Serverless Function: GET /api/nft-images
// Returns image URLs and corrected rank for specific NFT serial numbers via SentX API.
// Rank is computed using the same trait-frequency rarity formula as collection-rarity.js.

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const cache = new Map() // tokenId → { timestamp, serialMap }

function normalizeTraits(nft) {
  return {
    ...nft,
    attributes: (nft.attributes || []).map(attr => ({
      ...attr,
      value: attr.trait_type.toLowerCase() === 'head' && attr.value.toLowerCase() === 'crown'
        ? 'crown'
        : attr.value
    }))
  }
}

function calculateTraitFrequencies(nfts) {
  const frequencies = {}
  nfts.forEach(nft => {
    (nft.attributes || []).forEach(attr => {
      const key = `${attr.trait_type}:${attr.value}`
      frequencies[key] = (frequencies[key] || 0) + 1
    })
  })
  return frequencies
}

function calculateRarityScore(nft, frequencies) {
  let score = 0
  ;(nft.attributes || []).forEach(attr => {
    const key = `${attr.trait_type}:${attr.value}`
    const frequency = frequencies[key] || 1
    score += 1 / frequency
  })
  return score
}

async function buildSerialMap(apiKey, tokenId) {
  const allNFTs = []
  const limit = 100
  let page = 1
  let hasMore = true

  while (hasMore) {
    const url = `https://api.sentx.io/v1/public/token/nfts?apikey=${apiKey}&token=${tokenId}&limit=${limit}&page=${page}&sortBy=rarity&sortDirection=ASC`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`SentX API error: ${response.status}`)
    const data = await response.json()
    if (!data.success || !data.nfts) throw new Error('Invalid SentX response')
    allNFTs.push(...data.nfts)
    hasMore = data.nfts.length === limit && allNFTs.length < 5000
    page++
  }

  // Compute corrected ranks using the same logic as collection-rarity.js
  const normalized = allNFTs.map(normalizeTraits)
  const frequencies = calculateTraitFrequencies(normalized)
  const withScores = normalized.map(nft => ({
    ...nft,
    correctedRarity: calculateRarityScore(nft, frequencies)
  }))
  withScores.sort((a, b) => b.correctedRarity - a.correctedRarity)

  const serialMap = {}
  withScores.forEach((nft, index) => {
    serialMap[nft.serialId] = {
      name: nft.name,
      image: nft.image,
      rank: index + 1
    }
  })

  return serialMap
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { apikey, token, serials } = req.query

  if (!apikey || !token || !serials) {
    return res.status(400).json({ error: 'Missing required parameters: apikey, token, serials' })
  }

  const requestedSerials = serials.split(',').map(Number).filter(Boolean)
  if (requestedSerials.length === 0) {
    return res.status(400).json({ error: 'No valid serial numbers provided' })
  }

  try {
    const now = Date.now()
    const cached = cache.get(token)

    let serialMap
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      serialMap = cached.serialMap
    } else {
      serialMap = await buildSerialMap(apikey, token)
      cache.set(token, { serialMap, timestamp: now })
    }

    const result = {}
    for (const serial of requestedSerials) {
      if (serialMap[serial]) result[serial] = serialMap[serial]
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=300')
    return res.status(200).json({ success: true, nfts: result })
  } catch (error) {
    console.error('nft-images error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
