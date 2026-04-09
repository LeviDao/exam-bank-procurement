import React, { useMemo } from 'react'
import { Filter, Tags, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'

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
    <aside className="flex flex-col w-64 h-full bg-slate-50 border-r border-slate-200 shadow-sm shrink-0">
      
      {/* Header Section */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-primary-600" /> Bộ lọc Tag
        </h3>
        
        {allTags.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs font-semibold text-slate-500 uppercase">Chế độ kết hợp</span>
            <button 
              onClick={() => setFilterMode(filterMode === 'AND' ? 'OR' : 'AND')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border
                ${filterMode === 'AND' 
                  ? 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 hover:border-primary-300' 
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
            >
              {filterMode === 'AND' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {filterMode}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        {/* Edge Case Alert */}
        {isAndZeroResults && (
          <div className="flex flex-col gap-3 p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <p className="flex items-start gap-2 text-xs font-semibold text-red-700 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              Không có câu hỏi nào chứa TẤT CẢ các tags này cùng lúc.
            </p>
            <button 
              onClick={() => setFilterMode('OR')}
              className="w-full py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-sm"
            >
              Chuyển sang lọc OR
            </button>
          </div>
        )}

        {/* Tags List */}
        <div>
          <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase mb-3 px-1">
            <Tags className="w-3.5 h-3.5" /> Danh sách Tags
          </h4>
          
          <div className="flex flex-col gap-1.5">
            {allTags.length === 0 ? (
              <p className="text-sm italic text-slate-400 px-1">Chưa có tag nào trong kho.</p>
            ) : (
              allTags.map(tag => (
                <label 
                  key={tag} 
                  className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors border
                    ${selectedTags.includes(tag) 
                      ? 'bg-primary-50/50 border-primary-200/60' 
                      : 'bg-transparent border-transparent hover:bg-slate-200/50'
                    }`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <span className={`text-sm select-none break-all ${selectedTags.includes(tag) ? 'text-primary-900 font-medium' : 'text-slate-700'}`}>
                    {tag}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

      </div>
    </aside>
  )
}
