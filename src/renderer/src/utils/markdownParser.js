/**
 * markdownParser.js
 * ─────────────────
 * Parse & serialize Markdown tables per PRD §8.1.
 *
 * KEY RULES (PRD v1.7):
 * - Options are separated by `|||` (triple pipe) — NEVER escaped.
 * - Single `|` inside content / options / tags must be escaped to `\|` on export.
 * - On import: split by `|||` first, then unescape `\|` → `|`.
 *
 * LEGACY SUPPORT:
 * - Also handles `<br>` as option separator (found in legacy .md files).
 */

// ── Sentinel characters for safe column splitting ──
const ESCAPED_PIPE = '\x00'   // placeholder for \|  (content pipe)
const TRIPLE_PIPE  = '\x01'   // placeholder for ||| (option separator)
const BR_TAG       = '\x02'   // placeholder for <br> (legacy separator)

// ──────────────────────────────────────────────
//  PARSE  (Markdown string → Question[])
// ──────────────────────────────────────────────

/**
 * Parse a markdown table string into an array of question objects.
 *
 * @param {string} content  Raw markdown file content (UTF-8).
 * @returns {Array<{stt: number, content: string, options: string[], answer: string, tags: string}>}
 */
export function parseMarkdown(content) {
  if (!content || typeof content !== 'string') return []

  // Strip BOM if present
  const clean = content.replace(/^\uFEFF/, '')

  const lines = clean.split(/\r?\n/)

  // Find the table: look for first line that starts with | and contains STT
  let tableStartIndex = -1
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith('|') && /stt/i.test(trimmed)) {
      tableStartIndex = i
      break
    }
  }

  if (tableStartIndex === -1) return []

  // Detect column mapping from header row
  const headerLine = lines[tableStartIndex]
  const columnMap = detectColumnMapping(headerLine)

  // Skip header line and separator line (---|---|...)
  const dataLines = []
  for (let i = tableStartIndex + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    // Skip separator rows
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue
    // Skip empty lines
    if (!trimmed) continue
    // Must be a table row
    if (trimmed.startsWith('|')) {
      dataLines.push(trimmed)
    }
  }

  const questions = []

  for (const line of dataLines) {
    const question = parseSingleRow(line, columnMap)
    if (question) {
      questions.push(question)
    }
  }

  return questions
}

/**
 * Detect column indices from the header row.
 * Returns a mapping { stt, content, options, answer, tags }.
 */
function detectColumnMapping(headerLine) {
  const cells = splitRowIntoCells(headerLine)
  const map = { stt: 0, content: 1, options: 2, answer: 3, tags: 4 }

  for (let i = 0; i < cells.length; i++) {
    const lower = cells[i].toLowerCase().replace(/\*/g, '').trim()
    if (lower === 'stt') map.stt = i
    else if (/nội dung|noi dung/i.test(lower)) map.content = i
    else if (/phương án|phuong an/i.test(lower)) map.options = i
    else if (/đáp án|dap an/i.test(lower)) map.answer = i
    else if (/tag/i.test(lower)) map.tags = i
  }

  return map
}

/**
 * Split a markdown table row into cell strings.
 * Handles \| (escaped pipes) and ||| (triple pipe option separators)
 * by replacing them with sentinels before splitting on column-separator |.
 */
function splitRowIntoCells(line) {
  // Step 1: Replace \| with sentinel (must come BEFORE |||)
  let processed = line.replace(/\\\|/g, ESCAPED_PIPE)

  // Step 2: Replace ||| with sentinel
  processed = processed.replace(/\|\|\|/g, TRIPLE_PIPE)

  // Step 3: Replace <br> with sentinel (legacy format)
  processed = processed.replace(/<br\s*\/?>/gi, BR_TAG)

  // Step 4: Split by remaining | (column separators)
  const parts = processed.split('|')

  // Trim leading/trailing empty strings from | at line boundaries
  // A row like "| A | B | C |" splits to ["", " A ", " B ", " C ", ""]
  if (parts.length >= 2) {
    return parts.slice(1, -1).map(c => c.trim())
  }
  return parts.map(c => c.trim())
}

/**
 * Parse a single data row of the table.
 */
function parseSingleRow(line, columnMap) {
  const cells = splitRowIntoCells(line)

  const minCols = Math.max(columnMap.stt, columnMap.content, columnMap.options, columnMap.answer) + 1
  if (cells.length < minCols) return null

  const rawStt     = cells[columnMap.stt] || ''
  const rawContent = cells[columnMap.content] || ''
  const rawOptions = cells[columnMap.options] || ''
  const rawAnswer  = cells[columnMap.answer] || ''
  const rawTags    = columnMap.tags < cells.length ? (cells[columnMap.tags] || '') : ''

  // ── Parse STT ──
  const sttClean = restoreSentinels(rawStt).trim()
  const stt = parseInt(sttClean, 10)
  if (isNaN(stt)) return null // Skip header-like or malformed rows

  // ── Parse Options ──
  // First try ||| separator (PRD format)
  let optionParts
  if (rawOptions.includes(TRIPLE_PIPE)) {
    optionParts = rawOptions.split(TRIPLE_PIPE)
  }
  // Then try <br> separator (legacy format)
  else if (rawOptions.includes(BR_TAG)) {
    optionParts = rawOptions.split(BR_TAG)
  }
  // No separator found — treat as single option
  else {
    optionParts = [rawOptions]
  }

  const options = optionParts
    .map(opt => restoreSentinels(opt).trim())
    .filter(opt => opt.length > 0)

  // Enforce max 10 options (PRD §4.1)
  const trimmedOptions = options.slice(0, 10)

  // ── Parse remaining fields ──
  const questionContent = restoreSentinels(rawContent).trim()
  const answer = restoreSentinels(rawAnswer).trim().toUpperCase()
  const tags = restoreSentinels(rawTags).trim()

  // Strip leading option labels like "A. ", "B. " etc. from options
  const cleanOptions = trimmedOptions.map(opt => stripOptionLabel(opt))

  return {
    stt,
    content: questionContent,
    options: cleanOptions,
    answer,
    tags
  }
}

/**
 * Restore sentinel characters back to their original values.
 * Used after column splitting to get actual cell content.
 */
function restoreSentinels(str) {
  return str
    .replace(new RegExp(ESCAPED_PIPE, 'g'), '|')
    .replace(new RegExp(TRIPLE_PIPE, 'g'), '|||')
    .replace(new RegExp(BR_TAG, 'g'), '')
}

/**
 * Strip leading option labels like "A. ", "B. " from option text.
 * Only strips if the label matches A–J followed by a dot or ')'.
 */
function stripOptionLabel(text) {
  return text.replace(/^[A-Ja-j][.)]\s*/, '')
}

// ──────────────────────────────────────────────
//  SERIALIZE  (Question[] → Markdown string)
// ──────────────────────────────────────────────

/**
 * Escape a single pipe `|` in content for markdown output.
 * Does NOT touch `|||` — that sequence is only created by joinOptions.
 */
function escapeContentPipe(str) {
  return str.replace(/\|/g, '\\|')
}

/**
 * Join an options array with `|||` separator, escaping pipes inside each option.
 *
 * @param {string[]} options  Array of option strings
 * @returns {string}          Escaped, `|||`-separated string
 */
function joinOptions(options) {
  return options.map(opt => escapeContentPipe(opt)).join('|||')
}

/**
 * Serialize an array of question objects back to markdown table format (PRD §8.1).
 *
 * @param {Array<{stt: number, content: string, options: string[], answer: string, tags: string}>} questions
 * @returns {string}  Markdown table string
 */
export function serializeMarkdown(questions) {
  if (!questions || questions.length === 0) return ''

  const header = '| STT | Nội dung | Phương án trả lời | Đáp án | Tags |'
  const separator = '|-----|---------|-------------------|--------|------|'

  const rows = questions.map(q => {
    const stt     = q.stt
    const content = escapeContentPipe(q.content || '')
    const options = joinOptions(q.options || [])
    const answer  = escapeContentPipe(q.answer || '')
    const tags    = escapeContentPipe(q.tags || '')

    return `| ${stt} | ${content} | ${options} | ${answer} | ${tags} |`
  })

  return [header, separator, ...rows].join('\n')
}
