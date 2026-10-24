const EXAMPLE_PROMPTS = [
  { icon: '🏆', text: 'Read inventory.csv. Find the best selling product by total quantity sold and log the result.' },
  { icon: '📅', text: 'Read yearly_sales.csv. Show total revenue trend from 2015 to 2026 and identify the best year.' },
  { icon: '🔮', text: 'Read sales_forecast.csv. Show predicted revenue for all months in 2027 with confidence ranges.' },
  { icon: '👤', text: 'Read customer_sales.csv. Show all sales for Priya Patel in 2022 and log the total spent.' },
  { icon: '📦', text: 'Read inventory.csv. Find products with stock below 20 units. Send WhatsApp alert to the recipient.' },
  { icon: '📉', text: 'Read sales.csv. If revenue dropped more than 10% vs yesterday, send an alert email and WhatsApp to the recipient.' },
]

export default function ChatHistory({ sessions, activeSessionId, onNewChat, onLoadSession }) {
  return (
    <div className="w-full h-full border-r border-[#e8eaed] bg-[#f8f9ff] flex flex-col overflow-hidden">

      {/* New chat button */}
      <div className="p-3 border-b border-[#e8eaed] shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#e8eaed]
                     bg-white hover:bg-[#f8f9ff] hover:border-[#4285f4] transition-all text-[13px]
                     font-medium text-[#1f1f1f]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#4285f4" strokeWidth="1.5"/>
            <path d="M12 8v8M8 12h8" stroke="#4285f4" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New workflow
        </button>
      </div>

      {/* Quick start prompts */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <p className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider mb-2">Quick start</p>
        <div className="flex flex-col gap-1">
          {EXAMPLE_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => window.dispatchEvent(new CustomEvent('ff:inject-prompt', { detail: p.text }))}
              className="flex items-start gap-2 text-left px-2.5 py-2 rounded-lg border border-transparent
                         hover:bg-white hover:border-[#e8eaed] transition-all group"
            >
              <span className="text-sm shrink-0 mt-0.5">{p.icon}</span>
              <span className="text-[11px] text-[#5f6368] group-hover:text-[#1a73e8] leading-relaxed line-clamp-2">
                {p.text.slice(0, 55)}…
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Session history — scrollable, fills remaining space */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 pt-3">
        {sessions.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider mb-2">History</p>
            <div className="flex flex-col gap-1">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => onLoadSession(s)}
                  className={`flex flex-col text-left px-2.5 py-2 rounded-lg border transition-all
                    ${activeSessionId === s.id
                      ? 'bg-[#e8f0fe] border-[#c5d8fd] text-[#1a73e8]'
                      : 'border-transparent hover:bg-white hover:border-[#e8eaed]'
                    }`}
                >
                  <span className="text-[12px] font-medium text-[#1f1f1f] line-clamp-1">{s.title}</span>
                  <span className="text-[10px] text-[#9aa0a6] mt-0.5">{s.timestamp}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Branding footer — always pinned to bottom */}
      <div className="p-3 border-t border-[#e8eaed] shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 grid grid-cols-2 gap-px shrink-0">
            <div className="rounded-tl-sm bg-[#4285f4]"/><div className="rounded-tr-sm bg-[#ea4335]"/>
            <div className="rounded-bl-sm bg-[#34a853]"/><div className="rounded-br-sm bg-[#fbbc04]"/>
          </div>
          <span className="text-[10px] text-[#9aa0a6]">FlowForge — Garbathon 2026</span>
        </div>
      </div>

    </div>
  )
}
