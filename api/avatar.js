// GET /api/avatar?url=https://pbs.twimg.com/...
// Proxies X profile images server-to-server, bypassing CDN hotlink/CORS blocks.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { url } = req.query
  if (!url) return res.status(400).end()

  // Only allow X CDN domains
  let parsed
  try { parsed = new URL(url) } catch { return res.status(400).end() }
  const allowed = ['pbs.twimg.com', 'abs.twimg.com']
  if (!allowed.includes(parsed.hostname)) return res.status(403).end()

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: 'https://x.com/',
      },
    })

    if (!upstream.ok) return res.status(upstream.status).end()

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const buffer = await upstream.arrayBuffer()

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600') // cache 1hr
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(Buffer.from(buffer))
  } catch {
    res.status(502).end()
  }
}
