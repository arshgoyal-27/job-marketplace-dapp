import './App.css'
import { Link, Route, Routes } from 'react-router-dom'
import ConnectButton from './components/ConnectButton'
import Jobs from './pages/Jobs'
import CreateJob from './pages/CreateJob'
import JobDetail from './pages/JobDetail'

function App() {
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/">Jobs</Link>
          <Link to="/create">Create Job</Link>
        </nav>
        <ConnectButton />
      </header>
      <main style={{ marginTop: 24 }}>
        <Routes>
          <Route path="/" element={<Jobs />} />
          <Route path="/create" element={<CreateJob />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
