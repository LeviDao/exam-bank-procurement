import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { QuestionItem, AnswerOption } from '../types';
import { Edit3, X } from 'lucide-react';

interface QuestionTableProps {
  data: QuestionItem[];
  onChange: (newData: QuestionItem[]) => void;
}

export function QuestionTable({ data, onChange }: QuestionTableProps) {
  const [editingOptionsFor, setEditingOptionsFor] = useState<string | null>(null);

  const updateField = (id: string, field: keyof QuestionItem, value: any) => {
    onChange(data.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const columns: ColumnDef<QuestionItem>[] = [
    {
      accessorKey: 'stt',
      header: 'STT',
      cell: ({ row, getValue }) => (
        <input
          className="w-12 bg-transparent outline-none border-b border-transparent focus:border-blue-500 py-1"
          value={getValue() as string}
          onChange={(e) => updateField(row.original.id, 'stt', e.target.value)}
        />
      ),
      size: 60,
    },
    {
      accessorKey: 'content',
      header: 'Nội dung',
      cell: ({ row, getValue }) => (
        <textarea
          className="w-full bg-transparent outline-none border-b border-transparent focus:border-blue-500 resize-none min-h-[40px] py-1"
          value={getValue() as string}
          onChange={(e) => updateField(row.original.id, 'content', e.target.value)}
          rows={2}
        />
      ),
    },
    {
      id: 'options',
      header: 'Phương án trả lời',
      cell: ({ row }) => {
        const hasOptions = row.original.options.some(o => o.trim() !== '');
        return (
          <button
            onClick={() => setEditingOptionsFor(row.original.id)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 w-full text-left py-2"
          >
            <Edit3 size={14} />
            {hasOptions ? 'Xem / Sửa (4)' : 'Nhập phương án'}
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
        // Basic validation: answer must point to a non-empty option
        const validOptions: AnswerOption[] = ['A', 'B', 'C', 'D'];
        let hasError = false;
        if (val) {
          const idx = validOptions.indexOf(val);
          if (idx === -1 || !row.original.options[idx]) {
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
      header: 'Tags (Cách nhau dấu cách)',
      cell: ({ row, getValue }) => (
        <input
          className="w-full bg-transparent outline-none border-b border-transparent focus:border-blue-500 py-1 text-sm font-mono text-emerald-400"
          value={(getValue() as string[]).join(' ')}
          onChange={(e) => updateField(row.original.id, 'tags', e.target.value.split(' ').map(t => t.trim()).filter(Boolean))}
          placeholder="#toan #lop12"
        />
      ),
      size: 180,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const editingQuestion = data.find(q => q.id === editingOptionsFor);

  return (
    <div className="flex-1 overflow-auto bg-neutral-950 p-4">
      {data.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-neutral-500">
          <p>Chưa có dữ liệu. Vui lòng tạo mới hoặc nhập từ Markdown.</p>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900 shadow-sm">
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
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
              {['A', 'B', 'C', 'D'].map((lbl, idx) => (
                <div key={lbl} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-neutral-400">{lbl}.</label>
                  <textarea
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-sm text-white focus:border-blue-500 outline-none resize-none"
                    rows={2}
                    value={editingQuestion.options[idx]}
                    onChange={(e) => {
                      const newOpts = [...editingQuestion.options] as [string, string, string, string];
                      newOpts[idx] = e.target.value;
                      updateField(editingQuestion.id, 'options', newOpts);
                    }}
                  />
                </div>
              ))}
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
