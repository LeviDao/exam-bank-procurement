import { useState, useMemo } from 'react'
import { EditableTable } from './components/EditableTable'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { ExportDialog } from './components/ExportDialog'
import { AppsScriptDialog } from './components/AppsScriptDialog'
import { useFileOperations } from './hooks/useFileOperations'

function App() {
  const {
    questions,
    updateQuestions,
    statusMessage,
    handleOpen,
    handleSave,
  } = useFileOperations()

  // --- External Dialogs State ---
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isAppsScriptOpen, setIsAppsScriptOpen] = useState(false)

  // --- Validation Logic (PRD 6.1: Disable Export if Error) ---
  const hasValidationError = useMemo(() => {
    if (questions.length === 0) return true // Disable if empty
    
    const sttCounts = {}
    for (const q of questions) {
      const stt = String(q.stt || '').trim()
      if (!stt) return true // Error: Empty STT
      sttCounts[stt] = (sttCounts[stt] || 0) + 1
      if (sttCounts[stt] > 1) return true // Error: Duplicate STT
      if (!q.answer || q.answer.trim() === '') return true // Error: Empty answer
    }
    return false
  }, [questions])

  const handleAddRow = () => {
    const maxStt = Math.max(0, ...questions.map(q => parseInt(q.stt) || 0))
    updateQuestions([...questions, { stt: maxStt + 1, content: '', options: [], answer: '', tags: '' }])
  }

  // --- Filtering State ---
  const [selectedTags, setSelectedTags] = useState([])
  const [filterMode, setFilterMode] = useState('OR')

  // Derive filtered list
  const filteredQuestions = useMemo(() => {
    if (selectedTags.length === 0) return questions
    return questions.filter(q => {
      const qTags = (q.tags || '').split(',').map(t => t.trim()).filter(Boolean)
      if (filterMode === 'AND') {
        return selectedTags.every(t => qTags.includes(t))
      } else {
        return selectedTags.some(t => qTags.includes(t))
      }
    })
  }, [questions, selectedTags, filterMode])

  // Securely update source array using object reference equality
  const handleUpdateRow = (rowIndexInFiltered, columnId, value) => {
    const rowRef = filteredQuestions[rowIndexInFiltered]
    const newQuestions = questions.map(q => 
      q === rowRef ? { ...q, [columnId]: value } : q
    )
    updateQuestions(newQuestions)
  }

  return (
    <div className="app-layout">
      <Toolbar 
        onNew={() => window.electronAPI?.openNewWindow()}
        onOpen={handleOpen}
        onSave={handleSave}
        onExportClick={() => setIsExportOpen(true)}
        onAppsScriptClick={() => setIsAppsScriptOpen(true)}
        onAddRow={handleAddRow}
        onDeleteRow={() => {}}
        hasValidationError={hasValidationError}
      />

      {/* Main content area */}
      <div className="main-content">
        <Sidebar 
          questions={questions}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          filteredCount={filteredQuestions.length}
        />

        {/* Table area */}
        <main className="table-container">
          {questions.length === 0 ? (
            <div className="table-empty">
              <p>📋 Chưa có câu hỏi nào.</p>
              <p>Nhấn <strong>Ctrl+O</strong> để mở file hoặc <strong>Ctrl+Ins</strong> để thêm câu hỏi mới.</p>
            </div>
          ) : (
            <EditableTable 
              data={filteredQuestions} 
              onUpdateRow={handleUpdateRow} 
            />
          )}
        </main>
      </div>

      {/* Status bar */}
      <footer className="statusbar">
        <span>{statusMessage}</span>
        <span>
          {filteredQuestions.length !== questions.length 
            ? `Hiển thị ${filteredQuestions.length}/${questions.length} câu hỏi` 
            : `${questions.length} câu hỏi`}
        </span>
      </footer>

      {isExportOpen && (
        <ExportDialog 
          isOpen={isExportOpen} 
          onClose={() => setIsExportOpen(false)} 
          questions={questions} 
          filteredQuestions={filteredQuestions} 
        />
      )}

      {isAppsScriptOpen && (
        <AppsScriptDialog 
          isOpen={isAppsScriptOpen} 
          onClose={() => setIsAppsScriptOpen(false)} 
        />
      )}
    </div>
  )
}

export default App
