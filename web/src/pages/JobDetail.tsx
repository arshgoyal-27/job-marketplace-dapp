import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getReadOnlyContract, getWriteContract } from '../lib/contract'
import { useWallet } from '../state/wallet'
import { parseEther } from 'ethers'
import './JobDetail.css'

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

  const refreshData = async () => {
    if (!jobId) return
    try {
      const c = await getReadOnlyContract()
      const j = await c.getJob(jobId)
      setJob(j)
      const ms = await c.getJobMilestones(jobId)
      setMilestones(ms)
      const apps = await c.getJobApplications(jobId)
      setApplications(apps)
    } catch (e: any) {
      console.error('Failed to refresh:', e)
    }
  }

  const apply = async () => {
    if (!jobId) return
    try {
      setTxLoading(true)
      setError(null)
      const c = await getWriteContract()
      const amountWei = parseEther(proposedAmount)
      const tx = await c.applyForJob(jobId, proposal, amountWei)
      await tx.wait()
      setProposal('')
      setProposedAmount('')
      await refreshData()
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
      setError(null)
      const c = await getWriteContract()
      const tx = await c.hireFreelancer(jobId, applicant)
      await tx.wait()
      await refreshData()
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
      setError(null)
      const c = await getWriteContract()
      const tx = await c.submitMilestone(jobId, BigInt(index))
      await tx.wait()
      await refreshData()
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
      setError(null)
      const c = await getWriteContract()
      const tx = await c.approveMilestone(jobId, BigInt(index))
      await tx.wait()
      await refreshData()
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || String(e))
    } finally {
      setTxLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading job details...</div>
  if (error && !job) return <div className="error">{error}</div>
  if (!job) return <div className="error">Job not found</div>

  const isEmployer = address && job.employer?.toLowerCase() === address.toLowerCase()
  const isFreelancer = address && job.freelancer?.toLowerCase() === address.toLowerCase()
  const hasFreelancer = job.freelancer !== '0x0000000000000000000000000000000000000000'

  return (
    <div className="job-detail-page">
      <div className="job-header card">
        <div className="job-header-top">
          <h1>{job.title}</h1>
        </div>
        <p className="job-description">{job.description}</p>
        <div className="job-meta">
          <div className="meta-item">
            <span className="meta-label">Total Budget</span>
            <span className="meta-value budget">{Number(job.totalBudget) / 1e18} ETH</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Employer</span>
            <span className="meta-value address">{job.employer}</span>
          </div>
          {hasFreelancer && (
            <div className="meta-item">
              <span className="meta-label">Freelancer</span>
              <span className="meta-value address">{job.freelancer}</span>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="job-sections">
        <section className="section">
          <h2>Milestones</h2>
          {milestones.length === 0 ? (
            <div className="empty-state-card">No milestones defined for this job.</div>
          ) : (
            <div className="milestones-list">
              {milestones.map((m, idx) => (
                <div key={idx} className="milestone-card card">
                  <div className="milestone-header">
                    <div className="milestone-info">
                      <h3>Milestone {idx + 1}</h3>
                      <div className="milestone-status">
                        {m.completed && m.approved ? (
                          <span className="badge badge-success">Approved</span>
                        ) : m.completed ? (
                          <span className="badge badge-warning">Pending Approval</span>
                        ) : (
                          <span className="badge badge-pending">Not Submitted</span>
                        )}
                      </div>
                    </div>
                    <div className="milestone-amount">{Number(m.amount) / 1e18} ETH</div>
                  </div>
                  <p className="milestone-description">{m.description}</p>
                  <div className="milestone-actions">
                    {isFreelancer && !m.completed && (
                      <button disabled={txLoading} onClick={() => submitMilestone(idx)} className="action-button">
                        {txLoading ? 'Submitting...' : 'Submit Milestone'}
                      </button>
                    )}
                    {isEmployer && m.completed && !m.approved && (
                      <button disabled={txLoading} onClick={() => approveMilestone(idx)} className="action-button approve-button">
                        {txLoading ? 'Approving...' : 'Approve Milestone'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <h2>Applications {applications.length > 0 && <span className="count-badge">{applications.length}</span>}</h2>
          {applications.length === 0 ? (
            <div className="empty-state-card">No applications yet.</div>
          ) : (
            <div className="applications-list">
              {applications.map((a, idx) => (
                <div key={idx} className="application-card card">
                  <div className="application-header">
                    <div className="applicant-info">
                      <span className="applicant-address address">{a.applicant}</span>
                    </div>
                    <div className="proposed-amount">{Number(a.proposedAmount) / 1e18} ETH</div>
                  </div>
                  <p className="application-proposal">"{a.proposal}"</p>
                  {isEmployer && !hasFreelancer && (
                    <div className="application-actions">
                      <button disabled={txLoading} onClick={() => hire(a.applicant)} className="action-button hire-button">
                        {txLoading ? 'Hiring...' : 'Hire This Freelancer'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {!isEmployer && !hasFreelancer && (
          <section className="section">
            <h2>Apply to this Job</h2>
            <div className="apply-form card">
              <div className="form-group">
                <label htmlFor="proposal">Your Proposal</label>
                <textarea
                  id="proposal"
                  value={proposal}
                  onChange={e => setProposal(e.target.value)}
                  placeholder="Describe why you're the right person for this job..."
                  rows={5}
                />
              </div>
              <div className="form-group">
                <label htmlFor="proposed-amount">Proposed Amount (ETH)</label>
                <input
                  id="proposed-amount"
                  type="number"
                  step="0.0001"
                  placeholder="0.0"
                  value={proposedAmount}
                  onChange={e => setProposedAmount(e.target.value)}
                />
              </div>
              <button disabled={txLoading || !proposal || !proposedAmount} onClick={apply} className="submit-button">
                {txLoading ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}


