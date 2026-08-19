// GET /api/media-proxy?url=<encoded-url>
// Proxies external media (IPFS, direct URLs, inscriptions) to bypass browser CORS.
// The swap page routes all NFT media through here so mixed sources load reliably.

const IPFS_GATEWAYS = [
  'https://dweb.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
]

async function fetchWithTimeout(url, timeoutMs = 6000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'builtbyslime-media-proxy/1.0' },
    })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.query
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url query parameter' })
  }

  let targetUrl
  try {
    targetUrl = decodeURIComponent(url)
  } catch {
    return res.status(400).json({ error: 'Invalid url query parameter' })
  }

  if (!targetUrl.startsWith('http') && !targetUrl.startsWith('ipfs://')) {
    return res.status(400).json({ error: 'Unsupported URL scheme' })
  }

  try {
    let upstream

    // Resolve ipfs:// URIs through multiple gateways with fallback.
    if (targetUrl.startsWith('ipfs://')) {
      const cidPath = targetUrl.slice(7)
      for (const gateway of IPFS_GATEWAYS) {
        try {
          const candidate = await fetchWithTimeout(gateway + cidPath)
          if (candidate.ok) {
            upstream = candidate
            break
          }
        } catch {
          // try next gateway
        }
      }
      if (!upstream) {
        return res.status(504).json({ error: 'All IPFS gateways timed out or returned errors' })
      }
    } else {
      upstream = await fetchWithTimeout(targetUrl)
      if (!upstream.ok) {
        return res.status(upstream.status).json({
          error: `Upstream fetch failed: ${upstream.status} ${upstream.statusText}`,
        })
      }
    }

    const contentType = upstream.headers.get('content-type')
    if (contentType) res.setHeader('Content-Type', contentType)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')

    const buffer = Buffer.from(await upstream.arrayBuffer())
    return res.status(200).send(buffer)
  } catch (err) {
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'Failed to fetch media',
    })
  }
}
