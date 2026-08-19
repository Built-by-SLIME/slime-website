export interface NFTMetadata {
  name?: string
  image?: string
  animation_url?: string
  description?: string
  attributes?: Array<{ trait_type: string; value: string }>
  // HIP-412 files array — first entry is image, subsequent entries may be MP4 etc.
  files?: Array<{ uri?: string; url?: string; type?: string }>
}

const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'

// Rewrites private Pinata gateway URLs and ipfs:// URIs to a public IPFS gateway
function toPublicUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('ipfs://')) {
    return IPFS_GATEWAY + url.slice(7).replace(/#/g, '%23')
  }
  const pinataIdx = url.indexOf('.mypinata.cloud/ipfs/')
  if (pinataIdx !== -1) {
    return IPFS_GATEWAY + url.slice(pinataIdx + '.mypinata.cloud/ipfs/'.length)
  }
  return url
}

export async function decodeMetadata(base64: string): Promise<NFTMetadata | null> {
  try {
    const decoded = atob(base64)

    if (decoded.startsWith('ipfs://')) {
      const metadataUrl = toPublicUrl(decoded)
      const response = await fetch(metadataUrl)
      if (!response.ok) return null
      const metadata = await response.json()
      if (metadata.image) metadata.image = toPublicUrl(metadata.image)
      if (metadata.animation_url) metadata.animation_url = toPublicUrl(metadata.animation_url)
      return metadata
    } else {
      const metadata = JSON.parse(decoded)
      if (metadata.image) metadata.image = toPublicUrl(metadata.image)
      if (metadata.animation_url) metadata.animation_url = toPublicUrl(metadata.animation_url)
      return metadata
    }
  } catch {
    return null
  }
}

// ── Swap-specific media proxy ────────────────────────────────────────────────
// The swap page pulls NFT metadata/images from many sources (IPFS, direct HTTP,
// inscriptions, Pinata, etc.). Browsers block cross-origin fetches without CORS,
// so every external URL is routed through /api/media-proxy, which fetches the
// asset server-side and returns it with permissive CORS headers.
function toSwapPublicUrl(url: string): string {
  if (!url) return url
  // Data URIs, blobs, and same-origin paths already work in the browser.
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url
  }
  return '/api/media-proxy?url=' + encodeURIComponent(url)
}

export async function decodeSwapMetadata(base64: string): Promise<NFTMetadata | null> {
  try {
    const decoded = atob(base64)
    if (decoded.startsWith('ipfs://')) {
      const metadataUrl = toSwapPublicUrl(decoded)
      const response = await fetch(metadataUrl)
      if (!response.ok) return null
      const metadata = await response.json()
      if (metadata.image) metadata.image = toSwapPublicUrl(metadata.image)
      return metadata
    } else {
      const metadata = JSON.parse(decoded)
      if (metadata.image) metadata.image = toSwapPublicUrl(metadata.image)
      return metadata
    }
  } catch {
    return null
  }
}
