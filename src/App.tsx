import React, { useState, useEffect, useMemo } from 'react';
import { Toolbar } from './components/Toolbar';
import { TagsSidebar } from './components/TagsSidebar';
import { QuestionTable } from './components/QuestionTable';
import { GasIntegrationModal } from './components/GasIntegrationModal';
import { ExportModal } from './components/ExportModal';
import type { QuestionItem } from './types';
import { parseMarkdownToQuestions, exportQuestionsToMarkdown } from './services/MarkdownParser';
import { exportQuestionsToCsv } from './services/CsvExporter';
import { parseRangeString } from './utils/parseRange';

function App() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  
  const [showGasModal, setShowGasModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Khởi tạo file ban đầu nếu cửa sổ này được spawn từ cửa sổ mẹ
  useEffect(() => {
    async function initFile() {
      const initPath = await window.electronAPI?.getInitialFile?.();
      if (initPath) {
        loadDataFromFile(initPath);
      }
    }
    initFile();
  }, []);

  const loadDataFromFile = async (filePath: string) => {
    try {
      const content = await window.electronAPI?.readFile?.(filePath);
      if (!content) return;
      const parsed = parseMarkdownToQuestions(content);
      if (parsed.length === 0) {
        alert("Không tìm thấy dữ liệu hoặc cấu trúc file Markdown chưa đúng chuẩn.");
        return;
      }
      setQuestions(parsed);
      setCurrentFile(filePath);
      setIsDirty(false);
      setSelectedTags([]);
    } catch (e: any) {
      alert("Lỗi khi load file: " + e.message);
      console.error(e);
    }
  };

  // Sync dirty flag to Main Process
  useEffect(() => {
    window.electronAPI?.setDirty?.(isDirty);
    
    // Update title
    const baseTitle = currentFile ? `Exam Bank - ${currentFile.split('\\').pop()?.split('/').pop()}` : 'Exam Bank Manager';
    window.electronAPI?.setTitle?.(baseTitle);
  }, [isDirty, currentFile]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    questions.forEach(q => q.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (selectedTags.length === 0) return questions;
    return questions.filter(q => selectedTags.every(tag => q.tags.includes(tag)));
  }, [questions, selectedTags]);

  const handleQuestionsChange = (newQuestions: QuestionItem[]) => {
    setQuestions(newQuestions);
    setIsDirty(true);
  };

  const handleImportMd = async () => {
    const result = await window.electronAPI?.openFile?.();
    if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      
      // Nếu app đang có data hoặc isDirty, mở file trong cửa sổ mới
      if (questions.length > 0 || isDirty) {
        window.electronAPI?.newWindow?.(filePath);
      } else {
        loadDataFromFile(filePath);
      }
    }
  };

  const executeExportMd = async (rangeString?: string) => {
    let targetQuestions = filteredQuestions;
    if (rangeString && rangeString.trim() !== '') {
      const allowedStt = parseRangeString(rangeString);
      targetQuestions = questions.filter(q => allowedStt.includes(q.stt));
      if (targetQuestions.length === 0) {
        alert('Không tìm thấy dải STT nào hợp lệ trong dữ liệu.');
        return;
      }
    }

    const defaultPath = currentFile ? currentFile.replace(/\.md$/, '_export.md') : 'bank_export.md';
    const result = await window.electronAPI?.saveFile?.(defaultPath, [
      { name: 'Markdown', extensions: ['md', 'markdown'] }
    ]);
    if (result && !result.canceled && result.filePath) {
      const mdFormat = exportQuestionsToMarkdown(targetQuestions);
      await window.electronAPI?.writeFile?.(result.filePath, mdFormat);
      setShowExportModal(false);
    }
  };

  const executeExportCsv = async (rangeString?: string) => {
    let targetQuestions = filteredQuestions;
    if (rangeString && rangeString.trim() !== '') {
      const allowedStt = parseRangeString(rangeString);
      targetQuestions = questions.filter(q => allowedStt.includes(q.stt));
      if (targetQuestions.length === 0) {
        alert('Không tìm thấy dải STT nào hợp lệ trong dữ liệu.');
        return;
      }
    }

    const defaultPath = currentFile ? currentFile.replace(/\.md$/, '.csv') : 'bank.csv';
    const result = await window.electronAPI?.saveFile?.(defaultPath, [
      { name: 'CSV', extensions: ['csv'] }
    ]);
    if (result && !result.canceled && result.filePath) {
      const csvData = exportQuestionsToCsv(targetQuestions);
      await window.electronAPI?.writeFile?.(result.filePath, csvData);
      setShowExportModal(false);
    }
  };

  const handleSave = async () => {
    if (!currentFile) {
      // Like save as if there is no target file
      executeExportMd();
      return;
    }
    const mdFormat = exportQuestionsToMarkdown(questions);
    await window.electronAPI?.writeFile?.(currentFile, mdFormat);
    setIsDirty(false);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
      <Toolbar 
        onImportMd={handleImportMd}
        onExportAction={() => setShowExportModal(true)}
        onGenerateGas={() => setShowGasModal(true)}
        onSave={handleSave}
        isDirty={isDirty}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <TagsSidebar 
          allTags={allTags}
          selectedTags={selectedTags}
          onChange={setSelectedTags}
        />
        
        <QuestionTable 
          data={filteredQuestions}
          onChange={handleQuestionsChange}
        />
      </div>

      {showExportModal && (
        <ExportModal 
          onClose={() => setShowExportModal(false)}
          onExportCsv={executeExportCsv}
          onExportMd={executeExportMd}
        />
      )}

      {showGasModal && (
        <GasIntegrationModal onClose={() => setShowGasModal(false)} />
      )}
    </div>
  );
}

export default App;
