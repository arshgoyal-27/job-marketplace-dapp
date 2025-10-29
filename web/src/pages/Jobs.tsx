import { useEffect, useState } from 'react'
import { getReadOnlyContract } from '../lib/contract'
import { Link } from 'react-router-dom'
import './Jobs.css'

type JobListItem = {
  jobId: bigint
  title: string
  employer: string
  totalBudget: bigint
  status: number
}

const getStatusBadge = (status: number) => {
  switch (status) {
    case 0:
      return <span className="badge badge-pending">Open</span>
    case 1:
      return <span className="badge badge-warning">In Progress</span>
    case 2:
      return <span className="badge badge-success">Completed</span>
    default:
      return <span className="badge badge-pending">Unknown</span>
  }
}

export default function Jobs() {
  const [items, setItems] = useState<JobListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const c = await getReadOnlyContract()
        const jobCounter: bigint = await c.jobCounter()
        const results: JobListItem[] = []
        for (let i = 1n; i <= jobCounter; i++) {
          try {
            const j = await c.getJob(i)
            results.push({
              jobId: j.jobId,
              title: j.title,
              employer: j.employer,
              totalBudget: j.totalBudget,
              status: Number(j.status),
            })
          } catch {}
        }
        setItems(results)
      } catch (e: any) {
        let msg = e?.message || String(e)
        if (msg.includes('Contract address not set')) {
          msg += ' — Set VITE_JOB_MARKETPLACE_ADDRESS in web/.env to your deployed address.'
        }
        if (msg.includes('No contract code at')) {
          msg += ' — Make sure your wallet is on the correct network and the address is deployed there.'
        }
        setError(msg)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="loading">Loading jobs...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="jobs-page">
      <div className="page-header">
        <h1>Available Jobs</h1>
        <p className="page-subtitle">Find your next opportunity in the decentralized marketplace</p>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">
          <p>No jobs available yet. Be the first to create one!</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {items.map(j => (
            <Link to={`/jobs/${String(j.jobId)}`} key={String(j.jobId)} className="job-card card">
              <div className="job-card-header">
                <h3 className="job-title">{j.title}</h3>
                {getStatusBadge(j.status)}
              </div>
              <div className="job-card-body">
                <div className="job-info">
                  <div className="job-info-item">
                    <span className="job-info-label">Budget</span>
                    <span className="job-info-value">{Number(j.totalBudget) / 1e18} ETH</span>
                  </div>
                  <div className="job-info-item">
                    <span className="job-info-label">Employer</span>
                    <span className="job-info-value job-address">{j.employer.slice(0, 6)}...{j.employer.slice(-4)}</span>
                  </div>
                </div>
              </div>
              <div className="job-card-footer">
                <span className="view-job">View Details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


