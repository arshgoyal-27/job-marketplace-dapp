import { BrowserProvider, JsonRpcSigner } from 'ethers'
import type { Eip1193Provider } from 'ethers'

export function getWindowEthereum(): Eip1193Provider | undefined {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return (window as any).ethereum as Eip1193Provider
  }
  return undefined
}

export async function getProvider(): Promise<BrowserProvider> {
  const eth = getWindowEthereum()
  if (!eth) throw new Error('No EIP-1193 provider found. Install MetaMask.')
  return new BrowserProvider(eth)
}

export async function getSigner(): Promise<JsonRpcSigner> {
  const provider = await getProvider()
  await provider.send('eth_requestAccounts', [])
  return await provider.getSigner()
}

export async function getConnectedAddress(): Promise<string | null> {
  const eth = getWindowEthereum()
  if (!eth) return null
  const accounts = (await (eth as any).request({ method: 'eth_accounts' })) as string[]
  return accounts && accounts.length > 0 ? accounts[0] : null
}

export function onAccountsChanged(cb: (accounts: string[]) => void) {
  const eth = getWindowEthereum() as any
  if (!eth || !eth.on) return () => {}
  eth.on('accountsChanged', cb)
  return () => eth.removeListener && eth.removeListener('accountsChanged', cb)
}

export function onChainChanged(cb: (chainId: string) => void) {
  const eth = getWindowEthereum() as any
  if (!eth || !eth.on) return () => {}
  eth.on('chainChanged', cb)
  return () => eth.removeListener && eth.removeListener('chainChanged', cb)
}


