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

const csvCell = (v) => {
  const s = Array.isArray(v) ? v.join('; ') : (v ?? '')
  return `"${String(s).replace(/"/g, '""')}"`
}

export function exportCSV(classified) {
  const rows = [FIELDS.join(',')]
  classified.forEach(e => rows.push(FIELDS.map(f => csvCell(e[f])).join(',')))
  download('jobpilot-tracker.csv', rows.join('\n'), 'text/csv;charset=utf-8')
}

export function exportJSON(classified) {
  download('jobpilot-tracker.json', JSON.stringify(classified, null, 2), 'application/json')
}
