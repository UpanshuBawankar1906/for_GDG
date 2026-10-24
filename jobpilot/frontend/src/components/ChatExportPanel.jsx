import { useState } from 'react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtVal(val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'number') {
    const isYear  = Number.isInteger(val) && val >= 1900 && val <= 2100
    const isSmall = Number.isInteger(val) && val < 1000
    if (isYear || isSmall) return String(val)
    return Number.isInteger(val) ? val.toLocaleString('en-IN') : val.toFixed(2)
  }
  return String(val)
}

// Build a table HTML string from an array of objects
function tableHTML(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return ''
  const cols = Object.keys(rows[0]).slice(0, 6)
  const display = rows.slice(0, 14)
  const ths = cols.map(c =>
    `<th style="text-align:left;padding:6px 10px;font-size:10px;font-weight:700;
     text-transform:uppercase;letter-spacing:0.5px;color:#5f6368;
     border-bottom:2px solid #e8eaed;white-space:nowrap">
     ${c.replace(/_/g, ' ')}</th>`
  ).join('')
  const trs = display.map((row, i) => {
    const tds = cols.map(c => {
      const v   = row[c]
      const txt = fmtVal(v)
      const num = typeof v === 'number'
      return `<td style="padding:6px 10px;font-size:11px;border-bottom:1px solid #f1f3f4;
              color:${num ? '#1a73e8' : '#1f1f1f'};
              font-weight:${num ? '700' : '400'}">${txt}</td>`
    }).join('')
    return `<tr style="background:${i % 2 === 0 ? 'white' : '#f8f9ff'}">${tds}</tr>`
  }).join('')
  const more = rows.length > 14
    ? `<tr><td colspan="${cols.length}" style="padding:5px 10px;font-size:10px;color:#9aa0a6">
       + ${rows.length - 14} more rows</td></tr>` : ''
  return `<table style="width:100%;border-collapse:collapse;margin-top:10px">
    <thead><tr style="background:#f8f9ff">${ths}</tr></thead>
    <tbody>${trs}${more}</tbody>
  </table>`
}

// Find the richest result in a message's logs
function richResult(logs) {
  const done = (logs || []).filter(l => l.phase === 'step_done' && l.result)
  if (!done.length) return null
  return done.sort((a, b) => {
    const score = r => Array.isArray(r) ? r.length * 10 : (r && typeof r === 'object') ? Object.keys(r).length : 0
    return score(b.result) - score(a.result)
  })[0]
}

// Build the full HTML document for the PDF popup window
function buildPDFHTML(messages) {
  const userMsgs = messages.filter(m => m.type === 'user')
  const botMsgs  = messages.filter(m => m.type === 'bot' && m.isDone)

  let qNum = 0
  const sections = messages.map(msg => {
    if (msg.type === 'user') {
      qNum++
      return `
        <div style="display:flex;align-items:flex-start;gap:10px;margin:20px 0 8px">
          <div style="min-width:26px;height:26px;border-radius:50%;
                      background:linear-gradient(135deg,#4285f4,#7c4dff);
                      display:flex;align-items:center;justify-content:center;
                      color:white;font-size:12px;font-weight:700;flex-shrink:0">
            ${qNum}
          </div>
          <div style="font-size:14px;font-weight:700;color:#1f1f1f;padding-top:4px">
            ${msg.text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}
          </div>
        </div>`
    }

    if (msg.type === 'bot' && msg.isDone) {
      const doneLogs = (msg.logs || []).filter(l => l.phase === 'step_done')
      const best     = richResult(msg.logs)

      const stepLines = doneLogs.map(l => `
        <div style="display:flex;align-items:flex-start;gap:6px;padding:3px 0">
          <span style="color:#34a853;font-weight:700;font-size:12px;flex-shrink:0">✓</span>
          <div style="font-size:11px;color:#5f6368;line-height:1.5">
            <strong style="color:#1f1f1f">${l.step_name}:</strong> ${l.message}
          </div>
        </div>`).join('')

      const resultSection = best?.result
        ? (Array.isArray(best.result)
            ? tableHTML(best.result)
            : (best.result.low_stock_items
                ? tableHTML(best.result.low_stock_items)
                : `<pre style="font-size:10px;background:#f8f9ff;padding:8px;
                              border-radius:6px;border:1px solid #e8eaed;
                              white-space:pre-wrap;word-break:break-all;color:#5f6368;margin-top:8px">
                    ${JSON.stringify(best.result, null, 2).slice(0, 800)}</pre>`))
        : ''

      return `
        <div style="margin-left:36px;margin-bottom:4px;padding:12px 16px;
                    background:white;border:1px solid #e8eaed;border-radius:12px;
                    page-break-inside:avoid">
          <div style="font-size:12px;color:#5f6368;margin-bottom:8px;line-height:1.5">
            ${msg.text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}
          </div>
          ${stepLines}
          ${resultSection}
        </div>`
    }
    return ''
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>FlowForge Insight Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
      background: white;
      color: #1f1f1f;
      padding: 32px 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 16mm 14mm; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;align-items:center;gap:12px;
              border-bottom:2px solid #e8eaed;padding-bottom:16px;margin-bottom:8px">
    <div style="width:40px;height:40px;border-radius:50%;
                background:linear-gradient(135deg,#4285f4,#7c4dff);
                display:flex;align-items:center;justify-content:center;
                font-size:20px;flex-shrink:0">🤖</div>
    <div>
      <div style="font-size:20px;font-weight:700;letter-spacing:-0.4px">
        FlowForge Insight Report
      </div>
      <div style="font-size:11px;color:#9aa0a6;margin-top:3px">
        ${userMsgs.length} question${userMsgs.length !== 1 ? 's' : ''} ·
        ${botMsgs.length} insight${botMsgs.length !== 1 ? 's' : ''} ·
        Generated ${new Date().toLocaleString('en-IN')}
      </div>
    </div>
  </div>

  <!-- Conversation -->
  ${sections}

  <!-- Footer -->
  <div style="border-top:1px solid #e8eaed;margin-top:24px;padding-top:10px;
              font-size:10px;color:#9aa0a6;text-align:center">
    Generated by FlowForge AI Workflow Automator
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`
}


// ── Main component ────────────────────────────────────────────────────────────

export default function ChatExportPanel({ messages }) {
  const [open, setOpen]       = useState(false)
  const [email, setEmail]     = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus]   = useState(null)

  const botMessages  = messages.filter(m => m.type === 'bot' && m.isDone)
  const userMessages = messages.filter(m => m.type === 'user')
  if (botMessages.length === 0) return null

  // Open popup window and print
  const handlePrint = () => {
    const html    = buildPDFHTML(messages)
    const popup   = window.open('', '_blank', 'width=860,height=700,scrollbars=yes')
    if (!popup) { alert('Please allow pop-ups for this site to export as PDF.'); return }
    popup.document.open()
    popup.document.write(html)
    popup.document.close()
  }

  // Email the full HTML report via /share-pdf
  const handleEmail = async () => {
    if (!email.trim() || sending) return
    setSending(true)
    setStatus(null)
    try {
      const html = buildPDFHTML(messages)
      const res  = await fetch('/api/share-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          subject: `FlowForge Report — ${userMessages.length} insight${userMessages.length !== 1 ? 's' : ''} · ${new Date().toLocaleDateString('en-IN')}`,
          email:   email.trim(),
        }),
      })
      const data   = await res.json()
      const isDemo = data.status === 'demo'
      setStatus({
        ok:   true,
        demo: isDemo,
        msg:  data.message || 'Sent!',
      })
    } catch (err) {
      setStatus({ ok: false, msg: err.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Navbar trigger button */}
      <button
        onClick={() => { setOpen(true); setStatus(null) }}
        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e8eaed]
                   bg-white hover:bg-[#f8f9ff] hover:border-[#4285f4] transition-all text-[12px]
                   font-semibold text-[#1f1f1f] shrink-0"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2v10m0 0l-3-3m3 3l3-3" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" stroke="#4285f4" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Export Chat
        <span style={{
          fontSize: '10px', fontWeight: 700, color: '#1a73e8',
          background: '#e8f0fe', border: '1px solid #c5d8fd',
          borderRadius: '99px', padding: '1px 6px',
        }}>{botMessages.length}</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '440px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden',
          }}>

            {/* Header */}
            <div style={{
              padding: '16px 20px 14px', borderBottom: '1px solid #f1f3f4',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                background: 'linear-gradient(135deg,#4285f4,#7c4dff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>📄</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f1f1f' }}>
                  Export Full Chat Report
                </div>
                <div style={{ fontSize: '11px', color: '#9aa0a6', marginTop: '2px' }}>
                  {userMessages.length} Q &amp; {botMessages.length} insight{botMessages.length !== 1 ? 's' : ''} in this session
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                width: 28, height: 28, borderRadius: '8px', border: 'none',
                background: '#f1f3f4', cursor: 'pointer', fontSize: '14px', color: '#5f6368',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* PDF block */}
              <div style={{ border: '1.5px solid #e8eaed', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '11px 14px', background: '#f8f9ff', borderBottom: '1px solid #e8eaed' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1f1f1f' }}>📥 Save as PDF</div>
                  <div style={{ fontSize: '11px', color: '#9aa0a6', marginTop: '2px' }}>
                    Opens a formatted report — use browser print → Save as PDF
                  </div>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <button
                    onClick={handlePrint}
                    style={{
                      width: '100%', padding: '9px 0', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg,#4285f4,#7c4dff)',
                      color: 'white', fontSize: '13px', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M6 2h12v6H6zM6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="6" y="14" width="12" height="8" rx="1" stroke="white" strokeWidth="2"/>
                    </svg>
                    Open Report &amp; Print / Save PDF
                  </button>
                </div>
              </div>

              {/* Email block */}
              <div style={{ border: '1.5px solid #e8eaed', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '11px 14px', background: '#f8f9ff', borderBottom: '1px solid #e8eaed' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1f1f1f' }}>📧 Share via Email</div>
                  <div style={{ fontSize: '11px', color: '#9aa0a6', marginTop: '2px' }}>
                    Sends the full report as a formatted HTML email + attachment
                  </div>
                </div>
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {status && (
                    <div style={{
                      padding: '7px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                      background: status.demo ? '#fffbeb' : status.ok ? '#e6f4ea' : '#fce8e6',
                      border: `1px solid ${status.demo ? '#fde68a' : status.ok ? '#ceead6' : '#f5c6c4'}`,
                      color: status.demo ? '#92400e' : status.ok ? '#137333' : '#c5221f',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <span>{status.demo ? '📋' : status.ok ? '✓' : '✕'}</span>
                      <span>{status.msg}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
                      border: '1.5px solid #e8eaed', borderRadius: '10px',
                      padding: '8px 10px', background: 'white',
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="4" width="20" height="16" rx="3" stroke="#9aa0a6" strokeWidth="1.5"/>
                        <path d="M2 8l10 6 10-6" stroke="#9aa0a6" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <input
                        type="email"
                        placeholder="Recipient email address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEmail()}
                        disabled={sending}
                        style={{
                          flex: 1, background: 'none', border: 'none', outline: 'none',
                          fontSize: '12px', color: '#1f1f1f',
                        }}
                      />
                    </div>
                    <button
                      onClick={handleEmail}
                      disabled={!email.trim() || sending}
                      style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none',
                        background: email.trim() && !sending ? '#ea4335' : '#e8eaed',
                        color: 'white', fontSize: '12px', fontWeight: 700,
                        cursor: email.trim() && !sending ? 'pointer' : 'not-allowed',
                        whiteSpace: 'nowrap', transition: 'background 0.15s',
                      }}
                    >
                      {sending ? '…' : '📧 Send'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
