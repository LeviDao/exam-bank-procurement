import { FileUp, FileSpreadsheet, Code, Save } from 'lucide-react';

interface ToolbarProps {
  onImportMd: () => void;
  onExportAction: () => void;
  onGenerateGas: () => void;
  onSave: () => void;
  isDirty: boolean;
}

export function Toolbar({ onImportMd, onExportAction, onGenerateGas, onSave, isDirty }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
      <div className="flex gap-2">
        <button
          onClick={onImportMd}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors"
        >
          <FileUp size={16} /> Import bộ đề MD
        </button>
        <button
          onClick={onSave}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isDirty ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-400 cursor-not-allowed'}`}
          disabled={!isDirty}
        >
          <Save size={16} /> Lưu (Ctrl+S) {isDirty && '*'}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onGenerateGas}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
        >
          <Code size={16} /> Copy GS Mã
        </button>
        <button
          onClick={onExportAction}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors"
        >
          <FileSpreadsheet size={16} /> Xuất Dữ Liệu
        </button>
      </div>
    </div>
  );
}
