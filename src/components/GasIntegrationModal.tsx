import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { getGasScriptTemplate } from '../services/GasScriptGenerator';

interface GasIntegrationModalProps {
  onClose: () => void;
}

export function GasIntegrationModal({ onClose }: GasIntegrationModalProps) {
  const [copied, setCopied] = useState(false);
  const scriptContent = getGasScriptTemplate();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-full max-w-5xl flex flex-col h-full max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 shrink-0">
          <h2 className="text-lg font-semibold text-white">Tích hợp Google Apps Script</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left panel: 4 Steps instruction */}
          <div className="w-1/2 border-r border-neutral-800 p-6 overflow-y-auto bg-neutral-900/50">
            <h3 className="text-base font-medium text-emerald-400 mb-4">Các bước tích hợp tự động tạo Form</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">1</div>
                <div>
                  <h4 className="font-medium text-neutral-200">Xuất CSV</h4>
                  <p className="text-sm text-neutral-400 mt-1">Xuất dữ liệu trên ứng dụng ra định dạng CSV và tải nó lên Google Drive, sau đó mở file bằng Google Sheets.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">2</div>
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-200">Mở Apps Script</h4>
                  <p className="text-sm text-neutral-400 mt-1 mb-2">Trên thanh menu Google Sheets, chọn <strong>Tiện ích mở rộng {'>'} Apps Script</strong>.</p>
                  {/* Placeholder cho Hình chụp */}
                  <div className="w-full h-32 bg-neutral-800 border border-dashed border-neutral-600 rounded flex items-center justify-center text-neutral-500 text-xs italic">
                    [Ảnh minh hoạ menu Apps Script]
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">3</div>
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-200">Dán Code</h4>
                  <p className="text-sm text-neutral-400 mt-1 mb-2">Copy đoạn code bên phải màn hình này và dán đè thay thế toàn bộ mã có sẵn trong dự án Script.</p>
                  <div className="w-full h-32 bg-neutral-800 border border-dashed border-neutral-600 rounded flex items-center justify-center text-neutral-500 text-xs italic">
                    [Ảnh minh hoạ giao diện Paste Code]
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0">4</div>
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-200">Chạy script</h4>
                  <p className="text-sm text-neutral-400 mt-1 mb-2">Bấm phím <strong>Lưu</strong>, tại trang Apps script ấn nút <strong>Chạy</strong> hàm <code>createGoogleFormFromCSV</code> để bắt đầu tạo form.</p>
                  <div className="w-full h-32 bg-neutral-800 border border-dashed border-neutral-600 rounded flex items-center justify-center text-neutral-500 text-xs italic">
                    [Ảnh minh hoạ nút Run Script]
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Code Block */}
          <div className="w-1/2 p-6 flex flex-col bg-neutral-950 overflow-hidden relative group">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h3 className="text-sm font-medium text-neutral-400">Code.gs</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs border border-neutral-700 transition"
              >
                {copied ? <><Check size={14} className="text-emerald-500" /> Đã Copy</> : <><Copy size={14} /> Copy Code</>}
              </button>
            </div>
            <div className="flex-1 overflow-hidden relative border border-neutral-800 rounded-md">
              <pre className="absolute inset-0 p-4 overflow-auto text-xs font-mono text-emerald-400/90 leading-relaxed scrollbar-thin">
                {scriptContent}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
