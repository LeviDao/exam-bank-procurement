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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Mã Google Apps Script</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 text-sm text-neutral-300">
          <p className="mb-3">
            Sử dụng mã dưới đây cho menu <strong>Tiện ích mở rộng {'>'} Apps Script</strong> trong Google Sheets chứa dữ liệu bạn vừa xuất ra định dạng CSV.
          </p>
          <div className="relative group">
            <div className="absolute right-2 top-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs border border-neutral-700 transition"
              >
                {copied ? <><Check size={14} className="text-emerald-500" /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <pre className="bg-neutral-950 p-4 rounded-md overflow-x-auto border border-neutral-800 text-xs font-mono text-emerald-400">
              {scriptContent}
            </pre>
          </div>
        </div>
        
        <div className="p-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
