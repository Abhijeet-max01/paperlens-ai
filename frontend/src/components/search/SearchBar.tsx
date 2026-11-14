import React, { useState } from 'react';
import { Paper } from '../../types';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface SearchBarProps {
  papers: Paper[];
  onSearch: (query: string, topK: number, minSimilarity: number, selectedPaperIds: string[]) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  papers,
  onSearch,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(5);
  const [minSimilarity, setMinSimilarity] = useState(0.35);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const paperIds = selectedPaperId !== 'all' ? [selectedPaperId] : [];
    onSearch(query.trim(), topK, minSimilarity, paperIds);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search passages semantically (e.g., 'attention memory complexity', 'learning rate schedule', 'BLEU evaluation')..."
            className="w-full pl-11 pr-24 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
          <div className="absolute right-3 flex items-center space-x-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg border transition ${
                showFilters
                  ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle search filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm disabled:opacity-50 transition shadow-md shadow-indigo-600/30"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Paper Filter */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Scope to Paper</label>
              <select
                value={selectedPaperId}
                onChange={(e) => setSelectedPaperId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Indexed Papers ({papers.length})</option>
                {papers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.filename}
                  </option>
                ))}
              </select>
            </div>

            {/* Top-K Results */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Top Passages: <span className="text-indigo-400 font-semibold">{topK}</span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>

            {/* Min Similarity Slider */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Min Similarity: <span className="text-indigo-400 font-semibold">{minSimilarity.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0.10}
                max={0.90}
                step={0.05}
                value={minSimilarity}
                onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.10 (Broad)</span>
                <span>0.50</span>
                <span>0.90 (Strict)</span>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
