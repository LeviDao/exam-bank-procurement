import React from 'react'
import { FilePlus, FolderOpen, Save, Download, TerminalSquare, PlusCircle, Trash2 } from 'lucide-react'

export function Toolbar({
  onNew,
  onOpen,
  onSave,
  onExportClick,
  onAppsScriptClick,
  onAddRow,
  onDeleteRow,
  hasValidationError
}) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm shrink-0">
      
      {/* File Operations */}
      <div className="flex items-center gap-2">
        <button onClick={onNew} title="Mới (Ctrl+N)" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-primary-600 transition-colors shadow-sm">
          <FilePlus className="w-4 h-4" /> Mới
        </button>
        <button onClick={onOpen} title="Mở (Ctrl+O)" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-primary-600 transition-colors shadow-sm">
          <FolderOpen className="w-4 h-4" /> Mở
        </button>
        <button onClick={onSave} title="Lưu (Ctrl+S)" className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 hover:border-primary-300 transition-colors shadow-sm">
          <Save className="w-4 h-4" /> Lưu
        </button>
      </div>
      
      {/* Export / Sync */}
      <div className="flex items-center gap-2 border-l border-slate-200 pl-6 ml-2">
        <div className="relative group">
          <button 
            onClick={onExportClick} 
            disabled={hasValidationError}
            className={`flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md shadow-sm transition-all
              ${hasValidationError 
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-primary-600 hover:border-primary-300'
              }`}
          >
            <Download className="w-4 h-4" /> Xuất File
          </button>
          
          {hasValidationError && (
             <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 px-3 py-2 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-[100]">
               ⚠️ Chưa thể xuất file. Phát hiện STT bị trùng, hoặc có câu hỏi thiếu đáp án. Vui lòng sửa lại bảng dữ liệu.
               <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
             </div>
          )}
        </div>

        <button onClick={onAppsScriptClick} title="Lấy mã Apps Script" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-sm">
          <TerminalSquare className="w-4 h-4" /> Apps Script
        </button>
      </div>

      {/* Row Operations */}
      <div className="flex items-center gap-2 border-l border-slate-200 pl-6 ml-2">
        <button onClick={onAddRow} title="Thêm câu hỏi (Ctrl+Ins)" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-primary-600 transition-colors shadow-sm">
          <PlusCircle className="w-4 h-4" /> Thêm
        </button>
        <button onClick={onDeleteRow} title="Xóa câu hỏi (Del)" disabled className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-md cursor-not-allowed shadow-none">
          <Trash2 className="w-4 h-4" /> Xóa
        </button>
      </div>
    </header>
  )
}
