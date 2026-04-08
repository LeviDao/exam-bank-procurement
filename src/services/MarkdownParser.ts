import { QuestionItem, AnswerOption } from '../types';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function parseMarkdownToQuestions(mdText: string): QuestionItem[] {
  const lines = mdText.split('\n');
  const questions: QuestionItem[] = [];
  
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.includes('STT') && trimmed.includes('Nội dung')) {
      inTable = true;
      continue; // Header row
    }
    if (inTable && trimmed.startsWith('|') && trimmed.includes('---')) {
      continue; // Separator row
    }
    if (inTable && trimmed.startsWith('|')) {
      // Split and remove first and last empty elements caused by boundaries
      const parts = trimmed.split('|').map(s => s.trim());
      if (parts.length >= 6) {
        const [, stt, content, optionsRaw, correctRaw, tagsRaw] = parts;
        
        // Parse options (Splitting by <br>)
        const rawOptionsList = optionsRaw.split(/<br\s*\/?>/i).map(s => s.trim());
        const options: [string, string, string, string] = ['', '', '', ''];
        
        rawOptionsList.forEach(opt => {
          if (opt.startsWith('A.')) options[0] = opt.substring(2).trim();
          else if (opt.startsWith('B.')) options[1] = opt.substring(2).trim();
          else if (opt.startsWith('C.')) options[2] = opt.substring(2).trim();
          else if (opt.startsWith('D.')) options[3] = opt.substring(2).trim();
        });

        const correctAnswer = ['A','B','C','D'].includes(correctRaw) ? correctRaw as AnswerOption : '';
        const tags = tagsRaw.split(' ').filter(t => t.startsWith('#')).map(t => t.trim());

        questions.push({
          id: generateId(),
          stt,
          content,
          options,
          correctAnswer,
          tags
        });
      }
    }
  }

  return questions;
}

export function exportQuestionsToMarkdown(questions: QuestionItem[]): string {
  let md = '| STT | Nội dung | Phương án trả lời | Đáp án | Tags |\n';
  md += '|---|---|---|---|---|\n';

  for (const q of questions) {
    const opts = [];
    if (q.options[0]) opts.push(`A. ${q.options[0]}`);
    if (q.options[1]) opts.push(`B. ${q.options[1]}`);
    if (q.options[2]) opts.push(`C. ${q.options[2]}`);
    if (q.options[3]) opts.push(`D. ${q.options[3]}`);
    
    const optionsStr = opts.join(' <br> ');
    const tagsStr = q.tags.join(' ');
    
    md += `| ${q.stt} | ${q.content} | ${optionsStr} | ${q.correctAnswer} | ${tagsStr} |\n`;
  }
  
  return md;
}
