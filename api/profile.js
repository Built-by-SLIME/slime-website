// Vercel Serverless Function: GET /api/profile and POST /api/profile
// GET  ?account=0.0.xxx  → returns { pfp: PfpData | null }
// POST { account_id, pfp: PfpData | null } → upserts profile

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const supabase = getSupabase()

    // GET — fetch profile by account
    if (req.method === 'GET') {
      const { account } = req.query
      if (!account) return res.status(400).json({ error: 'Missing account' })

      const { data, error } = await supabase
        .from('profiles')
        .select('pfp_serial_number, pfp_image_url, pfp_name')
        .eq('account_id', account)
        .single()

      // PGRST116 = row not found — not an error, just no profile yet
      if (error && error.code !== 'PGRST116') {
        return res.status(500).json({ error: error.message })
      }

      if (!data || data.pfp_serial_number == null) {
        return res.status(200).json({ pfp: null })
      }

      return res.status(200).json({
        pfp: {
          serial_number: data.pfp_serial_number,
          imageUrl: data.pfp_image_url,
          name: data.pfp_name
        }
      })
    }

    // POST — upsert profile
    if (req.method === 'POST') {
      const { account_id, pfp } = req.body
      if (!account_id) return res.status(400).json({ error: 'Missing account_id' })

      const { error } = await supabase
        .from('profiles')
        .upsert({
          account_id,
          pfp_serial_number: pfp?.serial_number ?? null,
          pfp_image_url: pfp?.imageUrl ?? null,
          pfp_name: pfp?.name ?? null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'account_id' })

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('profile handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}
