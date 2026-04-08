import Papa from 'papaparse';
import { QuestionItem } from '../types';

export function exportQuestionsToCsv(questions: QuestionItem[]): string {
  const data = questions.map(q => ({
    'STT': q.stt,
    'Nội dung': q.content,
    'Phương án A': q.options[0] || '',
    'Phương án B': q.options[1] || '',
    'Phương án C': q.options[2] || '',
    'Phương án D': q.options[3] || '',
    'Đáp án': q.correctAnswer,
    'Tags': q.tags.join(' ')
  }));

  // creates RFC 4180 compliant CSV
  const csv = Papa.unparse(data, {
    quotes: true, // Force quotes for safety
    quoteChar: '"',
    escapeChar: '"',
    delimiter: ',',
    header: true,
    newline: '\r\n',
  });

  return csv;
}
