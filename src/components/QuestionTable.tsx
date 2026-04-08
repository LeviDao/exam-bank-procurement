import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import type { QuestionItem, AnswerOption } from '../types';
import { Edit3, X, Trash2, Plus } from 'lucide-react';

interface QuestionTableProps {
  data: QuestionItem[];
  onChange: (newData: QuestionItem[]) => void;
}

export function QuestionTable({ data, onChange }: QuestionTableProps) {
  const [editingOptionsFor, setEditingOptionsFor] = useState<string | null>(null);

  const updateField = (id: string, field: keyof QuestionItem, value: any) => {
    onChange(data.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const deleteRow = (id: string) => {
    onChange(data.filter(q => q.id !== id));
  };

  const addRow = () => {
    const newId = Math.random().toString(36).substring(2, 10);
    // STT logic: Try to auto increment based on last generic number
    let nextStt = '1';
    if (data.length > 0) {
      const lastStt = parseInt(data[data.length - 1].stt, 10);
      if (!isNaN(lastStt)) nextStt = (lastStt + 1).toString();
    }
    
    onChange([...data, {
      id: newId,
      stt: nextStt,
      content: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      tags: []
    }]);
  };

  const columns: ColumnDef<QuestionItem>[] = [
    {
      accessorKey: 'stt',
      header: 'STT',
      cell: ({ row, getValue }) => {
        const val = getValue() as string;
        const isNum = /^\d+$/.test(val);
        return (
          <input
            className={`w-12 bg-transparent outline-none border-b py-1 ${!isNum && val !== '' ? 'border-red-500 text-red-400' : 'border-transparent focus:border-blue-500'}`}
            value={val}
            placeholder="Số"
            onChange={(e) => {
              // Allow typing but show error if not number (Number only requirement)
              const v = e.target.value.replace(/[^0-9]/g, '');
              updateField(row.original.id, 'stt', v);
            }}
          />
        );
      },
      size: 60,
    },
    {
      accessorKey: 'content',
      header: 'Nội dung',
      cell: ({ row, getValue }) => {
        const val = (getValue() as string).trim();
        const hasError = val === '';
        return (
          <textarea
            className={`w-full bg-transparent outline-none border resize-none min-h-[40px] py-1 px-1 rounded ${hasError ? 'border-red-500/50 bg-red-500/10' : 'border-transparent focus:border-blue-500'}`}
            value={getValue() as string}
            placeholder="Nội dung câu hỏi..."
            onChange={(e) => updateField(row.original.id, 'content', e.target.value)}
            rows={2}
          />
        );
      },
    },
    {
      id: 'options',
      header: 'Phương án trả lời',
      cell: ({ row }) => {
        const filledOptionsCount = row.original.options.filter(o => o.trim() !== '').length;
        const hasError = filledOptionsCount < 2; // Needs at least 2 options for multiple choice
        return (
          <button
            onClick={() => setEditingOptionsFor(row.original.id)}
            className={`flex items-center gap-2 text-sm w-full text-left py-2 px-2 rounded border ${hasError ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-transparent text-blue-400 hover:text-blue-300'}`}
          >
            <Edit3 size={14} />
            {filledOptionsCount > 0 ? `Xem / Sửa (${filledOptionsCount})` : 'Nhập phương án!'}
          </button>
        );
      },
      size: 150,
    },
    {
      accessorKey: 'correctAnswer',
      header: 'Đáp án',
      cell: ({ row, getValue }) => {
        const val = getValue() as AnswerOption;
        let hasError = false;
        if (!val) {
          hasError = true; // Required
        } else {
          const validOptions: AnswerOption[] = ['A', 'B', 'C', 'D'];
          const idx = validOptions.indexOf(val);
          if (idx === -1 || !row.original.options[idx] || row.original.options[idx].trim() === '') {
            hasError = true;
          }
        }
        
        return (
          <select
            className={`bg-neutral-800 border ${hasError ? 'border-red-500 text-red-400' : 'border-neutral-700 text-white'} rounded px-2 py-1 outline-none focus:border-blue-500`}
            value={val}
            onChange={(e) => updateField(row.original.id, 'correctAnswer', e.target.value as AnswerOption)}
          >
            <option value="">-Chọn-</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        );
      },
      size: 100,
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row, getValue }) => (
        <input
          className="w-full bg-transparent outline-none border-b border-transparent focus:border-blue-500 py-1 text-sm font-mono text-emerald-400"
          value={(getValue() as string[]).join(' ')}
          onChange={(e) => updateField(row.original.id, 'tags', e.target.value.split(' ').map(t => t.trim()).filter(Boolean))}
          placeholder="#tag1 #tag2"
        />
      ),
      size: 140,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => deleteRow(row.original.id)}
          className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors rounded hover:bg-neutral-800"
          title="Xóa câu hỏi"
        >
          <Trash2 size={16} />
        </button>
      ),
      size: 40,
    }
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const editingQuestion = data.find(q => q.id === editingOptionsFor);

  return (
    <div className="flex-1 overflow-auto bg-neutral-950 p-4 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900 shadow-sm mb-4">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-neutral-800 text-neutral-400 font-medium uppercase text-xs">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="p-3 border-b border-neutral-700" style={{ width: header.getSize() }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-neutral-500">
                    Chưa có dự liệu. Vui lòng thêm câu hỏi mới.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-3 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Nút thêm câu hỏi (CRUD) */}
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-blue-400 hover:text-blue-300 rounded-lg text-sm font-medium transition-colors w-full justify-center border border-dashed border-neutral-700"
        >
          <Plus size={16} /> Thêm câu hỏi thiết lập thủ công
        </button>
      </div>

      {/* Options Editing Modal */}
      {editingOptionsFor && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h2 className="text-lg font-semibold text-white">Sửa 4 Phương án</h2>
              <button onClick={() => setEditingOptionsFor(null)} className="text-neutral-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {['A', 'B', 'C', 'D'].map((lbl, idx) => {
                const val = editingQuestion.options[idx];
                const isCorrect = editingQuestion.correctAnswer === lbl;
                return (
                  <div key={lbl} className="flex flex-col gap-1 relative">
                    <label className={`text-sm font-medium ${isCorrect ? 'text-emerald-400' : 'text-neutral-400'} flex justify-between`}>
                      <span>{lbl}. {isCorrect && '(Đáp án đúng)'}</span>
                    </label>
                    <textarea
                      className={`w-full bg-neutral-950 border ${isCorrect ? 'border-emerald-500/50' : 'border-neutral-700'} rounded-md p-2 text-sm text-white focus:border-blue-500 outline-none resize-none`}
                      rows={2}
                      value={val}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options] as [string, string, string, string];
                        newOpts[idx] = e.target.value;
                        updateField(editingQuestion.id, 'options', newOpts);
                      }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="p-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setEditingOptionsFor(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
