import { useState, useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Multilingual UI strings
// ─────────────────────────────────────────────────────────────────────────────

const UI = {
  en: {
    welcome:     'What would you like to know?',
    welcomeSub:  "Ask anything about your data in plain English — I'll analyse it and show you the insights.",
    placeholder: 'Ask anything… e.g. Best selling product? Show Priya\'s 2022 sales.',
    parsing:     'Analysing your request…',
    complete:    (n) => `✓ Complete — ${n} step(s) ran`,
    recipients:  'Default recipients',
  },
  hi: {
    welcome:     'आप क्या जानना चाहते हैं?',
    welcomeSub:  'हिंदी में कुछ भी पूछें — मैं डेटा विश्लेषण करूँगा और तुरंत जवाब दूँगा।',
    placeholder: 'कुछ भी पूछें… जैसे: सबसे ज्यादा बिकने वाला प्रोडक्ट कौन सा है?',
    parsing:     'आपका अनुरोध विश्लेषण हो रहा है…',
    complete:    (n) => `✓ पूर्ण — ${n} चरण चले`,
    recipients:  'प्राप्तकर्ता',
  },
  gu: {
    welcome:     'તમે શું જાણવા માગો છો?',
    welcomeSub:  'ગુજરાતીમાં કંઈ પણ પૂછો — હું ડેટા વિશ્લેષણ કરીશ અને તરત જ જવાબ આપીશ।',
    placeholder: 'કંઈ પણ પૂછો… જેમ કે: સૌથી વધુ વેચાતી પ્રોડક્ટ કઈ છે?',
    parsing:     'તમારી વિનંતી વિશ્લેષણ થઈ રહી છે…',
    complete:    (n) => `✓ પૂર્ણ — ${n} પગલાં ચાલ્યા`,
    recipients:  'પ્રાપ્તકર્તા',
  },
}

function t(lang, key, ...args) {
  const strings = UI[lang] || UI['en']
  const val = strings[key] ?? UI['en'][key]
  return typeof val === 'function' ? val(...args) : val
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'number') {
    const isYearLike = Number.isInteger(val) && val >= 1900 && val <= 2100
    const isSmall    = Number.isInteger(val) && val < 1000
    if (isYearLike || isSmall) return String(val)
    return Number.isInteger(val) ? val.toLocaleString('en-IN') : val.toFixed(2)
  }
  return String(val)
}

// Extract the most interesting result from the log array
function extractInsight(logs) {
  if (!logs || logs.length === 0) return null
  // Prefer analyze_data results (richest), then file read preview
  const done = logs.filter(l => l.phase === 'step_done' && l.result)
  if (done.length === 0) return null

  // Pick the step with the richest result
  const ranked = [...done].sort((a, b) => {
    const score = r => Array.isArray(r) ? r.length * 10 : typeof r === 'object' ? Object.keys(r).length : 0
    return score(b.result) - score(a.result)
  })
  return ranked[0]
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline — inline SVG bar chart for numeric series
// ─────────────────────────────────────────────────────────────────────────────

function Sparkline({ data, valueKey, labelKey, color = '#1a73e8', height = 48 }) {
  if (!data || data.length < 2) return null
  const values = data.map(r => Number(r[valueKey]) || 0)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const range = maxV - minV || 1
  const W = 320
  const barW = Math.floor(W / values.length) - 2
  const bars = values.map((v, i) => {
    const h = Math.max(3, Math.round(((v - minV) / range) * (height - 8)))
    const x = i * (barW + 2)
    const y = height - h
    return { x, y, h }
  })
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={barW} height={b.h}
          fill={i === values.indexOf(Math.max(...values)) ? '#34a853' : color}
          rx="2" opacity="0.85"
        >
          <title>{labelKey ? data[i][labelKey] : i}: {values[i].toLocaleString('en-IN')}</title>
        </rect>
      ))}
      {/* baseline */}
      <line x1="0" y1={height} x2={W} y2={height} stroke="#e8eaed" strokeWidth="1"/>
    </svg>
  )
}

// Detect if an array result has a useful sparkline-able numeric series
function detectSparkline(rows) {
  if (!Array.isArray(rows) || rows.length < 3) return null
  const cols = Object.keys(rows[0])
  // Prefer total_revenue, predicted_revenue, revenue in that order
  const valueKey = ['total_revenue','predicted_revenue','revenue','quantity_sold','total_spent']
    .find(k => cols.includes(k))
  if (!valueKey) return null
  const labelKey = ['year','month_label','month','customer_name','product']
    .find(k => cols.includes(k))
  return { valueKey, labelKey }
}

// ─────────────────────────────────────────────────────────────────────────────
// InsightCard — rich summary rendered from step results
// ─────────────────────────────────────────────────────────────────────────────

function InsightCard({ logs }) {
  const [copied, setCopied] = useState(false)
  const best = extractInsight(logs)
  if (!best) return null

  const result = best.result

  const handleCopy = () => {
    const text = Array.isArray(result)
      ? result.map(r => Object.values(r).join('\t')).join('\n')
      : JSON.stringify(result, null, 2)
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Array of objects → mini table + optional sparkline
  if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'object') {
    const cols = Object.keys(result[0]).slice(0, 5)
    const rows = result.slice(0, 8)
    const hasMore = result.length > 8
    const spark = detectSparkline(result)

    return (
      <div style={{
        background: 'white', border: '1.5px solid #e8eaed', borderRadius: '16px',
        overflow: 'hidden', marginTop: '2px',
      }}>
        {/* Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f3f4',
          display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📊</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1f1f1f' }}>{best.step_name}</div>
            <div style={{ fontSize: '11px', color: '#5f6368', marginTop: '1px' }}>{best.message}</div>
          </div>
          <span style={{
            fontSize: '10px', fontWeight: 600,
            color: '#1a73e8', background: '#e8f0fe', border: '1px solid #c5d8fd',
            borderRadius: '99px', padding: '2px 8px', whiteSpace: 'nowrap',
          }}>{result.length} rows</span>
          <button onClick={handleCopy} title="Copy as TSV" style={{
            fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
            border: '1px solid #e8eaed', background: copied ? '#e6f4ea' : '#f8f9ff',
            color: copied ? '#137333' : '#5f6368', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{copied ? '✓ Copied' : '📋 Copy'}</button>
        </div>
        {/* Sparkline */}
        {spark && (
          <div style={{ padding: '10px 16px 4px', borderBottom: '1px solid #f1f3f4' }}>
            <Sparkline data={result} valueKey={spark.valueKey} labelKey={spark.labelKey} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9aa0a6', marginTop: '3px' }}>
              <span>{result[0]?.[spark.labelKey] ?? ''}</span>
              <span style={{ color: '#34a853', fontWeight: 700 }}>
                ↑ Peak: {result.reduce((m, r) => (r[spark.valueKey] > m[spark.valueKey] ? r : m), result[0])?.[spark.labelKey] ?? ''}
              </span>
              <span>{result[result.length - 1]?.[spark.labelKey] ?? ''}</span>
            </div>
          </div>
        )}
        {/* Table */}
        <div style={{ overflowX: 'auto', padding: '0 4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#f8f9ff' }}>
                {cols.map(c => (
                  <th key={c} style={{
                    textAlign: 'left', padding: '7px 12px', fontWeight: 700,
                    color: '#5f6368', borderBottom: '1px solid #e8eaed',
                    whiteSpace: 'nowrap', textTransform: 'uppercase',
                    fontSize: '9px', letterSpacing: '0.5px',
                  }}>{c.replace(/_/g,' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafbff' }}>
                  {cols.map(c => (
                    <td key={c} style={{
                      padding: '7px 12px', color: '#1f1f1f',
                      borderBottom: '1px solid #f1f3f4',
                    }}>
                      {typeof row[c] === 'number'
                        ? <strong style={{ color: '#1a73e8' }}>{fmt(row[c])}</strong>
                        : fmt(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div style={{ padding: '6px 16px 10px', fontSize: '11px', color: '#9aa0a6' }}>
            + {result.length - 8} more rows
          </div>
        )}
      </div>
    )
  }

  // Flat object → metric cards
  const isFlat = !Array.isArray(result) &&
    Object.values(result).every(v => typeof v !== 'object' || v === null)
  if (isFlat) {
    const entries = Object.entries(result).filter(([,v]) => v !== null && v !== undefined && v !== true)
    if (entries.length === 0) return null
    return (
      <div style={{
        background: 'white', border: '1.5px solid #e8eaed', borderRadius: '16px',
        overflow: 'hidden', marginTop: '2px',
      }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f3f4',
          display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>💡</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1f1f1f' }}>{best.step_name}</div>
            <div style={{ fontSize: '11px', color: '#5f6368', marginTop: '1px' }}>{best.message}</div>
          </div>
          <button onClick={handleCopy} title="Copy result" style={{
            fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px',
            border: '1px solid #e8eaed', background: copied ? '#e6f4ea' : '#f8f9ff',
            color: copied ? '#137333' : '#5f6368', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{copied ? '✓ Copied' : '📋 Copy'}</button>
        </div>
        <div style={{ padding: '12px 16px', display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(entries.length, 3)}, 1fr)`, gap: '8px' }}>
          {entries.map(([k, v]) => (
            <div key={k} style={{
              background: '#f8f9ff', border: '1px solid #e8eaed',
              borderRadius: '12px', padding: '10px 12px',
            }}>
              <div style={{ fontSize: '9px', color: '#9aa0a6', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {k.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f1f1f' }}>
                {typeof v === 'number' ? <span style={{ color: '#1a73e8' }}>₹{fmt(v)}</span> : fmt(v)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Nested object (low_stock_items, counts etc.)
  if (result.low_stock_items && Array.isArray(result.low_stock_items)) {
    const items = result.low_stock_items.slice(0, 8)
    return (
      <div style={{
        background: 'white', border: '1.5px solid #fde68a', borderRadius: '16px',
        overflow: 'hidden', marginTop: '2px',
      }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #fef9e0',
          display: 'flex', alignItems: 'center', gap: '8px', background: '#fffbeb' }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e' }}>Low Stock Alert</div>
            <div style={{ fontSize: '11px', color: '#78350f', marginTop: '1px' }}>{best.message}</div>
          </div>
        </div>
        <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {items.map((item, i) => (
            <div key={i} style={{
              background: '#fef9e0', border: '1px solid #fde68a',
              borderRadius: '8px', padding: '6px 10px', fontSize: '11px',
            }}>
              <strong style={{ color: '#92400e' }}>{item.product}</strong>
              <span style={{ color: '#b45309', marginLeft: '6px' }}>{item.stock} left</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // file preview
  if (result.preview && Array.isArray(result.preview)) {
    const cols = Object.keys(result.preview[0] || {}).slice(0, 5)
    return (
      <div style={{
        background: 'white', border: '1.5px solid #e8eaed', borderRadius: '16px',
        overflow: 'hidden', marginTop: '2px',
      }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f3f4',
          display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📂</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1f1f1f' }}>{result.file}</div>
            <div style={{ fontSize: '11px', color: '#5f6368' }}>
              {fmt(result.rows)} rows · {result.columns?.length} columns
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto', padding: '0 4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#f8f9ff' }}>
                {cols.map(c => (
                  <th key={c} style={{
                    textAlign: 'left', padding: '6px 12px', fontWeight: 700,
                    color: '#5f6368', borderBottom: '1px solid #e8eaed',
                    fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.4px',
                  }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.preview.map((row, i) => (
                <tr key={i}>
                  {cols.map(c => (
                    <td key={c} style={{ padding: '6px 12px', color: '#1f1f1f', borderBottom: '1px solid #f1f3f4', fontSize: '11px' }}>
                      {fmt(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble components
// ─────────────────────────────────────────────────────────────────────────────

function UserBubble({ text }) {
  return (
    <div className="flex justify-end px-4 mb-3">
      <div style={{
        maxWidth: '72%', background: '#4285f4', color: 'white',
        borderRadius: '18px', borderTopRightRadius: '4px',
        padding: '10px 16px', fontSize: '14px', lineHeight: 1.6,
        boxShadow: '0 1px 4px rgba(66,133,244,0.25)',
      }}>
        {text}
      </div>
    </div>
  )
}

// Bot card — intro text + insight card (no per-message share)
function BotCard({ steps, logs, model, text, userQuery, isDone, lang }) {
  return (
    <div style={{ padding: '0 16px', marginBottom: '12px' }}>

      {/* Avatar + intro text */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#4285f4,#7c4dff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
          boxShadow: '0 1px 4px rgba(66,133,244,0.3)', marginTop: '1px',
        }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'inline-block',
            background: 'white', border: '1.5px solid #e8eaed',
            borderRadius: '18px', borderTopLeftRadius: '4px',
            padding: '10px 14px', fontSize: '14px', color: '#1f1f1f',
            lineHeight: 1.6, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            marginBottom: '4px',
          }}>
            {text}
          </div>
          {steps && steps.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingLeft: '2px' }}>
              {model && (
                <span style={{ fontSize: '10px', color: '#9aa0a6' }}>via {model}</span>
              )}
              <span style={{
                fontSize: '10px', fontWeight: 600, color: '#1a73e8',
                background: '#e8f0fe', border: '1px solid #c5d8fd',
                borderRadius: '99px', padding: '2px 8px',
              }}>{steps.length} steps</span>
            </div>
          )}
        </div>
      </div>

      {/* Insight card */}
      {isDone && logs.length > 0 && <InsightCard logs={logs} />}
    </div>
  )
}

function StatusPill({ text, done, error, warn }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 16px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '11px', fontWeight: 600,
        padding: '5px 14px', borderRadius: '99px',
        ...(done  ? { background: '#e6f4ea', color: '#137333', border: '1px solid #ceead6' } :
            error ? { background: '#fce8e6', color: '#c5221f', border: '1px solid #f5c6c4' } :
            warn  ? { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' } :
                    { background: '#e8f0fe', color: '#1a73e8', border: '1px solid #c5d8fd' }),
      }}>
        {!done && !error && !warn && (
          <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
              strokeDasharray="31.4" strokeDashoffset="10"/>
          </svg>
        )}
        {text}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ChatArea
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatArea({
  messages, setMessages,
  logs, setLogs,
  phase, setPhase,
  modelUsed, setModelUsed,
  recipients, setRecipients,
}) {
  const [input, setInput]         = useState('')
  const [showRecipients, setShowRecipients] = useState(false)
  const [lang, setLang]           = useState('en')   // detected language
  const bottomRef    = useRef(null)
  const textareaRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handler = (e) => setInput(e.detail)
    window.addEventListener('ff:inject-prompt', handler)
    return () => window.removeEventListener('ff:inject-prompt', handler)
  }, [])

  const isRunning = phase === 'parsing' || phase === 'running'

  const handleSend = async () => {
    if (!input.trim() || isRunning) return
    const userText = input.trim()
    setInput('')

    setMessages(prev => [...prev, { type: 'user', text: userText, id: Date.now() }])
    setLogs([])
    setModelUsed(null)
    setPhase('parsing')

    const statusId = Date.now() + 1
    setMessages(prev => [...prev, { type: 'status', text: 'Parsing workflow with AI…', id: statusId }])

    try {
      const response = await fetch('/api/parse-and-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: userText, recipients }),
      })
      if (!response.ok) throw new Error(`Server error: ${response.status}`)

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentSteps = []
      let currentModel = null
      let botMsgId = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const event = JSON.parse(raw)

            if (event.phase === 'parsing') {
              setPhase('parsing')

            } else if (event.phase === 'parsed') {
              currentSteps = event.steps
              currentModel = event.model_used
              const detectedLang = event.lang || 'en'
              setModelUsed(currentModel)
              setLang(detectedLang)
              setPhase('running')

              // Use translated intro from backend, fallback to English
              const introText = event.intro || t(detectedLang, 'complete', currentSteps.length)

              setMessages(prev => prev
                .filter(m => m.id !== statusId)
                .concat([{
                  type: 'bot',
                  steps: currentSteps,
                  logs: [],
                  model: currentModel,
                  text: introText,
                  userQuery: userText,
                  lang: detectedLang,
                  isDone: false,
                  id: botMsgId = Date.now() + 2,
                }])
              )

            } else if (event.phase === 'workflow_done') {
              setPhase('done')
              setLogs(prev => [...prev, event])
              setMessages(prev => prev.map(m =>
                m.id === botMsgId
                  ? { ...m, isDone: true, logs: [...(m.logs || []), event] }
                  : m
              ).concat([{
                type: 'status',
                text: t(lang, 'complete', event.completed),
                done: true,
                id: Date.now() + 3,
              }]))

            } else if (event.phase === 'error') {
              setPhase('error')
              setLogs(prev => [...prev, event])
              const rawMsg = event.message || ''
              const isRateLimit = rawMsg.includes('rate-limit') || rawMsg.includes('⏱') || rawMsg.includes('rate limit')
              const friendlyMsg = isRateLimit
                ? '⏱ Gemini is temporarily rate-limited — wait ~30s and try again'
                : `Error: ${rawMsg.slice(0, 100)}`
              setMessages(prev => prev
                .filter(m => m.id !== statusId)
                .concat([{
                  type: 'status',
                  text: friendlyMsg,
                  error: !isRateLimit,
                  warn: isRateLimit,
                  id: Date.now() + 4,
                }])
              )
            } else {
              // step updates
              setLogs(prev => [...prev, event])
              if (botMsgId) {
                setMessages(prev => prev.map(m =>
                  m.id === botMsgId ? { ...m, logs: [...(m.logs || []), event] } : m
                ))
              }
            }
          } catch { /* ignore malformed SSE */ }
        }
      }
    } catch (err) {
      setPhase('error')
      const isRateLimit = err.message?.includes('rate') || err.message?.includes('429')
      setMessages(prev => prev
        .filter(m => m.id !== statusId)
        .concat([{
          type: 'status',
          text: isRateLimit ? '⏱ Rate limited — please wait ~30 seconds and try again' : `Error: ${err.message}`,
          error: !isRateLimit,
          warn: isRateLimit,
          id: Date.now() + 5,
        }])
      )
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col bg-[#f8f9ff]" style={{ height: '100%' }}>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🤖</div>
              <h2 className="text-[24px] font-bold text-[#1f1f1f] mb-2" style={{ letterSpacing: '-0.3px' }}>
                {t(lang, 'welcome')}
              </h2>
              <p className="text-[15px] text-[#5f6368] max-w-md">
                {t(lang, 'welcomeSub')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-xl w-full">
              {[
                { icon:'🏆', label:'Best-selling product',        text:'Read inventory.csv. Find the best selling product by total quantity sold and log the result.' },
                { icon:'📅', label:'12-year revenue trend',       text:'Read yearly_sales.csv. Show total revenue trend from 2015 to 2026 and identify the best year.' },
                { icon:'👤', label:"Customer purchase history",   text:'Read customer_sales.csv. Show all sales for Priya Patel in 2022 and log the total spent.' },
                { icon:'📦', label:'Low-stock alert',             text:'Read inventory.csv. Find products with stock below 20 units and log the result.' },
                { icon:'🔮', label:'2027 sales forecast',         text:'Read sales_forecast.csv. Show predicted revenue for all months in 2027 with confidence ranges.' },
                { icon:'📉', label:'Revenue drop check',          text:'Read sales.csv. Check if revenue dropped more than 10% vs yesterday and log the result.' },
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s.text)}
                  className="flex items-start gap-2.5 text-left p-3.5 rounded-2xl bg-white border border-[#e8eaed]
                             hover:border-[#4285f4] hover:shadow-sm transition-all group"
                >
                  <span className="text-xl shrink-0">{s.icon}</span>
                  <div>
                    <div className="text-[12px] font-semibold text-[#1f1f1f] group-hover:text-[#1a73e8]">{s.label}</div>
                    <div className="text-[11px] text-[#9aa0a6] mt-0.5 line-clamp-2">{s.text.slice(0, 65)}…</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => {
              if (msg.type === 'user')
                return <UserBubble key={msg.id} text={msg.text} />
              if (msg.type === 'status')
                return <StatusPill key={msg.id} text={msg.text} done={msg.done} error={msg.error} warn={msg.warn} />
              if (msg.type === 'bot')
                return (
                  <BotCard
                    key={msg.id}
                    steps={msg.steps}
                    logs={msg.logs}
                    model={msg.model}
                    text={msg.text}
                    userQuery={msg.userQuery}
                    isDone={msg.isDone}
                    lang={msg.lang || 'en'}
                  />
                )
              return null
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-[#e8eaed] px-4 py-3">

        {/* Recipients toggle */}
        <div className="mb-2">
          <button
            onClick={() => setShowRecipients(r => !r)}
            className="flex items-center gap-1.5 text-[11px] text-[#5f6368] hover:text-[#1a73e8] transition-colors"
          >
            <div className="w-3 h-3 grid grid-cols-2 gap-px shrink-0">
              <div className="rounded-tl-sm bg-[#4285f4]"/><div className="rounded-tr-sm bg-[#ea4335]"/>
              <div className="rounded-bl-sm bg-[#34a853]"/><div className="rounded-br-sm bg-[#fbbc04]"/>
            </div>
            {t(lang, 'recipients')}
            {(recipients.email || recipients.whatsapp) && (
              <span className="text-[#34a853] font-medium ml-1">
                {[recipients.email, recipients.whatsapp].filter(Boolean).join(' · ')}
              </span>
            )}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              className={`transition-transform ${showRecipients ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {showRecipients && (
            <div className="mt-2 flex gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-1 min-w-[180px] border border-[#e8eaed] rounded-xl px-3 py-1.5
                              bg-[#f8f9ff] focus-within:border-[#4285f4] focus-within:bg-white transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="#9aa0a6" strokeWidth="1.5"/>
                  <path d="M2 8l10 6 10-6" stroke="#9aa0a6" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input type="email" placeholder="Default email"
                  className="flex-1 bg-transparent text-[12px] text-[#1f1f1f] placeholder-[#9aa0a6] focus:outline-none"
                  value={recipients.email}
                  onChange={e => setRecipients(r => ({ ...r, email: e.target.value }))}
                  disabled={isRunning}
                />
              </div>
              <div className="flex items-center gap-1.5 flex-1 min-w-[160px] border border-[#e8eaed] rounded-xl px-3 py-1.5
                              bg-[#f8f9ff] focus-within:border-[#34a853] focus-within:bg-white transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#34a853" strokeWidth="1.5"/>
                  <path d="M8 12.5c.5 1.5 2 2.5 4 2.5 1 0 2-.3 2.7-.8l2 .5-.5-2c.5-.7.8-1.5.8-2.5 0-2.5-2-4.2-4.5-4.2S8 8 8 10.5c0 .7.2 1.4.5 2l-.5 2z"
                    stroke="#34a853" strokeWidth="1.2"/>
                </svg>
                <input type="tel" placeholder="+91XXXXXXXXXX"
                  className="flex-1 bg-transparent text-[12px] text-[#1f1f1f] placeholder-[#9aa0a6] focus:outline-none"
                  value={recipients.whatsapp}
                  onChange={e => setRecipients(r => ({ ...r, whatsapp: e.target.value }))}
                  disabled={isRunning}
                />
              </div>
            </div>
          )}
        </div>

        {/* Textarea + send */}
        <div className="flex items-end gap-2 bg-[#f8f9ff] border border-[#e8eaed] rounded-2xl px-4 py-3
                        focus-within:border-[#4285f4] focus-within:bg-white transition-all"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <textarea
            ref={textareaRef}
            rows={2}
            className="flex-1 bg-transparent text-[14px] text-[#1f1f1f] placeholder-[#9aa0a6]
                       resize-none focus:outline-none leading-relaxed"
            placeholder={t(lang, 'placeholder')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isRunning}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all
                       disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !isRunning
                ? 'linear-gradient(135deg,#4285f4,#7c4dff)'
                : '#e8eaed',
            }}
          >
            {isRunning ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5"
                  strokeDasharray="31.4" strokeDashoffset="10"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-[#9aa0a6] text-center mt-1.5">
          Press <kbd className="bg-[#f1f3f4] px-1 rounded text-[#5f6368]">Enter</kbd> to send
          · <kbd className="bg-[#f1f3f4] px-1 rounded text-[#5f6368]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  )
}
