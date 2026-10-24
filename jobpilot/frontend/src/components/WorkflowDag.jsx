import { useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from 'reactflow'

const TYPE_CONFIG = {
  read_file:     { icon: '📂', color: '#4285f4', bg: '#e8f0fe', border: '#c5d8fd', label: 'Read File'     },
  analyze_data:  { icon: '📊', color: '#34a853', bg: '#e6f4ea', border: '#ceead6', label: 'Analyze'       },
  condition:     { icon: '🔀', color: '#fbbc04', bg: '#fef9e0', border: '#fde68a', label: 'Condition'     },
  send_email:    { icon: '📧', color: '#ea4335', bg: '#fce8e6', border: '#f5c6c4', label: 'Send Email'    },
  send_slack:    { icon: '💬', color: '#7c4dff', bg: '#f3e8ff', border: '#ddd6fe', label: 'Slack'         },
  send_whatsapp: { icon: '💚', color: '#34a853', bg: '#e6f4ea', border: '#ceead6', label: 'WhatsApp'      },
  log:           { icon: '📋', color: '#5f6368', bg: '#f1f3f4', border: '#e8eaed', label: 'Log'           },
  wait:          { icon: '⏳', color: '#5f6368', bg: '#f1f3f4', border: '#e8eaed', label: 'Wait'          },
}

// ── Layered layout (left→right DAG) ─────────────────────────────────────────
// Assigns each node a column (depth from root) and a row within that column.
function computeLayout(steps) {
  if (!steps || steps.length === 0) return {}

  const stepMap = {}
  steps.forEach(s => { stepMap[s.id] = s })

  // BFS to assign columns (depth levels)
  const depth = {}
  const roots = steps.filter(s => !s.depends_on || s.depends_on.length === 0)
  roots.forEach(r => { depth[r.id] = 0 })

  const queue = [...roots]
  while (queue.length) {
    const cur = queue.shift()
    const nextDepth = depth[cur.id] + 1
    for (const s of steps) {
      if ((s.depends_on || []).includes(cur.id)) {
        if (depth[s.id] === undefined || depth[s.id] < nextDepth) {
          depth[s.id] = nextDepth
          queue.push(s)
        }
      }
    }
  }

  // Group steps by depth column
  const columns = {}
  steps.forEach(s => {
    const col = depth[s.id] ?? 0
    if (!columns[col]) columns[col] = []
    columns[col].push(s.id)
  })

  const NODE_W = 220
  const NODE_H = 94
  const COL_GAP = 60
  const ROW_GAP = 16

  const positions = {}
  Object.entries(columns).forEach(([col, ids]) => {
    const totalH = ids.length * NODE_H + (ids.length - 1) * ROW_GAP
    ids.forEach((id, rowIdx) => {
      positions[id] = {
        x: parseInt(col) * (NODE_W + COL_GAP),
        y: rowIdx * (NODE_H + ROW_GAP) - totalH / 2 + 200,
      }
    })
  })

  return positions
}

function buildNodesAndEdges(steps, logs) {
  if (!steps || steps.length === 0) return { nodes: [], edges: [] }

  const statusMap = {}
  for (const log of logs) {
    if (log.step_id !== undefined) statusMap[log.step_id] = log.phase
  }

  const positions = computeLayout(steps)
  const NODE_W = 220

  const nodes = steps.map((step) => {
    const cfg = TYPE_CONFIG[step.type] || TYPE_CONFIG['log']
    const status = statusMap[step.id]
    const pos = positions[step.id] || { x: 0, y: 0 }

    let borderColor = cfg.border
    let bgColor     = cfg.bg
    let shadow      = 'none'

    if (status === 'step_done')  { borderColor = '#34a853'; bgColor = '#e6f4ea'; shadow = '0 0 0 2px #ceead644' }
    if (status === 'step_error') { borderColor = '#ea4335'; bgColor = '#fce8e6'; shadow = '0 0 0 2px #f5c6c444' }
    if (status === 'skipped')    { borderColor = '#e8eaed'; bgColor = '#f8f9ff' }
    if (status === 'step_start') { borderColor = cfg.color; shadow = `0 0 0 3px ${cfg.color}30` }

    return {
      id: String(step.id),
      position: pos,
      data: {
        label: (
          <div style={{ textAlign: 'left', padding: '4px 2px' }}>
            {/* Type badge row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <span style={{ fontSize: '14px', lineHeight: 1 }}>{cfg.icon}</span>
              <span style={{
                fontSize: '9px', fontWeight: 700, color: cfg.color,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                borderRadius: '5px', padding: '1px 5px', letterSpacing: '0.3px',
                textTransform: 'uppercase',
              }}>
                {TYPE_CONFIG[step.type]?.label || step.type}
              </span>
              {/* Live status dot */}
              {status && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', display: 'inline-block', marginLeft: 'auto',
                  background: status === 'step_done'  ? '#34a853'
                            : status === 'step_error' ? '#ea4335'
                            : status === 'skipped'    ? '#9aa0a6'
                            : cfg.color,
                  boxShadow: status === 'step_start' ? `0 0 6px ${cfg.color}` : 'none',
                }} />
              )}
            </div>
            {/* Step name */}
            <div style={{ fontWeight: 600, fontSize: '12px', color: '#1f1f1f', lineHeight: 1.3, marginBottom: '3px' }}>
              {step.name}
            </div>
            {/* Description — 2 lines max */}
            <div style={{
              fontSize: '10px', color: '#5f6368', lineHeight: 1.4,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {step.description}
            </div>
          </div>
        ),
      },
      style: {
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: '12px',
        width: NODE_W,
        padding: '8px 10px',
        boxShadow: shadow,
        transition: 'all 0.25s ease',
        cursor: 'default',
      },
      className: status === 'step_start' ? 'step-running' : '',
    }
  })

  const edges = []
  for (const step of steps) {
    for (const depId of (step.depends_on || [])) {
      const status = statusMap[step.id]
      edges.push({
        id: `e${depId}-${step.id}`,
        source: String(depId),
        target: String(step.id),
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: status === 'step_done' ? '#34a853' : '#dadce0',
          width: 14,
          height: 14,
        },
        style: {
          stroke: status === 'step_done' ? '#34a853'
                : status === 'step_error' ? '#ea4335'
                : '#dadce0',
          strokeWidth: 1.5,
        },
        animated: status === 'step_start',
      })
    }
  }

  return { nodes, edges }
}

// ── Copy JSON button ─────────────────────────────────────────────────────────
function CopyButton({ steps }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(steps, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy workflow JSON"
      style={{
        fontSize: '10px', fontWeight: 600, color: copied ? '#34a853' : '#5f6368',
        background: copied ? '#e6f4ea' : '#f1f3f4',
        border: `1px solid ${copied ? '#ceead6' : '#e8eaed'}`,
        borderRadius: '8px', padding: '3px 8px', cursor: 'pointer',
        transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '4px',
      }}
    >
      {copied ? '✓ Copied' : '⎘ JSON'}
    </button>
  )
}

export { CopyButton }

export default function WorkflowDag({ steps, logs }) {
  const { nodes, edges } = useMemo(() => buildNodesAndEdges(steps, logs), [steps, logs])

  if (steps.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f8f9ff]">
        <div className="text-center">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto mb-4 opacity-30">
            <rect x="20" y="18" width="40" height="30" rx="10" fill="#4285f4" />
            <circle cx="32" cy="32" r="5" fill="white" />
            <circle cx="48" cy="32" r="5" fill="white" />
            <circle cx="33.5" cy="33.5" r="2.5" fill="#4285f4" />
            <circle cx="49.5" cy="33.5" r="2.5" fill="#4285f4" />
            <rect x="28" y="40" width="24" height="4" rx="2" fill="white" opacity="0.6" />
            <rect x="38" y="8" width="4" height="10" rx="2" fill="#4285f4" />
            <circle cx="40" cy="8" r="4" fill="#ea4335" />
            <rect x="24" y="50" width="32" height="14" rx="6" fill="#34a853" opacity="0.8" />
            <rect x="6" y="52" width="16" height="8" rx="4" fill="#4285f4" opacity="0.6" />
            <rect x="58" y="52" width="16" height="8" rx="4" fill="#ea4335" opacity="0.6" />
          </svg>
          <p className="text-[13px] font-medium text-[#5f6368]">Your workflow diagram will appear here</p>
          <p className="text-[11px] text-[#9aa0a6] mt-1">Describe a workflow and send it to run</p>
        </div>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e8eaed" gap={24} size={1} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => n.style?.border?.replace(/1\.5px solid /, '') || '#e8eaed'}
        maskColor="rgba(248,249,255,0.7)"
        style={{ border: '1px solid #e8eaed', borderRadius: '10px' }}
      />
    </ReactFlow>
  )
}
