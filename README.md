# Job Marketplace DApp

A decentralized job marketplace built on blockchain technology, enabling trustless connections between employers and freelancers with secure smart contract-based escrow and payments.

## Tech Stack


### Frontend
- **React.js** - UI framework
- **ethers.js** - Ethereum blockchain interaction
- **TailwindCSS** - Styling
- **Web3Modal** - Wallet connection interface

### Backend & Blockchain
- **Solidity** - Smart contract development
- **Hardhat** - Ethereum development environment
- **IPFS** - Decentralized storage for job descriptions and deliverables
- **Ethereum/Polygon** - Blockchain network

## Key Features

### For Employers
- **Post Jobs** - Create detailed job listings with requirements and budget
- **Escrow System** - Funds are locked in smart contract until work completion
- **Review Applications** - Browse freelancer profiles and proposals
- **Milestone-Based Payments** - Split payments across project milestones
- **Dispute Resolution** - Built-in arbitration mechanism

### For Freelancers
- **Browse Jobs** - Search and filter available opportunities
- **Submit Proposals** - Apply with custom proposals and pricing
- **Reputation System** - Build on-chain reputation through completed jobs
- **Secure Payments** - Guaranteed payment upon milestone completion
- **Portfolio** - Showcase completed work and ratings

### Core Functionality
- **Wallet Integration** - Connect via MetaMask, WalletConnect, or Coinbase Wallet
- **Smart Contract Escrow** - Automatic fund management and release
- **IPFS Storage** - Decentralized storage for job details and work submissions
- **Rating System** - Two-way ratings for employers and freelancers
- **Transaction History** - Complete on-chain history of all jobs and payments
- **Gas Optimization** - Efficient contract design to minimize transaction costs

## Project Structure

```
job-marketplace-dapp/
├── contracts/          # Solidity smart contracts
├── scripts/            # Deployment scripts
├── test/              # Smart contract tests
├── src/
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Helper functions
│   └── abis/          # Contract ABIs
├── public/            # Static assets
└── hardhat.config.js  # Hardhat configuration
```

## Usage Example

- **Connect Wallet** - Connect your Web3 wallet to the DApp
- **Post a Job** (Employer) - Create a job listing with details and deposit escrow
- **Apply for Job** (Freelancer) - Submit proposal with timeline and cost
- **Accept Proposal** - Employer reviews and accepts a freelancer
- **Complete Milestones** - Freelancer submits work for each milestone
- **Release Payment** - Employer approves and smart contract releases funds
- **Leave Rating** - Both parties rate each other

## Security Features

- **Escrow Protection** - Funds locked until work completion
- **Reentrancy Guards** - Protection against common attacks
- **Access Control** - Role-based permissions
- **Audited Contracts** - Following OpenZeppelin standards
- **Emergency Pause** - Circuit breaker for critical situations

## Future Enhancements

- Multi-token payment support (USDC, DAI, etc.)
- DAO governance for dispute resolution
- Skills verification through on-chain credentials
- Integration with decentralized identity (DID)
- Cross-chain compatibility
- Mobile app development
  
<img width="1600" height="1041" alt="image" src="https://github.com/user-attachments/assets/48b1fcf0-abbb-43b3-b990-0c8d3d89f21d" />
