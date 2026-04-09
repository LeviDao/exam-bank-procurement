import React, { useState } from 'react'
import { serializeMarkdown } from '../utils/markdownParser'
import { exportCSV } from '../utils/csvExporter'

export function ExportDialog({ isOpen, onClose, questions, filteredQuestions }) {
  const [exportScope, setExportScope] = useState('ALL') // ALL | FILTERED | BY_STT
  const [exportFormat, setExportFormat] = useState('md') // md | csv
  const [selectedSTTs, setSelectedSTTs] = useState(new Set())

  if (!isOpen) return null

  // Deduplicate stts to show in multi-select (just in case they were duplicated, although ideally validation stops export if so)
  const uniqueSTTs = Array.from(new Set(questions.map(q => String(q.stt).trim()).filter(Boolean))).sort((a,b) => parseInt(a) - parseInt(b))

  const handleConfirm = async () => {
    let dataToExport = []
    if (exportScope === 'ALL') {
      dataToExport = questions
    } else if (exportScope === 'FILTERED') {
      dataToExport = filteredQuestions
    } else if (exportScope === 'BY_STT') {
      dataToExport = questions.filter(q => selectedSTTs.has(String(q.stt).trim()))
    }

    if (dataToExport.length === 0) {
      alert("Không có dữ liệu để xuất!")
      return
    }

    const content = exportFormat === 'md' ? serializeMarkdown(dataToExport) : exportCSV(dataToExport)
    const success = await window.electronAPI?.saveFileAs({
      content,
      defaultPath: `export_data.${exportFormat}`
    })

    if (success) {
      onClose()
    }
  }

  const handleToggleSTT = (stt, checked) => {
    const newSet = new Set(selectedSTTs)
    if (checked) newSet.add(stt)
    else newSet.delete(stt)
    setSelectedSTTs(newSet)
  }

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Xuất Dữ Liệu</h2>

        <div style={sectionStyle}>
          <label style={labelStyle}>Phạm vi xuất:</label>
          <div style={radioGroupStyle}>
            <label><input type="radio" value="ALL" checked={exportScope === 'ALL'} onChange={() => setExportScope('ALL')} /> Toàn bộ bộ đề ({questions.length})</label>
            <label><input type="radio" value="FILTERED" checked={exportScope === 'FILTERED'} onChange={() => setExportScope('FILTERED')} /> Theo bộ lọc hiện tại ({filteredQuestions.length})</label>
            <label><input type="radio" value="BY_STT" checked={exportScope === 'BY_STT'} onChange={() => setExportScope('BY_STT')} /> Tự chọn STT ({(selectedSTTs.size)})</label>
          </div>
        </div>

        {exportScope === 'BY_STT' && (
           <div style={multiSelectStyle}>
              {uniqueSTTs.length === 0 && <span style={{ color: '#888' }}>Không có STT nào</span>}
              {uniqueSTTs.map(stt => (
                <label key={stt} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedSTTs.has(stt)} 
                    onChange={(e) => handleToggleSTT(stt, e.target.checked)} 
                  />
                  <span>Câu {stt}</span>
                </label>
              ))}
           </div>
        )}

        <div style={sectionStyle}>
          <label style={labelStyle}>Định dạng xuất (Format):</label>
          <div style={radioGroupStyle}>
             <label><input type="radio" value="md" checked={exportFormat === 'md'} onChange={() => setExportFormat('md')} /> Markdown (.md) (Dùng cho G-Docs/Apps Script)</label>
             <label><input type="radio" value="csv" checked={exportFormat === 'csv'} onChange={() => setExportFormat('csv')} /> CSV (.csv) (Dùng cho Excel)</label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
           <button onClick={onClose} style={cancelBtnStyle}>Hủy</button>
           <button onClick={handleConfirm} style={confirmBtnStyle}>Xác nhận xuất</button>
        </div>
      </div>
    </div>
  )
}

// Inline Styles for pure React functionality
const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const dialogStyle = {
  background: '#fff',
  width: '500px',
  padding: '24px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}

const labelStyle = {
  fontWeight: 600,
  fontSize: '15px',
  color: '#333'
}

const radioGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginLeft: '8px',
  fontSize: '14px'
}

const multiSelectStyle = {
  maxHeight: '150px',
  overflowY: 'auto',
  border: '1px solid #d9d9d9',
  borderRadius: '4px',
  padding: '10px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
  gap: '8px',
  background: '#fafafa'
}

const cancelBtnStyle = {
  padding: '6px 16px',
  background: '#fff',
  border: '1px solid #ccc',
  borderRadius: '4px',
  cursor: 'pointer'
}

const confirmBtnStyle = {
  padding: '6px 16px',
  background: '#096dd9',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600
}
