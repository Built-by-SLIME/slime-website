import { createClient } from '@supabase/supabase-js'

// GET /api/auth/check-wallet?wallet=0.0.xxxxx
// Checks if a wallet address is already linked to an X account in the DB.
// Used on page load so any device with the same wallet shows as connected.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { wallet } = req.query
  if (!wallet) return res.status(400).json({ error: 'Missing wallet param' })

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Server not configured' })

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase
    .from('leaderboard_users')
    .select('x_user_id, x_username, x_avatar_url, wallet_address')
    .eq('wallet_address', wallet)
    .single()

  if (error || !data) return res.status(200).json({ linked: false })

  return res.status(200).json({ linked: true, user: data })
}
