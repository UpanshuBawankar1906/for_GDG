export default function JobPilotBot({ message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
      {/* Speech bubble */}
      <div style={{
        position: 'relative', maxWidth: 420, padding: '12px 18px',
        background: 'white', border: '1px solid #bfdbfe', borderRadius: 16,
        boxShadow: '0 2px 8px rgba(59,130,246,0.12)',
        fontSize: 14, fontWeight: 600, color: '#1e293b', lineHeight: 1.5, textAlign: 'center',
      }}>
        {message}
        <div style={{
          position: 'absolute', left: '50%', bottom: -8, width: 14, height: 14,
          background: 'white', borderRight: '1px solid #bfdbfe', borderBottom: '1px solid #bfdbfe',
          transform: 'translateX(-50%) rotate(45deg)',
        }}/>
      </div>

      {/* Robot */}
      <svg width="140" height="150" viewBox="0 0 140 150" style={{ marginTop: 12, animation: 'jp-float 3s ease-in-out infinite' }}>
        <defs>
          <linearGradient id="jp-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b82f6"/>
            <stop offset="1" stopColor="#6366f1"/>
          </linearGradient>
        </defs>
        {/* antenna */}
        <line x1="70" y1="10" x2="70" y2="26" stroke="#6366f1" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="70" cy="8" r="6" fill="#f59e0b"/>
        {/* ears */}
        <rect x="14" y="52" width="10" height="26" rx="5" fill="#6366f1"/>
        <rect x="116" y="52" width="10" height="26" rx="5" fill="#6366f1"/>
        {/* head */}
        <rect x="22" y="26" width="96" height="70" rx="22" fill="url(#jp-body)"/>
        <rect x="32" y="38" width="76" height="46" rx="14" fill="#0f172a"/>
        {/* eyes */}
        <circle cx="54" cy="58" r="8" fill="#67e8f9"/>
        <circle cx="86" cy="58" r="8" fill="#67e8f9"/>
        <circle cx="56" cy="56" r="2.5" fill="white"/>
        <circle cx="88" cy="56" r="2.5" fill="white"/>
        {/* smile */}
        <path d="M58 72 Q70 82 82 72" stroke="#67e8f9" strokeWidth="3" fill="none" strokeLinecap="round"/>
        {/* body */}
        <rect x="42" y="102" width="56" height="38" rx="14" fill="url(#jp-body)"/>
        <rect x="58" y="112" width="24" height="8" rx="4" fill="white" opacity="0.85"/>
        {/* arms */}
        <rect x="26" y="106" width="14" height="28" rx="7" fill="#6366f1"/>
        <rect x="100" y="106" width="14" height="28" rx="7" fill="#6366f1"/>
      </svg>

      <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
        Job<span style={{ color: '#3b82f6' }}>Pilot</span>
      </div>

      <style>{`
        @keyframes jp-float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
