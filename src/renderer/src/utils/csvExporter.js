/**
 * csvExporter.js
 * ──────────────
 * Export & import CSV data per PRD §8.2.
 *
 * CSV FORMAT (RFC 4180 via papaparse):
 * - Options are spread into separate columns: Phương án A … J (max 10).
 * - Fields containing commas, quotes, or newlines are auto-quoted.
 * - Quote characters inside fields are escaped as "".
 *
 * HEADERS:
 *   STT, Nội dung, Phương án A, Phương án B, …, Phương án J, Đáp án, Tags
 */

import Papa from 'papaparse'

// ── Constants ──

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const MAX_OPTIONS = 10

const CSV_HEADERS = [
  'STT',
  'Nội dung',
  ...OPTION_LABELS.map(label => `Phương án ${label}`),
  'Đáp án',
  'Tags'
]

// ──────────────────────────────────────────────
//  EXPORT  (Question[] → CSV string)
// ──────────────────────────────────────────────

/**
 * Export an array of question objects to a CSV string (RFC 4180).
 *
 * @param {Array<{stt: number, content: string, options: string[], answer: string, tags: string}>} questions
 * @returns {string}  CSV string ready to write to file
 */
export function exportCSV(questions) {
  if (!questions || questions.length === 0) return ''

  const data = questions.map(q => {
    const row = [
      q.stt,
      q.content || ''
    ]

    // Spread options into columns A–J (pad with empty strings if < 10)
    for (let i = 0; i < MAX_OPTIONS; i++) {
      row.push((q.options && q.options[i]) ? q.options[i] : '')
    }

    row.push(q.answer || '')
    row.push(q.tags || '')

    return row
  })

  const csvString = Papa.unparse({
    fields: CSV_HEADERS,
    data: data
  })

  // Add UTF-8 BOM so Excel opens it with correct encoding for Vietnamese
  return '\uFEFF' + csvString
}

// ──────────────────────────────────────────────
//  IMPORT  (CSV string → Question[])
// ──────────────────────────────────────────────

/**
 * Parse a CSV string into an array of question objects.
 * Handles both the PRD format (Phương án A–J columns) and
 * generic CSV with flexible headers.
 *
 * @param {string} csvContent  Raw CSV file content (UTF-8)
 * @returns {Array<{stt: number, content: string, options: string[], answer: string, tags: string}>}
 */
export function parseCSV(csvContent) {
  if (!csvContent || typeof csvContent !== 'string') return []

  // Strip BOM
  const clean = csvContent.replace(/^\uFEFF/, '')

  const result = Papa.parse(clean, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,     // Keep everything as strings; we parse STT manually
    transformHeader: (h) => h.trim()
  })

  if (!result.data || result.data.length === 0) return []

  const headers = result.meta.fields || []

  // Detect column names (flexible matching)
  const sttCol     = findHeader(headers, /^stt$/i)
  const contentCol = findHeader(headers, /nội dung|noi dung|content/i)
  const answerCol  = findHeader(headers, /đáp án|dap an|answer/i)
  const tagsCol    = findHeader(headers, /tag/i)

  // Detect option columns (Phương án A, Phương án B, ..., or Option A, ...)
  const optionCols = OPTION_LABELS
    .map(label => findHeader(headers, new RegExp(`phương án\\s*${label}|option\\s*${label}`, 'i')))
    .filter(col => col !== null)

  const questions = []

  for (const row of result.data) {
    const sttRaw = sttCol ? row[sttCol] : null
    const stt = parseInt(sttRaw, 10)
    if (isNaN(stt)) continue  // Skip header echo or malformed rows

    const content = (contentCol ? row[contentCol] : '') || ''
    const answer  = (answerCol ? row[answerCol] : '').trim().toUpperCase()
    const tags    = (tagsCol ? row[tagsCol] : '') || ''

    // Collect options from Phương án A–J columns, filtering out empties
    const options = optionCols
      .map(col => (row[col] || '').trim())
      .filter(opt => opt.length > 0)

    questions.push({
      stt,
      content: content.trim(),
      options,
      answer,
      tags: tags.trim()
    })
  }

  return questions
}

/**
 * Find a header name that matches the given regex pattern.
 * Returns the exact header string or null.
 */
function findHeader(headers, pattern) {
  return headers.find(h => pattern.test(h)) || null
}
