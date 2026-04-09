import React, { useMemo } from 'react'

export function Sidebar({ 
  questions, 
  selectedTags, 
  setSelectedTags, 
  filterMode, 
  setFilterMode,
  filteredCount
}) {
  // Aggregate all unique tags from the entire question bank
  const allTags = useMemo(() => {
    const tagSet = new Set()
    questions.forEach(q => {
      if (!q.tags) return
      q.tags.split(',').forEach(t => {
        const trimmed = t.trim()
        if (trimmed) tagSet.add(trimmed)
      })
    })
    return Array.from(tagSet).sort()
  }, [questions])

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  // PRD Edge Case: AND mode returns 0 results
  const isAndZeroResults = filterMode === 'AND' && selectedTags.length > 0 && filteredCount === 0

  return (
    <aside className="sidebar" style={{ 
      padding: '16px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', 
      width: '240px', 
      background: '#fcfcfc', 
      borderRight: '1px solid #e0e0e0', 
      overflowY: 'auto' 
    }}>
      <h3 className="sidebar-title" style={{ margin: 0, fontSize: '16px', color: '#333' }}>Bộ lọc Tag</h3>
      
      {allTags.length > 0 && (
        <div className="sidebar-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500, color: '#555' }}>Chế độ lọc:</label>
          <button 
            onClick={() => setFilterMode(filterMode === 'AND' ? 'OR' : 'AND')}
            style={{ 
              padding: '4px 10px', 
              borderRadius: '6px', 
              border: '1px solid #ccc', 
              cursor: 'pointer', 
              background: filterMode === 'AND' ? '#e6f7ff' : '#fff',
              fontWeight: 600,
              color: filterMode === 'AND' ? '#096dd9' : '#333',
              minWidth: '60px'
            }}
          >
            {filterMode}
          </button>
        </div>
      )}

      {/* Edge Case Alert */}
      {isAndZeroResults && (
        <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
          <p style={{ margin: '0 0 10px 0', color: '#cf1322', fontWeight: 500, lineHeight: '1.4' }}>
            Không có câu hỏi nào thỏa mãn đồng thời TẤT CẢ các tags đã chọn.
          </p>
          <button 
            onClick={() => setFilterMode('OR')}
            style={{ 
              width: '100%', 
              padding: '6px', 
              cursor: 'pointer', 
              background: '#ff4d4f', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '4px',
              fontWeight: 500
            }}
          >
            Chuyển sang lọc OR
          </button>
        </div>
      )}

      <div className="tags-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {allTags.length === 0 ? (
          <p className="sidebar-empty" style={{ fontSize: '13px', color: '#888', fontStyle: 'italic' }}>Chưa có dữ liệu tags</p>
        ) : (
          allTags.map(tag => (
            <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#444' }}>
              <input 
                type="checkbox" 
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
              />
              <span style={{flex: 1, wordBreak: 'break-all'}}>{tag}</span>
            </label>
          ))
        )}
      </div>
    </aside>
  )
}
