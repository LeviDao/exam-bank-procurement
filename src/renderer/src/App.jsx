import { EditableTable } from './components/EditableTable'
import { useFileOperations } from './hooks/useFileOperations'

function App() {
  const {
    questions,
    updateQuestions,
    statusMessage,
    handleOpen,
    handleSave,
  } = useFileOperations()

  return (
    <div className="app-layout">
      {/* Toolbar */}
      <header className="toolbar">
        <div className="toolbar-group">
          <button className="toolbar-btn" title="Mới (Ctrl+N)">📄+</button>
          <button className="toolbar-btn" onClick={handleOpen} title="Mở (Ctrl+O)">📂</button>
          <button className="toolbar-btn toolbar-btn--save" onClick={handleSave} title="Lưu (Ctrl+S)">💾</button>
        </div>
        <div className="toolbar-group">
          <button className="toolbar-btn" title="Xuất">⬇️ Xuất</button>
          <button className="toolbar-btn" title="Lấy mã Apps Script">🤖 Apps Script</button>
        </div>
        <div className="toolbar-group">
          <button className="toolbar-btn toolbar-btn--add" title="Thêm câu hỏi (Ctrl+Ins)">➕ Thêm</button>
          <button className="toolbar-btn toolbar-btn--delete" title="Xóa câu hỏi (Del)" disabled>🗑️ Xóa</button>
        </div>
      </header>

      {/* Main content area */}
      <div className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3 className="sidebar-title">Bộ lọc Tag</h3>
          <div className="sidebar-controls">
            <span className="sidebar-mode">OR</span>
          </div>
          <p className="sidebar-empty">Chưa có dữ liệu</p>
        </aside>

        {/* Table area */}
        <main className="table-container">
          {questions.length === 0 ? (
            <div className="table-empty">
              <p>📋 Chưa có câu hỏi nào.</p>
              <p>Nhấn <strong>Ctrl+O</strong> để mở file hoặc <strong>Ctrl+Ins</strong> để thêm câu hỏi mới.</p>
            </div>
          ) : (
            <EditableTable data={questions} setData={updateQuestions} />
          )}
        </main>
      </div>

      {/* Status bar */}
      <footer className="statusbar">
        <span>{statusMessage}</span>
        <span>{questions.length} câu hỏi</span>
      </footer>
    </div>
  )
}

export default App
