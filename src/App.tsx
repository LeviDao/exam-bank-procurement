import React, { useState, useEffect, useMemo } from 'react';
import { Toolbar } from './components/Toolbar';
import { TagsSidebar } from './components/TagsSidebar';
import { QuestionTable } from './components/QuestionTable';
import { GasIntegrationModal } from './components/GasIntegrationModal';
import { QuestionItem } from './types';
import { parseMarkdownToQuestions, exportQuestionsToMarkdown } from './services/MarkdownParser';
import { exportQuestionsToCsv } from './services/CsvExporter';

function App() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [showGasModal, setShowGasModal] = useState<boolean>(false);

  // Sync dirty flag to Main Process
  useEffect(() => {
    window.electronAPI.setDirty(isDirty);
    
    // Update title
    const baseTitle = currentFile ? `Exam Bank - ${currentFile.split('\\').pop()?.split('/').pop()}` : 'Exam Bank Manager';
    window.electronAPI.setTitle(baseTitle);
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
    // When editing, we receive the filtered list modified. 
    // We need to merge it back into the main list based on unique IDs.
    setQuestions(prev => prev.map(p => newQuestions.find(n => n.id === p.id) || p));
    setIsDirty(true);
  };

  const handleImportMd = async () => {
    const result = await window.electronAPI.openFile();
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const content = await window.electronAPI.readFile(filePath);
      const parsed = parseMarkdownToQuestions(content);
      setQuestions(parsed);
      setCurrentFile(filePath);
      setIsDirty(false);
      setSelectedTags([]);
    }
  };

  const handleExportMd = async () => {
    const result = await window.electronAPI.saveFile(currentFile || undefined, [
      { name: 'Markdown', extensions: ['md', 'markdown'] }
    ]);
    if (!result.canceled && result.filePath) {
      const mdFormat = exportQuestionsToMarkdown(questions);
      await window.electronAPI.writeFile(result.filePath, mdFormat);
      setCurrentFile(result.filePath);
      setIsDirty(false);
    }
  };

  const handleSave = async () => {
    if (!currentFile) {
      handleExportMd();
      return;
    }
    const mdFormat = exportQuestionsToMarkdown(questions);
    await window.electronAPI.writeFile(currentFile, mdFormat);
    setIsDirty(false);
  };

  const handleExportCsv = async () => {
    const defaultPath = currentFile ? currentFile.replace(/\.md$/, '.csv') : 'bank.csv';
    const result = await window.electronAPI.saveFile(defaultPath, [
      { name: 'CSV', extensions: ['csv'] }
    ]);
    if (!result.canceled && result.filePath) {
      const csvData = exportQuestionsToCsv(questions);
      await window.electronAPI.writeFile(result.filePath, csvData);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
      <Toolbar 
        onImportMd={handleImportMd}
        onExportMd={handleExportMd}
        onExportCsv={handleExportCsv}
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

      {showGasModal && (
        <GasIntegrationModal onClose={() => setShowGasModal(false)} />
      )}
    </div>
  );
}

export default App;
