export interface NFTMetadata {
  name?: string
  image?: string
  description?: string
  attributes?: Array<{ trait_type: string; value: string }>
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
      return metadata
    } else {
      const metadata = JSON.parse(decoded)
      if (metadata.image) metadata.image = toPublicUrl(metadata.image)
      return metadata
    }
  } catch {
    return null
  }
}
