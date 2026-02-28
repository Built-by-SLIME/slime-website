import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { DAppConnector, HederaSessionEvent, HederaJsonRpcMethod, HederaChainId } from '@hashgraph/hedera-wallet-connect'
import { LedgerId } from '@hashgraph/sdk'

const SLIME_NFT_TOKEN = '0.0.9474754'
const SLIME_TOKEN = '0.0.10294707'
const STORAGE_KEY_PFP = 'slime_pfp'
const STORAGE_KEY_SOCIAL = 'slime_social'

export interface RawNFT {
  token_id: string
  serial_number: number
  metadata?: string
}

export interface PfpData {
  serial_number: number
  imageUrl: string
  name: string
}

export interface SocialInfo {
  twitter: string
  discord: string
  bio: string
}

interface WalletContextType {
  isConnected: boolean
  accountId: string
  slimeNFTs: RawNFT[]
  slimeTokenBalance: string
  pfp: PfpData | null
  socialInfo: SocialInfo
  dAppConnector: DAppConnector | null
  connect: () => Promise<void>
  disconnect: () => void
  setPfp: (pfp: PfpData | null) => void
  setSocialInfo: (info: SocialInfo) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const DEFAULT_SOCIAL: SocialInfo = { twitter: '', discord: '', bio: '' }

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [slimeNFTs, setSlimeNFTs] = useState<RawNFT[]>([])
  const [slimeTokenBalance, setSlimeTokenBalance] = useState('0')
  const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(null)

  const [pfp, setPfpState] = useState<PfpData | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PFP) || 'null') } catch { return null }
  })

  const [socialInfo, setSocialInfoState] = useState<SocialInfo>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SOCIAL) || 'null') || DEFAULT_SOCIAL } catch { return DEFAULT_SOCIAL }
  })

  useEffect(() => {
    const init = async () => {
      try {
        const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
        if (!projectId) {
          console.error('WalletConnect Project ID not configured')
          return
        }

        const connector = new DAppConnector(
          {
            name: 'SLIME',
            description: 'The SLIME community dApp on Hedera',
            url: window.location.origin,
            icons: [`${window.location.origin}/favicon.ico`]
          },
          LedgerId.MAINNET,
          projectId,
          Object.values(HederaJsonRpcMethod),
          [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
          [HederaChainId.Mainnet]
        )

        await connector.init({ logger: 'error' })
        setDAppConnector(connector)

        // Restore existing WalletConnect session (handles page reloads)
        const existingSessions = connector.walletConnectClient?.session.getAll()
        if (existingSessions && existingSessions.length > 0) {
          const session = existingSessions[0]
          const accounts = session.namespaces?.hedera?.accounts || []
          if (accounts.length > 0) {
            const account = accounts[0].split(':').pop() || ''
            if (account) {
              setAccountId(account)
              setIsConnected(true)
              await fetchWalletData(account)
            }
          }
        }
      } catch (err) {
        console.error('DAppConnector init failed:', err)
      }
    }

    init()
    // No cleanup disconnect — connection should persist across page navigations
  }, [])

  const fetchWalletData = async (account: string) => {
    const MIRROR = 'https://mainnet-public.mirrornode.hedera.com'
    try {
      // Fetch token balance in parallel with NFT pagination
      const tokenPromise = fetch(`${MIRROR}/api/v1/accounts/${account}/tokens?token.id=${SLIME_TOKEN}`)

      // Paginate NFTs — follow links.next until exhausted
      const allNFTs: RawNFT[] = []
      let nextPath: string | null = `/api/v1/accounts/${account}/nfts?token.id=${SLIME_NFT_TOKEN}&limit=100`
      while (nextPath) {
        const nftPageRes: Response = await fetch(`${MIRROR}${nextPath}`)
        if (!nftPageRes.ok) break
        const nftPageData: { nfts: RawNFT[]; links?: { next?: string } } = await nftPageRes.json()
        allNFTs.push(...(nftPageData.nfts || []))
        nextPath = nftPageData.links?.next || null
      }
      setSlimeNFTs(allNFTs)

      const tokenRes = await tokenPromise
      if (tokenRes.ok) {
        const data = await tokenRes.json()
        const token = data.tokens?.find((t: { token_id: string; balance: number }) => t.token_id === SLIME_TOKEN)
        setSlimeTokenBalance(token ? String(token.balance) : '0')
      }
    } catch (err) {
      console.error('Failed to fetch wallet data:', err)
    }
  }

  const connect = async () => {
    if (!dAppConnector) throw new Error('Wallet connector not ready')

    await dAppConnector.openModal()

    const sessions = dAppConnector.walletConnectClient?.session.getAll()
    if (sessions && sessions.length > 0) {
      const accounts = sessions[0].namespaces?.hedera?.accounts || []
      if (accounts.length > 0) {
        const account = accounts[0].split(':').pop() || ''
        setAccountId(account)
        setIsConnected(true)
        await fetchWalletData(account)
      }
    }
  }

  const disconnect = () => {
    try { dAppConnector?.disconnectAll() } catch { /* ignore */ }
    setIsConnected(false)
    setAccountId('')
    setSlimeNFTs([])
    setSlimeTokenBalance('0')
  }

  const setPfp = (data: PfpData | null) => {
    setPfpState(data)
    localStorage.setItem(STORAGE_KEY_PFP, JSON.stringify(data))
  }

  const setSocialInfo = (info: SocialInfo) => {
    setSocialInfoState(info)
    localStorage.setItem(STORAGE_KEY_SOCIAL, JSON.stringify(info))
  }

  return (
    <WalletContext.Provider value={{
      isConnected, accountId, slimeNFTs, slimeTokenBalance,
      pfp, socialInfo, dAppConnector,
      connect, disconnect, setPfp, setSocialInfo
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) throw new Error('useWallet must be used within a WalletProvider')
  return context
}
