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
        style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
      />
    )
  }

  // Duplicate STT check
  const isDuplicateStt = id === 'stt' && duplicateStts?.has(String(value).trim())

  let cellStyle = { width: '100%', boxSizing: 'border-box', padding: '4px' }
  if (isDuplicateStt) {
    cellStyle.borderColor = 'red'
    cellStyle.backgroundColor = '#ffe6e6'
    cellStyle.color = 'red'
  }

  return (
    <input
      value={value || ''}
      onChange={onChange}
      onBlur={onBlur}
      style={cellStyle}
      title={isDuplicateStt ? 'STT bị trùng lặp!' : ''}
    />
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
    { accessorKey: 'stt', header: 'STT', size: 60 },
    { accessorKey: 'content', header: 'Câu hỏi', size: 400 },
    { accessorKey: 'options', header: 'Các phương án', size: 500 },
    { accessorKey: 'answer', header: 'Đáp án', size: 80 },
    { accessorKey: 'tags', header: 'Tags', size: 150 },
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
    estimateSize: () => 120, // Approximate row height with a 6-row textarea
    overscan: 10,
  })

  // Debug Data requested in PRD/Prompt
  const handleDebugData = () => {
    console.log("=== THÔNG TIN STATE DATA CỦA BẢNG (JSON) ===")
    console.log(JSON.stringify(data, null, 2))
    alert("Đã in dữ liệu ra trình biên dịch / Developer Tools Console! Bạn có thể nhấn Ctrl+Shift+I để xem mảng Phương án.")
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '8px', background: '#eef2f5', borderBottom: '1px solid #ddd', display: 'flex', gap: '10px' }}>
        <button onClick={handleDebugData} style={{ padding: '4px 12px', cursor: 'pointer', background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}>
          🐛 Debug Data
        </button>
        <span style={{ fontSize: '13px', color: '#666', lineHeight: '24px' }}>Bật Developer Tools (Ctrl+Shift+I) để xem log JSON.</span>
      </div>

      <div
        ref={tableContainerRef}
        className="table-scroll-container"
        style={{
          flex: 1, // take remaining height
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8f9fa' }}>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{
                      width: header.getSize(),
                      padding: '10px 8px',
                      borderBottom: '2px solid #ccc',
                      borderRight: '1px solid #eee',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
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
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    borderBottom: '1px solid #eee'
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '4px 8px',
                        borderRight: '1px solid #eee',
                        width: cell.column.getSize(),
                        verticalAlign: 'top'
                      }}
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
