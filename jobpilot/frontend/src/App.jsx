import { useState } from 'react'
import InboxLoader from './components/InboxLoader.jsx'
import TrackerBoard from './components/TrackerBoard.jsx'
import ScamPanel from './components/ScamPanel.jsx'
import FollowUpPanel from './components/FollowUpPanel.jsx'
import StatsBar from './components/StatsBar.jsx'
import { exportCSV, exportJSON } from './exportData.js'

export default function App() {
  const [result, setResult]     = useState(null)   // { classified, scams, followups, stats }
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [activeTab, setActiveTab] = useState('tracker') // tracker | scams | followups

  const handleClassify = async (emails) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setResult(data)
      setActiveTab('tracker')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => { setResult(null); setError(null) }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "-apple-system,'Segoe UI',system-ui,sans-serif" }}>

      {/* ── Navbar ── */}
      <header style={{
        background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>🧭</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Job<span style={{ color: '#3b82f6' }}>Pilot</span>
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>AI Job Hunt Autopilot</span>
        </div>

        {/* Tabs — only when results are loaded */}
        {result && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 20 }}>
            {[
              { id: 'tracker',  label: '📋 Tracker',   count: result.stats.total },
              { id: 'scams',    label: '🚨 Scams',      count: result.scams.length },
              { id: 'followups',label: '⏰ Follow-ups', count: result.followups.length },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                color: activeTab === tab.id ? '#2563eb' : '#64748b',
              }}>
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    marginLeft: 5, fontSize: 10, fontWeight: 700,
                    background: activeTab === tab.id ? '#2563eb' : '#e2e8f0',
                    color: activeTab === tab.id ? 'white' : '#64748b',
                    borderRadius: 99, padding: '1px 6px',
                  }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {result && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {[
              { label: '⬇ CSV',  run: () => exportCSV(result.classified) },
              { label: '⬇ JSON', run: () => exportJSON(result.classified) },
            ].map(b => (
              <button key={b.label} onClick={b.run} style={{
                padding: '5px 12px', borderRadius: 8,
                border: '1px solid #bfdbfe', background: '#eff6ff', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, color: '#2563eb',
              }}>{b.label}</button>
            ))}
          </div>
        )}

        {result && (
          <button onClick={handleReset} style={{
            marginLeft: 8, padding: '5px 12px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: '#64748b',
          }}>↩ Load new inbox</button>
        )}

        <div style={{
          marginLeft: result ? 8 : 'auto',
          fontSize: 11, fontWeight: 600, color: '#3b82f6',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 99, padding: '3px 10px',
        }}>✦ Gemini AI</div>
      </header>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {!result && !loading && (
          <InboxLoader onClassify={handleClassify} error={error} />
        )}

        {loading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 360, gap: 16,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['#3b82f6','#ef4444','#f59e0b','#10b981'].map((c, i) => (
                <div key={i} style={{
                  width: 12, height: 12, borderRadius: '50%', background: c,
                  animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                }}/>
              ))}
            </div>
            <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
              Analysing inbox with Gemini AI…
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Classifying each email — detecting scams, interviews & follow-ups
            </div>
            <style>{`
              @keyframes bounce {
                0%,80%,100% { transform: scale(0.7); opacity:0.4; }
                40% { transform: scale(1.2); opacity:1; }
              }
            `}</style>
          </div>
        )}

        {result && (
          <>
            <StatsBar stats={result.stats} />
            {activeTab === 'tracker'  && <TrackerBoard emails={result.classified} />}
            {activeTab === 'scams'    && <ScamPanel scams={result.scams} />}
            {activeTab === 'followups'&& <FollowUpPanel followups={result.followups} />}
          </>
        )}
      </main>
    </div>
  )
}
