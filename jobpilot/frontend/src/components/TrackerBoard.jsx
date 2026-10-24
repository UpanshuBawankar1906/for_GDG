const COLUMNS = [
  { id: 'applied',   label: 'Applied',   color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: '📤' },
  { id: 'interview', label: 'Interview', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: '🎯' },
  { id: 'offer',     label: 'Offer',     color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', icon: '🎉' },
  { id: 'rejected',  label: 'Rejected',  color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: '❌' },
  { id: 'scam',      label: 'Scam',      color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '🚨' },
]

function EmailCard({ email }) {
  const col   = COLUMNS.find(c => c.id === email.category) || COLUMNS[0]
  const isScam = email.category === 'scam'

  return (
    <div style={{
      background: 'white', borderRadius: 12,
      border: `1px solid ${isScam ? '#fca5a5' : '#e2e8f0'}`,
      padding: '12px 14px', marginBottom: 8,
      boxShadow: isScam ? '0 0 0 2px #fee2e2' : '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      {/* Company + role */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 1 }}>
            {email.company || 'Unknown'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email.role || email.subject}
          </div>
        </div>
        {/* Confidence badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, flexShrink: 0,
          background: col.bg, color: col.color, border: `1px solid ${col.border}`,
        }}>
          {Math.round((email.confidence || 0) * 100)}%
        </span>
      </div>

      {/* Summary */}
      {email.summary && (
        <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, marginBottom: isScam ? 8 : 0 }}>
          {email.summary}
        </div>
      )}

      {/* Scam reasons */}
      {isScam && email.scam_reasons?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
          {email.scam_reasons.map((r, i) => (
            <span key={i} style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 99,
              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 600,
            }}>⚠ {r}</span>
          ))}
        </div>
      )}

      {/* Date + from */}
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
        <span>{email.from}</span>
        <span>{email.date}</span>
      </div>
    </div>
  )
}

export default function TrackerBoard({ emails }) {
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = emails.filter(e => e.category === col.id)
    return acc
  }, {})

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginTop: 16 }}>
      {COLUMNS.map(col => (
        <div key={col.id}>
          {/* Column header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
            padding: '8px 12px', borderRadius: 10,
            background: col.bg, border: `1px solid ${col.border}`,
          }}>
            <span style={{ fontSize: 14 }}>{col.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.label}</span>
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 700,
              background: col.color, color: 'white',
              borderRadius: 99, padding: '1px 7px', minWidth: 20, textAlign: 'center',
            }}>{grouped[col.id].length}</span>
          </div>

          {/* Cards */}
          <div>
            {grouped[col.id].length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '24px 0',
                fontSize: 11, color: '#64748b', fontStyle: 'italic',
              }}>No emails</div>
            ) : (
              grouped[col.id].map(email => (
                <EmailCard key={email.id} email={email} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
