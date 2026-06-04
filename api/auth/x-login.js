import crypto from 'crypto'

// GET /api/auth/x-login?wallet=0.0.xxxxx
// Generates the X OAuth2 PKCE authorization URL.
//
// The codeVerifier and walletAddress are embedded directly into the OAuth
// `state` parameter (base64url-encoded JSON) instead of being returned to the
// frontend for localStorage storage.  This is critical for WebView environments
// such as HashPack's in-app browser, where localStorage is NOT reliably
// preserved across cross-origin navigations (dApp → Twitter → callback).
// Twitter echoes `state` back unmodified on the callback redirect, so the
// callback page can decode it without touching storage at all.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { wallet } = req.query
  if (!wallet) return res.status(400).json({ error: 'Missing wallet parameter' })

  const clientId = process.env.X_CLIENT_ID
  const redirectUri = process.env.X_REDIRECT_URI
  if (!clientId || !redirectUri) return res.status(500).json({ error: 'X OAuth not configured' })

  // PKCE
  const codeVerifier = crypto.randomBytes(64).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  // Embed verifier + wallet in state so the callback needs zero localStorage
  const statePayload = Buffer.from(
    JSON.stringify({ v: codeVerifier, w: wallet })
  ).toString('base64url')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.read users.read',
    state: statePayload,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `https://x.com/i/oauth2/authorize?${params}`

  // Only authUrl is needed by the frontend now
  return res.status(200).json({ authUrl })
}
