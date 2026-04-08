export type AnswerOption = 'A' | 'B' | 'C' | 'D' | '';

export interface QuestionItem {
  id: string; // UUID sinh tự động trên client để làm key
  stt: string; // Số thứ tự theo file Markdown
  content: string; // Nội dung câu hỏi
  options: [string, string, string, string]; // Mảng cứng 4 phần tử tương ứng A, B, C, D
  correctAnswer: AnswerOption;
  tags: string[]; // Các tags
}
