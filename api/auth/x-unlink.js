import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// POST /api/auth/x-unlink
// Removes the user's leaderboard entry. Requires a valid session JWT.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No session token provided' })

  const jwtSecret = process.env.JWT_SECRET
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!jwtSecret || !supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server not configured' })
  }

  let payload
  try {
    payload = jwt.verify(token, jwtSecret)
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session token' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { error } = await supabase
    .from('leaderboard_users')
    .delete()
    .eq('x_user_id', payload.x_user_id)

  if (error) return res.status(500).json({ error: 'Failed to unlink account' })

  return res.status(200).json({ success: true })
}
