import React from 'react';
import { SearchResult } from '../../types';
import { FileText, Bookmark, ExternalLink } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  query?: string;
  onOpenPdfAtPage: (paperId: string, pageNumber: number) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onOpenPdfAtPage,
}) => {
  if (results.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <p className="text-sm">No passages found matching your query or similarity threshold.</p>
        <p className="text-xs text-slate-400 mt-1">Try lowering the minimum similarity threshold or using alternative keywords.</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.70) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
    if (score >= 0.50) return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60';
    return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Found {results.length} relevant passages</span>
        <span>Ranked by dense cosine similarity</span>
      </div>

      <div className="space-y-3">
        {results.map((res, index) => {
          const pct = Math.round(res.similarity_score * 100);
          return (
            <div
              key={res.chunk_id || index}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 space-y-3 transition shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-400 font-semibold">#{index + 1}</span>
                    <h4 className="font-semibold text-slate-200 text-sm">
                      {res.paper_title}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Bookmark className="w-3 h-3 text-slate-400" />
                      <span>{res.section_name || 'General'}</span>
                    </span>
                    <span>•</span>
                    <span>Page {res.page_number}</span>
                  </div>
                </div>

                {/* Score Badge */}
                <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${getScoreColor(res.similarity_score)}`}>
                  {pct}% Match
                </div>
              </div>

              {/* Content Passage */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans">
                {res.content}
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onOpenPdfAtPage(res.paper_id, res.page_number)}
                  className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View in PDF (Page {res.page_number})</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
