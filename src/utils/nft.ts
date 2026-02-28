export interface NFTMetadata {
  name?: string
  image?: string
  description?: string
  attributes?: Array<{ trait_type: string; value: string }>
}

const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'

export async function decodeMetadata(base64: string): Promise<NFTMetadata | null> {
  try {
    const decoded = atob(base64)

    if (decoded.startsWith('ipfs://')) {
      const metadataUrl = decoded.replace('ipfs://', IPFS_GATEWAY)
      const response = await fetch(metadataUrl)
      if (!response.ok) return null
      const metadata = await response.json()
      if (metadata.image?.startsWith('ipfs://')) {
        const raw = metadata.image.replace('ipfs://', IPFS_GATEWAY)
        const hashIdx = raw.lastIndexOf('/')
        metadata.image = raw.substring(0, hashIdx + 1) + raw.substring(hashIdx + 1).replace(/#/g, '%23')
      }
      return metadata
    } else {
      const metadata = JSON.parse(decoded)
      if (metadata.image?.startsWith('ipfs://')) {
        const raw = metadata.image.replace('ipfs://', IPFS_GATEWAY)
        const hashIdx = raw.lastIndexOf('/')
        metadata.image = raw.substring(0, hashIdx + 1) + raw.substring(hashIdx + 1).replace(/#/g, '%23')
      }
      return metadata
    }
  } catch {
    return null
  }
}
