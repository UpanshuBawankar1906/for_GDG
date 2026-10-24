const STATS = [
  { key: 'applied',   label: 'Applied',   color: '#3b82f6', bg: '#eff6ff', icon: '📤' },
  { key: 'interview', label: 'Interview', color: '#8b5cf6', bg: '#f5f3ff', icon: '🎯' },
  { key: 'offer',     label: 'Offer',     color: '#10b981', bg: '#f0fdf4', icon: '🎉' },
  { key: 'rejected',  label: 'Rejected',  color: '#64748b', bg: '#f8fafc', icon: '❌' },
  { key: 'scam',      label: 'Scams',     color: '#ef4444', bg: '#fef2f2', icon: '🚨' },
]

export default function StatsBar({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 4 }}>
      {STATS.map(s => (
        <div key={s.key} style={{
          background: s.bg, borderRadius: 12,
          border: `1px solid ${s.color}30`,
          padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {s.label}
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>
            {stats[s.key] ?? 0}
          </div>
          {stats.total > 0 && (
            <div style={{ fontSize: 10, color: '#64748b' }}>
              {Math.round(((stats[s.key] ?? 0) / stats.total) * 100)}% of {stats.total}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
