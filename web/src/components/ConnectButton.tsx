import { useWallet } from '../state/wallet'
import './ConnectButton.css'

export default function ConnectButton() {
  const { address, connect } = useWallet()
  if (address) {
    return (
      <div className="wallet-connected">
        <div className="wallet-indicator"></div>
        <span className="wallet-address">{address.slice(0, 6)}...{address.slice(-4)}</span>
      </div>
    )
  }
  return (
    <button onClick={connect} className="connect-button">
      Connect Wallet
    </button>
  )
}



