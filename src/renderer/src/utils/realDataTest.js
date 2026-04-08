/**
 * Quick smoke test: parse the actual 390-question sample file.
 */
import { parseMarkdown, serializeMarkdown } from './markdownParser.js'
import { exportCSV, parseCSV } from './csvExporter.js'
import fs from 'fs'
import path from 'path'

const sampleFile = path.resolve('390 câu hỏi.md')
const content = fs.readFileSync(sampleFile, 'utf-8')

console.log(`📄 File size: ${content.length} chars`)
console.log(`📄 Lines: ${content.split('\n').length}`)

const questions = parseMarkdown(content)
console.log(`\n✅ Parsed: ${questions.length} questions`)

// Show first 3
for (let i = 0; i < 3 && i < questions.length; i++) {
  const q = questions[i]
  console.log(`\n── Câu ${q.stt} ──`)
  console.log(`   Content: ${q.content.slice(0, 80)}...`)
  console.log(`   Options: ${q.options.length} (first: "${q.options[0]?.slice(0, 50)}...")`)
  console.log(`   Answer: ${q.answer}`)
  console.log(`   Tags: ${q.tags || '(none)'}`)
}

// Verify counts
const optionCounts = questions.map(q => q.options.length)
const min = Math.min(...optionCounts)
const max = Math.max(...optionCounts)
console.log(`\n📊 Options per question: min=${min}, max=${max}`)

// Check answers
const answerCounts = {}
questions.forEach(q => { answerCounts[q.answer] = (answerCounts[q.answer] || 0) + 1 })
console.log(`📊 Answer distribution:`, answerCounts)

// Test CSV export roundtrip
const csv = exportCSV(questions)
const csvParsed = parseCSV(csv)
console.log(`\n📊 CSV roundtrip: ${questions.length} → CSV → ${csvParsed.length} questions`)

if (csvParsed.length === questions.length) {
  console.log('✅ CSV roundtrip count matches!')
} else {
  console.error('❌ CSV count mismatch!')
}

// Test MD serialize roundtrip
const md2 = serializeMarkdown(questions)
const mdParsed2 = parseMarkdown(md2)
console.log(`📊 MD roundtrip: ${questions.length} → MD → ${mdParsed2.length} questions`)

if (mdParsed2.length === questions.length) {
  console.log('✅ MD roundtrip count matches!')
} else {
  console.error('❌ MD count mismatch!')
}
