import React, { useState } from 'react';
import { X, FileSpreadsheet, FileDown } from 'lucide-react';
import type { QuestionItem } from '../types';

interface ExportModalProps {
  onClose: () => void;
  onExportCsv: (rangeString?: string) => void;
  onExportMd: (rangeString?: string) => void;
}

export function ExportModal({ onClose, onExportCsv, onExportMd }: ExportModalProps) {
  const [exportType, setExportType] = useState<'all' | 'range'>('all');
  const [rangeInput, setRangeInput] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Xuất Dữ Liệu</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="exportType" 
              value="all" 
              checked={exportType === 'all'} 
              onChange={() => setExportType('all')}
              className="mt-0.5 focus:ring-blue-500 bg-neutral-800 border-neutral-600"
            />
            <span className="text-neutral-200">Tiêu chuẩn (Gồm các câu hỏi đang lọc)</span>
          </label>
          
          <label className="flex items-start gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="exportType" 
              value="range" 
              checked={exportType === 'range'} 
              onChange={() => setExportType('range')}
              className="mt-1 focus:ring-blue-500 bg-neutral-800 border-neutral-600"
            />
            <div className="flex-1">
              <span className="text-neutral-200 block mb-1">Xuất theo dải số thứ tự (STT)</span>
              <input
                type="text"
                placeholder="VD: 1-50, 75, 80"
                disabled={exportType !== 'range'}
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-sm text-white focus:border-blue-500 outline-none disabled:opacity-50"
              />
              <p className="text-neutral-500 text-xs mt-1">Chỉ sử dụng số, dấu gạch ngang (-) và dấu phẩy (,)</p>
            </div>
          </label>
        </div>
        
        <div className="p-4 border-t border-neutral-800 flex gap-2 justify-end bg-neutral-900/50">
          <button
            onClick={() => onExportMd(exportType === 'range' ? rangeInput : undefined)}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <FileDown size={16} /> Xuất MD
          </button>
          <button
            onClick={() => onExportCsv(exportType === 'range' ? rangeInput : undefined)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors"
          >
            <FileSpreadsheet size={16} /> Xuất CSV
          </button>
        </div>
      </div>
    </div>
  );
}
