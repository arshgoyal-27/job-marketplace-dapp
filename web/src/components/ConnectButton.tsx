import { useWallet } from '../state/wallet'

export default function ConnectButton() {
  const { address, connect } = useWallet()
  if (address) {
    return <div>Connected: {address.slice(0, 6)}...{address.slice(-4)}</div>
  }
  return (
    <button onClick={connect}>
      Connect Wallet
    </button>
  )
}



