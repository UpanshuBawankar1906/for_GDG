export default function FollowUpPanel({ followups }) {
  if (followups.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 15, color: '#64748b' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>👍</div>
      No overdue follow-ups — you're on top of your applications!
    </div>
  )

  return (
    <div style={{ marginTop: 16 }}>
      {/* Info banner */}
      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
        padding: '12px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>⏰</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
            {followups.length} application{followups.length !== 1 ? 's' : ''} need{followups.length === 1 ? 's' : ''} a follow-up
          </div>
          <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
            It has been 7+ days with no reply. A polite follow-up email increases your callback rate.
          </div>
        </div>
      </div>

      {/* Follow-up cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {followups.map(email => (
          <div key={email.id} style={{
            background: 'white', borderRadius: 12,
            border: '1.5px solid #fde68a',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: '#fffbeb', border: '1px solid #fde68a',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>📤</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {email.company || 'Unknown Company'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                {email.role || email.subject}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                Applied {email.date} · From: {email.from}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#d97706',
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 99, padding: '3px 10px', marginBottom: 4,
              }}>
                {email.days_overdue === 0
                  ? '⏰ Due today'
                  : `⏰ ${email.days_overdue}d overdue`}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Follow-up due: {email.follow_up_due}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template tip */}
      <div style={{
        marginTop: 20, background: '#f8fafc', borderRadius: 12,
        border: '1px solid #e2e8f0', padding: '14px 16px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
          💡 Follow-up email template
        </div>
        <pre style={{
          fontSize: 12, color: '#475569', lineHeight: 1.7,
          whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0,
        }}>{`Subject: Following up — [Role] Application

Hi [Recruiter Name],

I hope this message finds you well. I applied for the [Role] position on [Date] and wanted to follow up to express my continued interest.

I would love the opportunity to discuss how my background aligns with the role. Please let me know if there are any updates or if you need any additional information from my end.

Thank you for your time!`}</pre>
      </div>
    </div>
  )
}
