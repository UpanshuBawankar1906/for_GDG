import { useEffect, useRef } from 'react'

// Format numbers: years and small counts stay plain; large numbers get locale commas
function fmtNum(v) {
  if (!Number.isFinite(v)) return String(v)
  if (Number.isInteger(v)) {
    if (v >= 1900 && v <= 2100) return String(v)   // year
    if (v < 1000) return String(v)                   // small count / ID
    return v.toLocaleString('en-IN')
  }
  return v.toFixed(2)
}

const PHASE_CONFIG = {
  step_start:    { color: '#fbbc04', bg: '#fef9e0', border: '#fde68a', symbol: '●', label: 'Running'  },
  step_done:     { color: '#34a853', bg: '#e6f4ea', border: '#ceead6', symbol: '✓', label: 'Done'     },
  step_error:    { color: '#ea4335', bg: '#fce8e6', border: '#f5c6c4', symbol: '✕', label: 'Error'    },
  skipped:       { color: '#9aa0a6', bg: '#f8f9ff', border: '#e8eaed', symbol: '—', label: 'Skipped'  },
  workflow_done: { color: '#4285f4', bg: '#e8f0fe', border: '#c5d8fd', symbol: '🎉', label: 'Complete' },
  error:         { color: '#ea4335', bg: '#fce8e6', border: '#f5c6c4', symbol: '✕', label: 'Error'    },
  parsing:       { color: '#4285f4', bg: '#e8f0fe', border: '#c5d8fd', symbol: '◌', label: 'Parsing'  },
}

// ── Smart result renderer ─────────────────────────────────────────────────────
function ResultView({ result }) {
  if (!result || typeof result !== 'object') return null

  // Array of objects → render as a mini table (max 6 rows)
  if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object') {
    const cols = Object.keys(result[0]).slice(0, 5) // max 5 columns
    const rows = result.slice(0, 6)
    const hasMore = result.length > 6

    return (
      <div className="px-3 pb-3 overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr>
              {cols.map(col => (
                <th key={col} style={{
                  textAlign: 'left', padding: '4px 6px', fontWeight: 700,
                  color: '#5f6368', borderBottom: '1px solid #e8eaed',
                  whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.4px',
                }}>
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                {cols.map(col => (
                  <td key={col} style={{ padding: '4px 6px', color: '#1f1f1f', borderBottom: '1px solid #f1f3f4' }}>
                    {typeof row[col] === 'number'
                      ? fmtNum(row[col])
                      : String(row[col] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {hasMore && (
          <div style={{ fontSize: '10px', color: '#9aa0a6', marginTop: '4px', paddingLeft: '6px' }}>
            + {result.length - 6} more rows
          </div>
        )}
      </div>
    )
  }

  // Flat object with simple values → key-value grid
  const isFlat = !Array.isArray(result) && Object.values(result).every(v => typeof v !== 'object' || v === null)
  if (isFlat) {
    const entries = Object.entries(result).slice(0, 8)
    return (
      <div className="px-3 pb-3 grid grid-cols-2 gap-1">
        {entries.map(([k, v]) => (
          <div key={k} style={{
            background: 'rgba(255,255,255,0.6)', border: '1px solid #e8eaed',
            borderRadius: '8px', padding: '5px 8px',
          }}>
            <div style={{ fontSize: '9px', color: '#9aa0a6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {k.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: '11px', color: '#1f1f1f', fontWeight: 600, marginTop: '1px', wordBreak: 'break-word' }}>
              {typeof v === 'number' ? fmtNum(v) : String(v ?? '—')}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Object with nested values (low_stock_items, counts etc.) → compact JSON
  return (
    <div className="px-3 pb-3">
      <pre style={{
        fontSize: '10px', lineHeight: 1.5, overflowX: 'auto', color: '#5f6368',
        fontFamily: "'Fira Code', 'Google Sans Mono', monospace",
        background: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '6px 8px',
        border: '1px solid #e8eaed',
      }}>
        {JSON.stringify(result, null, 2).slice(0, 600)}
        {JSON.stringify(result, null, 2).length > 600 ? '\n…' : ''}
      </pre>
    </div>
  )
}

// ── Single log entry ──────────────────────────────────────────────────────────
function LogEntry({ entry }) {
  const cfg = PHASE_CONFIG[entry.phase] || PHASE_CONFIG['step_done']
  const isRunning = entry.phase === 'step_start' || entry.phase === 'parsing'

  return (
    <div
      className="log-entry mx-4 mb-2 rounded-xl border overflow-hidden"
      style={{ borderColor: cfg.border, background: cfg.bg }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: entry.result ? `1px solid ${cfg.border}` : 'none' }}>
        {/* Symbol / spinner */}
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isRunning ? 'animate-pulse' : ''}`}
          style={{ background: cfg.color, color: 'white' }}
        >
          {isRunning ? '…' : cfg.symbol}
        </div>

        <div className="flex-1 min-w-0">
          {entry.step_name && (
            <div className="text-[12px] font-semibold truncate" style={{ color: '#1f1f1f' }}>
              {entry.step_name}
            </div>
          )}
          <div className="text-[11px] leading-relaxed" style={{ color: '#5f6368' }}>
            {entry.message}
          </div>
        </div>

        {/* Phase badge */}
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
          style={{ color: cfg.color, background: 'white', border: `1px solid ${cfg.border}` }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Smart result rendering */}
      {entry.result !== undefined && entry.result !== null && (
        <ResultView result={entry.result} />
      )}
    </div>
  )
}

// ── ExecutionLog panel ────────────────────────────────────────────────────────
export default function ExecutionLog({ logs, phase }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 bg-white">
        <style>{`
          @keyframes ff-dot-pulse {
            0%,80%,100% { opacity: 0.2; transform: scale(0.8); }
            40%          { opacity: 1;   transform: scale(1.2); }
          }
        `}</style>
        <div className="text-center">
          {/* Google-style 4-dot animated idle state */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {['#4285f4','#ea4335','#fbbc04','#34a853'].map((color, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: color,
                  animation: `ff-dot-pulse 1.4s ease-in-out ${i * 0.16}s infinite`,
                }}
              />
            ))}
          </div>
          <p className="text-[13px] font-medium text-[#5f6368]">Execution log will appear here</p>
          <p className="text-[11px] text-[#9aa0a6] mt-1">Steps update in real time as they run</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pt-3 pb-2 bg-white">
      {logs.map((entry, i) => (
        <LogEntry key={i} entry={entry} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
