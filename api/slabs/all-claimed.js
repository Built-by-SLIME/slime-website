import { createClient } from '@supabase/supabase-js'

// GET /api/slabs/all-claimed
// Returns every SLIME serial that has had a Slab claimed — no wallet filter.
// Used by MarketPage to show claimed/unclaimed badges on listings.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Server not configured' })

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase.from('slab_claims').select('slime_serial')

  if (error) return res.status(500).json({ error: 'Database error' })

  return res.status(200).json({
    claimedSerials: (data || []).map(r => r.slime_serial),
  })
}
