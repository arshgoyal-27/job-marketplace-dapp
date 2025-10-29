import './App.css'
import { Link, Route, Routes } from 'react-router-dom'
import ConnectButton from './components/ConnectButton'
import Jobs from './pages/Jobs'
import CreateJob from './pages/CreateJob'
import JobDetail from './pages/JobDetail'

function App() {
  return (
    <div className="app-container">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link to="/" style={{ fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Job Marketplace
            </Link>
            <nav>
              <Link to="/">Jobs</Link>
              <Link to="/create">Create Job</Link>
            </nav>
          </div>
          <ConnectButton />
        </div>
      </header>
      <main>
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
