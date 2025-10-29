import { FormEvent, useState } from 'react'
import { getWriteContract } from '../lib/contract'
import { parseEther } from 'ethers'
import './CreateJob.css'

export default function CreateJob() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budgetEth, setBudgetEth] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      setLoading(true)
      const contract = await getWriteContract()
      const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000)
      const value = parseEther(budgetEth)
      const tx = await contract.createJob(title, description, BigInt(deadlineTs), { value })
      const receipt = await tx.wait()
      setTxHash(receipt?.hash ?? tx.hash)
      setTitle('')
      setDescription('')
      setBudgetEth('')
      setDeadline('')
    } catch (err: any) {
      setError(err?.shortMessage || err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-job-page">
      <div className="page-header">
        <h1>Create New Job</h1>
        <p className="page-subtitle">Post your project and find the perfect freelancer</p>
      </div>
      <div className="form-container card">
        <form onSubmit={onSubmit} className="job-form">
          <div className="form-group">
            <label htmlFor="title">Job Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Build a Web3 DApp"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your project in detail..."
              rows={6}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="budget">Budget (ETH)</label>
              <input
                id="budget"
                type="number"
                step="0.0001"
                value={budgetEth}
                onChange={e => setBudgetEth(e.target.value)}
                placeholder="0.0"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="deadline">Deadline</label>
              <input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          {txHash && (
            <div className="success-message">
              <strong>Job created successfully!</strong>
              <p className="tx-hash">Transaction: <code>{txHash}</code></p>
            </div>
          )}
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Creating Job...' : 'Create Job'}
          </button>
        </form>
      </div>
    </div>
  )
}


