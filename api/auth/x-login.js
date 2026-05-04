import crypto from 'crypto'

// GET /api/auth/x-login
// Generates the X OAuth2 PKCE authorization URL and returns it to the frontend.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const clientId = process.env.X_CLIENT_ID
  const redirectUri = process.env.X_REDIRECT_URI
  if (!clientId || !redirectUri) return res.status(500).json({ error: 'X OAuth not configured' })

  // PKCE: generate code_verifier + code_challenge
  const codeVerifier = crypto.randomBytes(64).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  // CSRF: random state token
  const state = crypto.randomBytes(32).toString('base64url')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.read users.read',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params}`

  return res.status(200).json({ authUrl, state, codeVerifier })
}
