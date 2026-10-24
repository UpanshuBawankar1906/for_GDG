const FIELDS = [
  'id', 'date', 'from', 'subject', 'company', 'role',
  'category', 'confidence', 'summary', 'scam_reasons', 'follow_up_due',
]

function download(filename, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Prefix cells that spreadsheets would treat as formulas (CSV injection).
export const csvCell = (v) => {
  let s = String(Array.isArray(v) ? v.join('; ') : (v ?? ''))
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export function buildCSV(classified) {
  const rows = [FIELDS.join(',')]
  classified.forEach(e => rows.push(FIELDS.map(f => csvCell(e[f])).join(',')))
  return rows.join('\n')
}

export function exportCSV(classified) {
  download('jobpilot-tracker.csv', buildCSV(classified), 'text/csv;charset=utf-8')
}

export function exportJSON(classified) {
  download('jobpilot-tracker.json', JSON.stringify(classified, null, 2), 'application/json')
}
