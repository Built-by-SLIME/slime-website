import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// POST /api/auth/x-token
// Exchanges the X OAuth code for an access token, fetches the user profile,
// upserts them in Supabase, then returns a signed JWT session token.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code, codeVerifier, walletAddress } = req.body
  if (!code || !codeVerifier || !walletAddress) {
    return res.status(400).json({ error: 'Missing code, codeVerifier, or walletAddress' })
  }

  const clientId = process.env.X_CLIENT_ID
  const clientSecret = process.env.X_CLIENT_SECRET
  const redirectUri = process.env.X_REDIRECT_URI
  const jwtSecret = process.env.JWT_SECRET
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!clientId || !clientSecret || !redirectUri || !jwtSecret || !supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server not configured' })
  }

  // Exchange code for X access token
  const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    return res.status(400).json({ error: 'Token exchange failed', detail: err })
  }

  const { access_token } = await tokenRes.json()

  // Fetch X user profile
  const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!userRes.ok) {
    return res.status(400).json({ error: 'Failed to fetch X user profile' })
  }

  const { data: xUser } = await userRes.json()

  // Upsert into Supabase
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { error: dbError } = await supabase.from('leaderboard_users').upsert(
    {
      x_user_id: xUser.id,
      x_username: xUser.username,
      x_avatar_url: xUser.profile_image_url?.replace('_normal', '_400x400') || null,
      wallet_address: walletAddress,
      last_seen: new Date().toISOString(),
    },
    { onConflict: 'x_user_id' }
  )

  if (dbError) {
    // wallet_address unique constraint — already linked to another X account
    if (dbError.code === '23505') {
      return res.status(409).json({ error: 'This wallet is already linked to another X account.' })
    }
    return res.status(500).json({ error: 'Database error', detail: dbError.message })
  }

  // Issue a session JWT
  const sessionToken = jwt.sign(
    {
      x_user_id: xUser.id,
      x_username: xUser.username,
      x_avatar_url: xUser.profile_image_url?.replace('_normal', '_400x400') || null,
      wallet_address: walletAddress,
    },
    jwtSecret,
    { expiresIn: '30d' }
  )

  return res.status(200).json({
    success: true,
    sessionToken,
    user: {
      x_user_id: xUser.id,
      x_username: xUser.username,
      x_avatar_url: xUser.profile_image_url?.replace('_normal', '_400x400') || null,
      wallet_address: walletAddress,
    },
  })
}
