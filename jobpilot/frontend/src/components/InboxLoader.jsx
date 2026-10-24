import { useState } from 'react'
import JobPilotBot from './JobPilotBot.jsx'
import sampleInbox from '../sampleInbox.json'


export default function InboxLoader({ onClassify, error }) {
  const [jsonText, setJsonText]   = useState('')
  const [parseErr, setParseErr]   = useState(null)
  const [loadingSample, setLoadingSample] = useState(false)

  const handleLoadSample = () => {
    setJsonText(JSON.stringify(sampleInbox, null, 2))
    setParseErr(null)
  }

  const handleRun = () => {
    setParseErr(null)
    let emails
    try {
      emails = JSON.parse(jsonText)
      if (!Array.isArray(emails)) throw new Error('Must be a JSON array')
      if (emails.length === 0)   throw new Error('Array is empty')
    } catch (e) {
      setParseErr('Invalid JSON: ' + e.message)
      return
    }
    onClassify(emails)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setJsonText(ev.target.result); setParseErr(null) }
    reader.readAsText(file)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <JobPilotBot message="Good day! Please surrender your inbox. I promise to judge only the scammers." />
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Job Hunt Autopilot
        </h1>
        <p style={{ fontSize: 15, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          Paste your inbox JSON and let AI classify every email — <br/>
          <strong style={{ color: '#0f172a' }}>applied · interview · offer · rejected</strong>
          {' '}and flag <strong style={{ color: '#ef4444' }}>scams in red</strong>.
        </p>
      </div>

      {/* Main card */}
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Header row */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8fafc',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
            📥 Load inbox JSON
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{
              padding: '5px 12px', borderRadius: 8,
              border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: '#475569',
            }}>
              📎 Upload .json
              <input type="file" accept=".json" aria-label="Upload inbox JSON file" onChange={handleFile} style={{ display: 'none' }} />
            </label>
            <button onClick={handleLoadSample} disabled={loadingSample} style={{
              padding: '5px 12px', borderRadius: 8,
              border: '1px solid #bfdbfe', background: '#eff6ff', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: '#2563eb',
            }}>
              {loadingSample ? '…' : '✨ Load sample inbox (20 emails)'}
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          aria-label="Inbox JSON"
          value={jsonText}
          onChange={e => { setJsonText(e.target.value); setParseErr(null) }}
          placeholder='[\n  { "id": 1, "date": "2026-10-10", "from": "...", "subject": "...", "body": "..." },\n  ...\n]'
          rows={14}
          style={{
            width: '100%', display: 'block', border: 'none', outline: 'none',
            resize: 'vertical', padding: '14px 20px',
            fontFamily: "'Fira Code', 'Consolas', monospace",
            fontSize: 12, lineHeight: 1.7, color: '#1e293b', background: 'white',
          }}
        />

        {/* Footer row */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8fafc',
        }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {jsonText ? (() => {
              try { const a = JSON.parse(jsonText); return `${a.length} email${a.length !== 1 ? 's' : ''} loaded` }
              catch { return '' }
            })() : 'Paste JSON or load the sample inbox above'}
          </div>
          <button
            onClick={handleRun}
            disabled={!jsonText.trim()}
            style={{
              padding: '8px 22px', borderRadius: 10, border: 'none',
              background: jsonText.trim() ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : '#e2e8f0',
              color: jsonText.trim() ? 'white' : '#64748b',
              fontSize: 13, fontWeight: 700, cursor: jsonText.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            🚀 Analyse Inbox
          </button>
        </div>
      </div>

      {/* Error messages */}
      {(parseErr || error) && (
        <div role="alert" style={{
          marginTop: 12, padding: '10px 16px', borderRadius: 10,
          background: '#fef2f2', border: '1px solid #fecaca',
          fontSize: 12, color: '#dc2626', fontWeight: 600,
        }}>
          ✕ {parseErr || error}
        </div>
      )}

      {/* What to expect */}
      <div style={{
        marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12,
      }}>
        {[
          { icon: '📋', title: 'Auto Tracker', desc: 'Every email classified into applied, interview, offer, or rejected columns' },
          { icon: '🚨', title: 'Scam Detection', desc: 'Fake offers flagged in red with specific reasons — fee requests, document asks' },
          { icon: '⏰', title: 'Follow-up Alerts', desc: 'Applications with no reply after 7 days surfaced automatically' },
        ].map((f, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
