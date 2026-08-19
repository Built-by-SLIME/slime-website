// GET /api/media-proxy?url=<encoded-url>
// Proxies external media (IPFS, direct URLs, inscriptions) to bypass browser CORS.
// The swap page routes all NFT media through here so mixed sources load reliably.

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

  // Resolve ipfs:// URIs through a public gateway before fetching.
  if (targetUrl.startsWith('ipfs://')) {
    const cidPath = targetUrl.slice(7)
    targetUrl = 'https://ipfs.io/ipfs/' + cidPath
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'builtbyslime-media-proxy/1.0',
      },
    })

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `Upstream fetch failed: ${upstream.status} ${upstream.statusText}`,
      })
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
