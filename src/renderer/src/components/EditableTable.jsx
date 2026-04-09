import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

const EditableCell = ({ getValue, row: { index }, column: { id }, table }) => {
  const initialValue = getValue()
  const [value, setValue] = useState(initialValue)

  // Sync internal state when data changes externally
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const { updateData, duplicateStts } = table.options.meta

  const onBlur = () => {
    let finalValue = value
    // Normalize tags on blur (PRD 4.1): replace spaces with underscore
    if (id === 'tags' && typeof value === 'string') {
      finalValue = value.split(',').map(t => t.trim().replace(/\s+/g, '_')).filter(Boolean).join(', ')
      setValue(finalValue)
    }

    // Only update if value changed
    if (finalValue !== initialValue) {
      updateData(index, id, finalValue)
    }
  }

  // Answer auto-uppercase
  const onChange = (e) => {
    let val = e.target.value
    if (id === 'answer') {
      val = val.toUpperCase()
    }
    setValue(val)
  }

  // Duplicate STT check
  const isDuplicateStt = id === 'stt' && duplicateStts?.has(String(value).trim())
  
  // Base Input Classes
  const baseClasses = "w-full max-w-full px-3 py-2 text-sm border rounded-md outline-none transition-shadow bg-white "
  const normalClasses = "border-slate-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-slate-400 "
  const errorClasses = "border-red-500 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500/30 font-medium "

  // Handle options format (Array of strings)
  if (id === 'options') {
    const textValue = Array.isArray(value) ? value.join('\n') : value || ''
    
    const onOptionsChange = (e) => {
      setValue(e.target.value)
    }
    
    const onOptionsBlur = () => {
      // Split by newline and remove empty lines to form the array format
      const newOptions = typeof value === 'string' 
         ? value.split('\n').map(s => s.trim()).filter(Boolean)
         : value
         
      updateData(index, id, newOptions)
    }

    return (
      <textarea 
        value={textValue} 
        onChange={onOptionsChange} 
        onBlur={onOptionsBlur}
        rows={6}
        className={baseClasses + normalClasses + "resize-y font-mono text-xs leading-relaxed"}
        placeholder="Mỗi phương án một dòng (Vị trí dòng số 1 mặc định là A, số 2 là B...)"
      />
    )
  }

  return (
    <div className="relative w-full">
      <input
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        className={baseClasses + (isDuplicateStt ? errorClasses : normalClasses)}
        title={isDuplicateStt ? 'STT bị trùng lặp!' : ''}
        placeholder={id === 'answer' ? 'A,B,C...' : ''}
      />
      {isDuplicateStt && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-sm pointer-events-none" title="STT Trùng lặp">
          ⚠️
        </span>
      )}
    </div>
  )
}

const defaultColumn = {
  cell: EditableCell,
}

export function EditableTable({ data, onUpdateRow }) {
  const tableContainerRef = useRef(null)

  // Compute duplicate STTs to pass into table meta for validation
  const duplicateStts = useMemo(() => {
    const counts = {}
    data.forEach(row => {
      if (row.stt === undefined || row.stt === null) return
      const stt = String(row.stt).trim()
      if (stt) {
        counts[stt] = (counts[stt] || 0) + 1
      }
    })
    const duplicates = new Set()
    for (const key in counts) {
      if (counts[key] > 1) duplicates.add(key)
    }
    return duplicates
  }, [data])

  const columns = useMemo(() => [
    { accessorKey: 'stt', header: 'STT', size: 70 },
    { accessorKey: 'content', header: 'Hỏi', size: 300 },
    { accessorKey: 'options', header: 'Các phương án (Enter để xuống dòng)', size: 450 },
    { accessorKey: 'answer', header: 'Đáp án', size: 90 },
    { accessorKey: 'tags', header: 'Tags lọc', size: 180 },
  ], [])

  // Delegate update to parent (which handles mapping to source array)
  const updateData = (rowIndex, columnId, value) => {
    onUpdateRow(rowIndex, columnId, value)
  }

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
      duplicateStts
    }
  })

  const { rows } = table.getRowModel()

  // Virtualizer for smooth scrolling with many rows (e.g., 500 rows)
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 140, // Approximate row height with padding + textarea
    overscan: 10,
  })

  // Debug Data requested in PRD/Prompt
  const handleDebugData = () => {
    console.log("=== THÔNG TIN STATE DATA CỦA BẢNG (JSON) ===")
    console.log(JSON.stringify(data, null, 2))
    alert("Đã in dữ liệu ra trình biên dịch / Developer Tools Console! Bạn có thể nhấn Ctrl+Shift+I để xem mảng Phương án.")
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Table Debug Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200">
        <button 
          onClick={handleDebugData} 
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-300 rounded hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm bg-white"
        >
          🐛 Debug Data
        </button>
        <span className="text-xs text-slate-500">Bật Developer Tools (Ctrl+Shift+I) để giám sát cấu trúc JSON theo thời gian thực.</span>
      </div>

      {/* Main Table Virtual Area */}
      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto relative bg-slate-50"
      >
        <table className="w-full border-collapse table-fixed text-left bg-white">
          <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm border-b-2 border-slate-200">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="p-3 text-sm font-semibold text-slate-700 border-r border-slate-200 last:border-r-0 select-none whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`, // full virtualized height
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index]
              return (
                <tr
                  key={row.id}
                  className="group hover:bg-primary-50/50 transition-colors"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="p-2 border-b border-r border-slate-200 align-top last:border-r-0"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
