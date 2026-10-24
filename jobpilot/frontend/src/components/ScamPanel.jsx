export default function ScamPanel({ scams }) {
  if (scams.length === 0) return (
    <div style={{
      textAlign: 'center', padding: '48px 0',
      fontSize: 15, color: '#64748b',
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      No scam emails detected in this inbox!
    </div>
  )

  return (
    <div style={{ marginTop: 16 }}>
      {/* Warning banner */}
      <div style={{
        background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12,
        padding: '12px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>🚨</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
            {scams.length} scam email{scams.length !== 1 ? 's' : ''} detected
          </div>
          <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>
            Never pay fees, share Aadhaar/PAN, or send bank details to get a job offer. Legitimate companies never ask for this.
          </div>
        </div>
      </div>

      {/* Scam cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {scams.map((email) => (
          <div key={email.id} style={{
            background: 'white', borderRadius: 14,
            border: '1.5px solid #fca5a5',
            boxShadow: '0 0 0 3px #fee2e2',
            overflow: 'hidden',
          }}>
            {/* Red header */}
            <div style={{
              background: '#fef2f2', padding: '12px 16px',
              borderBottom: '1px solid #fecaca',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>
                  🚨 {email.subject}
                </div>
                <div style={{ fontSize: 12, color: '#ef4444' }}>
                  From: {email.from}  ·  {email.date}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, flexShrink: 0,
                background: '#dc2626', color: 'white',
              }}>SCAM</span>
            </div>

            {/* Body */}
            <div style={{ padding: '12px 16px' }}>
              {/* Summary */}
              {email.summary && (
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 10, lineHeight: 1.5 }}>
                  {email.summary}
                </div>
              )}

              {/* Red flags */}
              {email.scam_reasons?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                    Red flags identified
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {email.scam_reasons.map((r, i) => (
                      <span key={i} style={{
                        fontSize: 12, padding: '4px 10px', borderRadius: 99,
                        background: '#fef2f2', color: '#dc2626',
                        border: '1px solid #fecaca', fontWeight: 600,
                      }}>⚠ {r}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Email body preview */}
              <details style={{ marginTop: 10 }}>
                <summary style={{ fontSize: 11, color: '#94a3b8', cursor: 'pointer', userSelect: 'none' }}>
                  Show email body
                </summary>
                <div style={{
                  marginTop: 8, padding: '10px 12px',
                  background: '#fff7f7', borderRadius: 8,
                  border: '1px solid #fecaca', fontSize: 12, color: '#475569', lineHeight: 1.6,
                }}>
                  {email.body}
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
