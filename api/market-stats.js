// GET /api/market-stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// Returns per-period market stats for the SLIME NFT collection from SentX.
//
// We compute stats from the raw /market/stats/transactions endpoint instead of
// the aggregated /market/stats/token endpoint. The aggregated endpoint can lag
// behind real-time sales that already appear in the Activity feed and on SentX
// itself, so building the aggregates ourselves from individual transactions is
// both live and paginated properly.
const SLIME_TOKEN = '0.0.9474754'
const UPSTREAM_LIMIT = 500

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apikey = process.env.SENTX_API_KEY
  if (!apikey) return res.status(500).json({ error: 'API key not configured' })

  const { startDate, endDate } = req.query
  if (!startDate || !endDate) return res.status(400).json({ error: 'Missing required params: startDate, endDate' })

  const rangeStart = new Date(`${startDate}T00:00:00.000Z`)
  const rangeEnd = new Date(`${endDate}T23:59:59.999Z`)

  try {
    const baseParams = new URLSearchParams({
      apikey,
      token: SLIME_TOKEN,
      dateFrom: startDate,
      dateTo: endDate,
      limit: String(UPSTREAM_LIMIT),
    })

    const first = await fetch(`https://api.sentx.io/v1/public/market/stats/transactions?${baseParams}&page=1`)
    const firstData = await first.json()

    if (!firstData.success) {
      return res.status(first.status).json({
        error: firstData.apimessage || firstData.error || 'SentX request failed',
      })
    }

    const allTransactions = [...(firstData.data || [])]
    const totalRecords = firstData.totalRecords || 0
    const totalPages = Math.ceil(totalRecords / UPSTREAM_LIMIT)

    if (totalPages > 1) {
      const remaining = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          fetch(`https://api.sentx.io/v1/public/market/stats/transactions?${baseParams}&page=${i + 2}`)
            .then(r => r.json())
            .then(d => d.data || [])
        )
      )
      remaining.forEach(page => allTransactions.push(...page))
    }

    // SentX returns the token address on every row; keep the guard in case the
    // upstream filter ever behaves unexpectedly.
    const transactions = allTransactions.filter(
      tx => tx.token === SLIME_TOKEN && tx.date && Number(tx.amount || 0) > 0
    )

    const withinRange = transactions.filter(tx => {
      const txDate = new Date(tx.date)
      return txDate >= rangeStart && txDate <= rangeEnd
    })

    // Dedupe by transaction ID just in case a transaction appears on multiple pages.
    const seen = new Set()
    const uniqueSales = []
    for (const tx of withinRange) {
      if (seen.has(tx.transactionId)) continue
      seen.add(tx.transactionId)
      uniqueSales.push(tx)
    }

    const amounts = uniqueSales.map(tx => Number(tx.amount))
    const totalSales = uniqueSales.length
    const totalVolume = amounts.reduce((sum, amount) => sum + amount, 0)
    const maxSale = totalSales > 0 ? Math.max(...amounts) : 0
    const minSale = totalSales > 0 ? Math.min(...amounts) : 0
    const avgSale = totalSales > 0 ? Math.round(totalVolume / totalSales) : 0

    const record = {
      token: SLIME_TOKEN,
      datetime: `${startDate}T00:00:00.000Z`,
      volume: Math.round(totalVolume),
      floor: 0,
      avgSale,
      sales: totalSales,
      maxSale: Math.round(maxSale),
      minSale: Math.round(minSale),
      listings: 0,
      fungibleToken: null,
      maxOffer: null,
      offers: null,
      maxTraitOffer: null,
      traitOffers: null,
      orderVolume: null,
    }

    // Keep the same response shape the client already expects, with a single
    // aggregated record for the period instead of per-hour buckets.
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return res.status(200).json({
      success: true,
      source: 'SentX Market',
      dateFrom: startDate,
      dateTo: endDate,
      token: SLIME_TOKEN,
      page: 1,
      limit: 1,
      totalRecords: 1,
      data: [record],
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
