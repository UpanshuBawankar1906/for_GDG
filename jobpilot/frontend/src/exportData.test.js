import test from 'node:test'
import assert from 'node:assert/strict'
import { csvCell, buildCSV } from './exportData.js'

test('csvCell quotes and escapes double quotes', () => {
  assert.equal(csvCell('say "hi"'), '"say ""hi"""')
})

test('csvCell joins arrays with semicolons', () => {
  assert.equal(csvCell(['Asks for fee', 'Requests PAN']), '"Asks for fee; Requests PAN"')
})

test('csvCell handles null and undefined', () => {
  assert.equal(csvCell(null), '""')
  assert.equal(csvCell(undefined), '""')
})

test('csvCell neutralises spreadsheet formulas (CSV injection)', () => {
  for (const bad of ['=SUM(A1)', '+1', '-1', '@cmd']) {
    assert.ok(csvCell(bad).startsWith(`"'${bad[0]}`), bad)
  }
})

test('buildCSV outputs a header and one row per email', () => {
  const csv = buildCSV([
    { id: 1, date: '2026-10-10', from: 'a@b.com', subject: 'Hi', category: 'applied', scam_reasons: [] },
    { id: 2, date: '2026-10-14', from: 'x@y.com', subject: 'Fee', category: 'scam', scam_reasons: ['Asks for payment fee'] },
  ])
  const lines = csv.split('\n')
  assert.equal(lines.length, 3)
  assert.ok(lines[0].startsWith('id,date,from,subject'))
  assert.ok(lines[2].includes('Asks for payment fee'))
})
