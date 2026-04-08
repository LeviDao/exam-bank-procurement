import React from 'react';
import { Filter } from 'lucide-react';

interface TagsSidebarProps {
  allTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export function TagsSidebar({ allTags, selectedTags, onChange }: TagsSidebarProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    onChange([]);
  };

  return (
    <div className="w-64 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <Filter size={16} /> Lọc Tags (AND)
        </h2>
        {selectedTags.length > 0 && (
          <button 
            onClick={clearFilters}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Bỏ lọc
          </button>
        )}
      </div>
      
      {allTags.length === 0 ? (
        <p className="text-sm text-neutral-500 italic">Không có tag nào trong dữ liệu.</p>
      ) : (
        <div className="space-y-2">
          {allTags.map(tag => (
            <label key={tag} className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer block hover:bg-neutral-800 p-1.5 rounded-md -mx-1.5 transition-colors">
              <input 
                type="checkbox"
                className="rounded border-neutral-600 bg-neutral-800 focus:ring-1 focus:ring-blue-500 checked:bg-blue-500 cursor-pointer"
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
              />
              <span className="truncate" title={tag}>{tag}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
