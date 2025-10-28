import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getConnectedAddress, onAccountsChanged, onChainChanged, getSigner } from '../lib/eth'

type WalletContextValue = {
  address: string | null
  connect: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    let cleanupAccounts: (() => void) | undefined
    let cleanupChain: (() => void) | undefined

    ;(async () => {
      const addr = await getConnectedAddress()
      setAddress(addr)
    })()

    cleanupAccounts = onAccountsChanged((accounts) => {
      setAddress(accounts && accounts.length > 0 ? accounts[0] : null)
    })
    cleanupChain = onChainChanged(() => {
      // re-fetch account on chain change
      ;(async () => setAddress(await getConnectedAddress()))()
    })

    return () => {
      cleanupAccounts && cleanupAccounts()
      cleanupChain && cleanupChain()
    }
  }, [])

  const connect = async () => {
    const signer = await getSigner()
    const addr = await signer.getAddress()
    setAddress(addr)
  }

  return (
    <WalletContext.Provider value={{ address, connect }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}


