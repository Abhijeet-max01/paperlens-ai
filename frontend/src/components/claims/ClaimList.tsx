import React, { useState } from 'react';
import { Claim, Paper } from '../../types';
import { Badge } from '../common/Badge';
import { Sparkles, FileText } from 'lucide-react';

interface ClaimListProps {
  claims: Claim[];
  papers: Paper[];
  onOpenPdfAtPage: (paperId: string, pageNumber: number) => void;
}

export const ClaimList: React.FC<ClaimListProps> = ({
  claims,
  papers,
  onOpenPdfAtPage,
}) => {
  const [selectedPaperId, setSelectedPaperId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0.50);

  const filteredClaims = claims.filter((c) => {
    if (selectedPaperId !== 'all' && c.paper_id !== selectedPaperId) return false;
    if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
    if (c.confidence_score < minConfidence) return false;
    return true;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'QUANTITATIVE_FINDING':
        return <Badge variant="success">Quantitative Finding</Badge>;
      case 'METHODOLOGY':
        return <Badge variant="info">Methodology</Badge>;
      default:
        return <Badge variant="neutral">Finding</Badge>;
    }
  };

  return (
    <div className="space-y-5 selection:bg-forest-500/30">
      {/* Filters Bar */}
      <div className="bg-archival-900 border border-archival-750 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-forest-400" />
            <span className="font-editorial font-bold text-archival-100 text-base">
              Linguistically Extracted Scientific Claims
            </span>
          </div>
          <span className="text-xs text-archival-400 font-mono">
            Showing {filteredClaims.length} of {claims.length} claims
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-archival-800">
          {/* Paper filter */}
          <div>
            <label className="block text-archival-400 font-medium mb-1 font-mono">Filter by Paper</label>
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="w-full bg-archival-950 border border-archival-750 rounded-lg p-2 text-archival-200 focus:outline-none focus:border-forest-500"
            >
              <option value="all">All Papers ({papers.length})</option>
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.filename}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-archival-400 font-medium mb-1 font-mono">Claim Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-archival-950 border border-archival-750 rounded-lg p-2 text-archival-200 focus:outline-none focus:border-forest-500"
            >
              <option value="all">All Categories</option>
              <option value="QUANTITATIVE_FINDING">Quantitative Finding</option>
              <option value="FINDING">General Finding</option>
              <option value="METHODOLOGY">Methodology</option>
            </select>
          </div>

          {/* Min Confidence Slider */}
          <div>
            <label className="block text-archival-400 font-medium mb-1 font-mono">
              Min Confidence: <span className="text-forest-400 font-semibold">{Math.round(minConfidence * 100)}%</span>
            </label>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.05}
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full accent-forest-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-archival-500 mt-1 font-mono">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Claims Cards */}
      {filteredClaims.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
          <p className="text-sm">No scientific claims match the selected filters.</p>
          <p className="text-xs text-slate-400 mt-1">Try lowering the minimum confidence threshold or selecting all papers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClaims.map((claim) => {
            const confPct = Math.round(claim.confidence_score * 100);
            return (
              <div
                key={claim.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 transition shadow-sm"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {getCategoryBadge(claim.category)}
                    {claim.extracted_verb && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        verb: {claim.extracted_verb}
                      </span>
                    )}
                  </div>

                  {/* Confidence meter */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] text-slate-400 font-medium">Confidence:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{confPct}%</span>
                    <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${confPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Verbatim Claim Text */}
                <blockquote className="text-sm text-slate-100 font-medium leading-relaxed pl-3 border-l-2 border-emerald-500/80">
                  "{claim.verbatim_text}"
                </blockquote>

                {/* Provenance Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="line-clamp-1">{claim.paper_title || 'Paper'}</span>
                  <button
                    onClick={() => onOpenPdfAtPage(claim.paper_id, claim.page_number)}
                    className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 transition shrink-0 ml-3"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Page {claim.page_number}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
