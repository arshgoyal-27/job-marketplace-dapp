import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getReadOnlyContract, getWriteContract } from '../lib/contract'
import { useWallet } from '../state/wallet'

export default function JobDetail() {
  const { id } = useParams()
  const jobId = useMemo(() => (id ? BigInt(id) : null), [id])
  const { address } = useWallet()
  const [job, setJob] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [proposal, setProposal] = useState('')
  const [proposedAmount, setProposedAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return
    ;(async () => {
      try {
        setLoading(true)
        const c = await getReadOnlyContract()
        const j = await c.getJob(jobId)
        setJob(j)
        const ms = await c.getJobMilestones(jobId)
        setMilestones(ms)
        const apps = await c.getJobApplications(jobId)
        setApplications(apps)
      } catch (e: any) {
        setError(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [jobId])

  const apply = async () => {
    if (!jobId) return
    try {
      setTxLoading(true)
      const c = await getWriteContract()
      const tx = await c.applyForJob(jobId, proposal, BigInt(proposedAmount))
      await tx.wait()
      setProposal('')
      setProposedAmount('')
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e))
    } finally {
      setTxLoading(false)
    }
  }

  const hire = async (applicant: string) => {
    if (!jobId) return
    try {
      setTxLoading(true)
      const c = await getWriteContract()
      const tx = await c.hireFreelancer(jobId, applicant)
      await tx.wait()
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e))
    } finally {
      setTxLoading(false)
    }
  }

  const submitMilestone = async (index: number) => {
    if (!jobId) return
    try {
      setTxLoading(true)
      const c = await getWriteContract()
      const tx = await c.submitMilestone(jobId, BigInt(index))
      await tx.wait()
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e))
    } finally {
      setTxLoading(false)
    }
  }

  const approveMilestone = async (index: number) => {
    if (!jobId) return
    try {
      setTxLoading(true)
      const c = await getWriteContract()
      const tx = await c.approveMilestone(jobId, BigInt(index))
      await tx.wait()
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e))
    } finally {
      setTxLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div style={{ color: 'red' }}>{error}</div>
  if (!job) return <div>Job not found</div>

  const isEmployer = address && job.employer?.toLowerCase() === address.toLowerCase()
  const isFreelancer = address && job.freelancer?.toLowerCase() === address.toLowerCase()

  return (
    <div>
      <h2>{job.title}</h2>
      <p>{job.description}</p>
      <p>Employer: {job.employer}</p>
      <p>Freelancer: {job.freelancer === '0x0000000000000000000000000000000000000000' ? 'None' : job.freelancer}</p>
      <p>Total Budget: {Number(job.totalBudget) / 1e18} ETH</p>

      <h3>Milestones</h3>
      <ul>
        {milestones.map((m, idx) => (
          <li key={idx}>
            {m.description} — {Number(m.amount) / 1e18} ETH — {m.completed ? 'Submitted' : 'Pending'} — {m.approved ? 'Approved' : 'Not Approved'}
            {isFreelancer && !m.completed && (
              <button disabled={txLoading} onClick={() => submitMilestone(idx)}>
                {txLoading ? 'Submitting...' : 'Submit'}
              </button>
            )}
            {isEmployer && m.completed && !m.approved && (
              <button disabled={txLoading} onClick={() => approveMilestone(idx)}>
                {txLoading ? 'Approving...' : 'Approve'}
              </button>
            )}
          </li>
        ))}
      </ul>

      <h3>Applications</h3>
      <ul>
        {applications.map((a, idx) => (
          <li key={idx}>
            {a.applicant} — {Number(a.proposedAmount) / 1e18} ETH
            <br/>“{a.proposal}”
            {isEmployer && (
              <div>
                <button disabled={txLoading} onClick={() => hire(a.applicant)}>
                  {txLoading ? 'Hiring...' : 'Hire'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {!isEmployer && (
        <div>
          <h4>Apply to this job</h4>
          <textarea value={proposal} onChange={e => setProposal(e.target.value)} placeholder="Your proposal" />
          <div>
            <input type="number" placeholder="Proposed amount (wei)" value={proposedAmount} onChange={e => setProposedAmount(e.target.value)} />
          </div>
          <button disabled={txLoading} onClick={apply}>{txLoading ? 'Submitting...' : 'Apply'}</button>
        </div>
      )}
    </div>
  )
}


