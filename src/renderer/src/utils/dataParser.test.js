/**
 * dataParser.test.js
 * ──────────────────
 * Quick smoke tests for markdownParser and csvExporter.
 * Run with: node src/renderer/src/utils/dataParser.test.js
 */

import { parseMarkdown, serializeMarkdown } from './markdownParser.js'
import { exportCSV, parseCSV } from './csvExporter.js'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  ✅ ${message}`)
  } else {
    failed++
    console.error(`  ❌ ${message}`)
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  assert(a === e, `${message}\n     Expected: ${e}\n     Actual:   ${a}`)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n📝 MARKDOWN PARSER TESTS')
console.log('─'.repeat(50))

// Test 1: Parse PRD format (||| separator)
{
  console.log('\n1. Parse PRD format (||| separator)')
  const md = `| STT | Nội dung | Phương án trả lời | Đáp án | Tags |
|-----|---------|-------------------|--------|------|
| 1 | Thủ đô của Việt Nam là? | Huế|||Hà Nội|||Đà Nẵng|||TP.HCM | B | #DiaLy #De1 |
| 2 | Câu hỏi 2? | Đúng|||Sai | A | #Test |`

  const result = parseMarkdown(md)
  assert(result.length === 2, `Parsed 2 questions (got ${result.length})`)
  assert(result[0].stt === 1, `STT = 1`)
  assert(result[0].content === 'Thủ đô của Việt Nam là?', `Content parsed correctly`)
  assertDeepEqual(result[0].options, ['Huế', 'Hà Nội', 'Đà Nẵng', 'TP.HCM'], 'Options split by |||')
  assert(result[0].answer === 'B', `Answer = B`)
  assert(result[0].tags === '#DiaLy #De1', `Tags parsed`)
}

// Test 2: Parse with escaped pipes (\\| in content)
{
  console.log('\n2. Parse escaped pipes (\\| in content)')
  const md = `| STT | Nội dung | Phương án trả lời | Đáp án | Tags |
|-----|---------|-------------------|--------|------|
| 1 | Dùng ký tự \\| trong câu | Giá trị \\| 100|||Giá trị \\| 200 | A | #Test |`

  const result = parseMarkdown(md)
  assert(result.length === 1, `Parsed 1 question`)
  assert(result[0].content === 'Dùng ký tự | trong câu', `Content pipe unescaped: "${result[0].content}"`)
  assertDeepEqual(result[0].options, ['Giá trị | 100', 'Giá trị | 200'], 'Option pipes unescaped')
}

// Test 3: Parse legacy format (<br> separator)
{
  console.log('\n3. Parse legacy format (<br> separator)')
  const md = `| **STT** | **Nội dung** | **Phương án trả lời** | **Đáp án** | **Tag** |
| --- | --- | --- | --- | --- |
| 1 | Thủ đô Việt Nam? | A. Huế<br> B. Hà Nội<br> C. Đà Nẵng<br> D. TP.HCM | B |  |`

  const result = parseMarkdown(md)
  assert(result.length === 1, `Parsed 1 question from legacy format`)
  assert(result[0].options.length === 4, `4 options parsed from <br> format (got ${result[0].options.length})`)
  assert(result[0].options[0] === 'Huế', `First option stripped label: "${result[0].options[0]}"`)
  assert(result[0].options[1] === 'Hà Nội', `Second option stripped label: "${result[0].options[1]}"`)
}

// Test 4: Roundtrip (parse → serialize → parse)
{
  console.log('\n4. Roundtrip: parse → serialize → parse')
  const original = [
    { stt: 1, content: 'Câu hỏi chứa | pipe', options: ['A', 'B|C', 'D'], answer: 'B', tags: '#tag1 #tag2' },
    { stt: 2, content: 'Câu hỏi 2', options: ['Đúng', 'Sai'], answer: 'A', tags: '' }
  ]

  const md = serializeMarkdown(original)
  const parsed = parseMarkdown(md)

  assert(parsed.length === 2, `Roundtrip preserved 2 questions`)
  assert(parsed[0].content === 'Câu hỏi chứa | pipe', `Roundtrip preserved pipe in content`)
  assertDeepEqual(parsed[0].options, ['A', 'B|C', 'D'], 'Roundtrip preserved pipe in options')
  assert(parsed[1].answer === 'A', `Roundtrip preserved answer`)
}

// Test 5: serializeMarkdown escapes pipes correctly
{
  console.log('\n5. serializeMarkdown escapes pipes correctly')
  const questions = [
    { stt: 1, content: 'A | B', options: ['X | Y', 'Z'], answer: 'A', tags: '#t' }
  ]
  const md = serializeMarkdown(questions)
  assert(md.includes('A \\| B'), `Content pipe escaped: found "A \\| B"`)
  assert(md.includes('X \\| Y|||Z'), `Options escaped and joined with |||`)
}

// Test 6: Max 10 options (PRD §4.1)
{
  console.log('\n6. Max 10 options enforced')
  const options12 = Array.from({ length: 12 }, (_, i) => `Opt${i + 1}`)
  const md = `| STT | Nội dung | Phương án trả lời | Đáp án | Tags |
|-----|---------|-------------------|--------|------|
| 1 | Q? | ${options12.join('|||')} | A | |`

  const result = parseMarkdown(md)
  assert(result[0].options.length === 10, `Capped at 10 options (from 12)`)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n\n📊 CSV EXPORTER TESTS')
console.log('─'.repeat(50))

// Test 7: Export CSV basic
{
  console.log('\n7. Export CSV basic format')
  const questions = [
    { stt: 1, content: 'Thủ đô Việt Nam?', options: ['Huế', 'Hà Nội', 'Đà Nẵng', 'TP.HCM'], answer: 'B', tags: '#DiaLy' }
  ]
  const csv = exportCSV(questions)
  assert(csv.includes('STT'), 'CSV has STT header')
  assert(csv.includes('Phương án A'), 'CSV has option columns')
  assert(csv.includes('Phương án J'), 'CSV has all 10 option columns')
  assert(csv.includes('Huế'), 'CSV contains option A')
  assert(csv.includes('Hà Nội'), 'CSV contains option B')
}

// Test 8: CSV roundtrip (export → import)
{
  console.log('\n8. CSV roundtrip: export → import')
  const original = [
    { stt: 1, content: 'Câu hỏi 1?', options: ['A', 'B', 'C'], answer: 'A', tags: '#t1' },
    { stt: 2, content: 'Câu "hỏi" 2,3?', options: ['X', 'Y'], answer: 'B', tags: '#t2 #t3' }
  ]

  const csv = exportCSV(original)
  const parsed = parseCSV(csv)

  assert(parsed.length === 2, `CSV roundtrip: 2 questions`)
  assert(parsed[0].content === 'Câu hỏi 1?', `CSV roundtrip: content preserved`)
  assert(parsed[1].content === 'Câu "hỏi" 2,3?', `CSV roundtrip: quotes & commas preserved`)
  assertDeepEqual(parsed[0].options, ['A', 'B', 'C'], 'CSV roundtrip: options preserved')
  assert(parsed[1].answer === 'B', `CSV roundtrip: answer preserved`)
}

// Test 9: RFC 4180 — fields with special characters
{
  console.log('\n9. RFC 4180: special characters in fields')
  const questions = [
    { stt: 1, content: 'Line1\nLine2', options: ['a,b', 'c"d'], answer: 'A', tags: '' }
  ]
  const csv = exportCSV(questions)
  // papaparse should wrap fields in quotes
  assert(csv.includes('"Line1\nLine2"') || csv.includes('"Line1'), 'Newline wrapped in quotes')

  const parsed = parseCSV(csv)
  assert(parsed[0].content.includes('Line1'), 'Multiline content preserved after roundtrip')
  assert(parsed[0].options[0] === 'a,b', 'Comma in option preserved')
  assert(parsed[0].options[1] === 'c"d', 'Quote in option preserved')
}

// Test 10: Cross-format (parse MD → export CSV → parse CSV)
{
  console.log('\n10. Cross-format: MD → CSV → re-parse')
  const md = `| STT | Nội dung | Phương án trả lời | Đáp án | Tags |
|-----|---------|-------------------|--------|------|
| 42 | Câu hỏi đặc biệt! | Opt A|||Opt B|||Opt C | C | #exam |`

  const mdParsed = parseMarkdown(md)
  const csv = exportCSV(mdParsed)
  const csvParsed = parseCSV(csv)

  assert(csvParsed[0].stt === 42, 'Cross-format: STT preserved')
  assert(csvParsed[0].answer === 'C', 'Cross-format: answer preserved')
  assertDeepEqual(csvParsed[0].options, ['Opt A', 'Opt B', 'Opt C'], 'Cross-format: options preserved')
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n' + '═'.repeat(50))
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('⚠️  Some tests FAILED!')
  process.exit(1)
} else {
  console.log('🎉 All tests passed!')
}
