import { FormEvent, useState } from 'react'
import { getWriteContract } from '../lib/contract'
import { parseEther } from 'ethers'

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
    <div>
      <h2>Create Job</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} required />
        </div>
        <div>
          <label>Budget (ETH)</label>
          <input type="number" step="0.0001" value={budgetEth} onChange={e => setBudgetEth(e.target.value)} required />
        </div>
        <div>
          <label>Deadline</label>
          <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Job'}</button>
      </form>
      {txHash && (
        <p>Tx: {txHash}</p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}


