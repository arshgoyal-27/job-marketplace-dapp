import { Contract, JsonRpcSigner, ethers } from 'ethers'
import { getProvider, getSigner } from './eth'
import JobMarketplaceArtifact from '../contracts/artifacts/contracts/project.sol/JobMarketplace.json'

export type JobStatus = 0 | 1 | 2 | 3 | 4

export interface Job {
  jobId: bigint
  employer: string
  freelancer: string
  title: string
  description: string
  totalBudget: bigint
  remainingBudget: bigint
  deadline: bigint
  status: JobStatus
  createdAt: bigint
  disputeRaisedAt: bigint
}

export interface Milestone {
  description: string
  amount: bigint
  completed: boolean
  approved: boolean
  submittedAt: bigint
}

export interface Application {
  applicant: string
  proposal: string
  proposedAmount: bigint
  appliedAt: bigint
}

export interface Rating {
  rater: string
  ratee: string
  score: number
  review: string
  jobId: bigint
  timestamp: bigint
}

// TODO: Update this address after deployment
export const JOB_MARKETPLACE_ADDRESS = (import.meta as any).env.VITE_JOB_MARKETPLACE_ADDRESS as string

function assertValidAddress() {
  if (!JOB_MARKETPLACE_ADDRESS) {
    throw new Error('Contract address not set. Define VITE_JOB_MARKETPLACE_ADDRESS in web/.env')
  }
  if (!ethers.isAddress(JOB_MARKETPLACE_ADDRESS)) {
    throw new Error(`Invalid contract address: ${JOB_MARKETPLACE_ADDRESS}`)
  }
}

async function assertCodeDeployed(provider: any) {
  const code = await provider.getCode(JOB_MARKETPLACE_ADDRESS)
  if (!code || code === '0x') {
    const network = await provider.getNetwork()
    throw new Error(`No contract code at ${JOB_MARKETPLACE_ADDRESS} on chain ${network?.chainId?.toString?.()}. Switch network or redeploy.`)
  }
}

export function getJobMarketplaceContract(signer?: JsonRpcSigner) {
  assertValidAddress()
  const iface = JobMarketplaceArtifact.abi
  if (signer) {
    return new Contract(JOB_MARKETPLACE_ADDRESS, iface, signer)
  }
  return new Contract(JOB_MARKETPLACE_ADDRESS, iface, (ethers as any))
}

export async function getReadOnlyContract() {
  assertValidAddress()
  const provider = await getProvider()
  await assertCodeDeployed(provider)
  return new Contract(JOB_MARKETPLACE_ADDRESS, JobMarketplaceArtifact.abi, provider)
}

export async function getWriteContract() {
  assertValidAddress()
  const signer = await getSigner()
  const provider = await signer.provider
  await assertCodeDeployed(provider)
  return new Contract(JOB_MARKETPLACE_ADDRESS, JobMarketplaceArtifact.abi, signer)
}


