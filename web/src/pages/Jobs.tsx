import { useEffect, useState } from 'react'
import { getReadOnlyContract } from '../lib/contract'
import { Link } from 'react-router-dom'

type JobListItem = {
  jobId: bigint
  title: string
  employer: string
  totalBudget: bigint
  status: number
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

  if (loading) return <div>Loading...</div>
  if (error) return <div style={{ color: 'red' }}>{error}</div>

  return (
    <div>
      <h2>Jobs</h2>
      <ul>
        {items.map(j => (
          <li key={String(j.jobId)}>
            <Link to={`/jobs/${String(j.jobId)}`}>{j.title}</Link> — Budget: {Number(j.totalBudget) / 1e18} ETH
          </li>
        ))}
      </ul>
    </div>
  )
}


