import React, { useState } from 'react';
import { GapAnalysisResponse, Paper } from '../../types';
import { Badge } from '../common/Badge';
import {
  FileText,
  HelpCircle,
  Sparkles,
  Compass
} from 'lucide-react';

interface GapReportViewProps {
  gapData: GapAnalysisResponse | null;
  papers?: Paper[];
  isLoading?: boolean;
  onRefreshGaps?: () => void;
  onOpenPdfAtPage: (paperId: string, pageNumber: number) => void;
}

export const GapReportView: React.FC<GapReportViewProps> = ({
  gapData,
  onOpenPdfAtPage,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'inferred' | 'explicit'>('all');

  const limitations = gapData?.explicit_limitations || [];
  const inferredGaps = gapData?.inferred_gaps || [];

  return (
    <div className="space-y-6 animate-fade-in pb-12 selection:bg-forest-500/30">
      {/* Header & Distinction Explanation */}
      <div className="bg-archival-900 border border-archival-750 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-copper-400 mb-1 font-mono text-xs uppercase tracking-wider font-semibold">
              <Compass className="w-5 h-5" />
              <span>Literature Frontier Analysis</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-archival-100">
              Research Gaps & Limitation Synthesis
            </h1>
            <p className="text-xs sm:text-sm text-archival-400 mt-1 max-w-2xl leading-relaxed">
              Strictly distinguishes explicit author-acknowledged limitations from algorithmic
              cross-paper discrepancies and potential gaps in your uploaded research collection.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-forest-700 border-forest-600 text-white font-semibold'
                  : 'bg-archival-950 border-archival-750 text-archival-400 hover:text-archival-200'
              }`}
            >
              All ({limitations.length + inferredGaps.length})
            </button>
            <button
              onClick={() => setActiveTab('inferred')}
              className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                activeTab === 'inferred'
                  ? 'bg-copper-700 border-copper-600 text-white font-semibold'
                  : 'bg-archival-950 border-archival-750 text-archival-400 hover:text-archival-200'
              }`}
            >
              Inferred Gaps ({inferredGaps.length})
            </button>
            <button
              onClick={() => setActiveTab('explicit')}
              className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                activeTab === 'explicit'
                  ? 'bg-forest-800 border-forest-700 text-white font-semibold'
                  : 'bg-archival-950 border-archival-750 text-archival-400 hover:text-archival-200'
              }`}
            >
              Author Limitations ({limitations.length})
            </button>
          </div>
        </div>

        {/* Informative Explanation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-4 bg-archival-950 border border-forest-900/60 rounded-xl space-y-1.5">
            <span className="font-semibold text-forest-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-forest-400" />
              Tier 1: Explicit Author-Stated Limitations
            </span>
            <p className="text-archival-400 text-xs leading-relaxed">
              Verbatim constraints, caveats, threats to validity, and computational boundaries acknowledged directly by the authors in the paper text.
            </p>
          </div>

          <div className="p-4 bg-archival-950 border border-copper-900/60 rounded-xl space-y-1.5">
            <span className="font-semibold text-copper-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-copper-400" />
              Tier 2: Inferred Cross-Paper Discrepancies & Gaps
            </span>
            <p className="text-archival-400 text-xs leading-relaxed">
              Algorithmic gap hypotheses synthesized from divergent or contradictory empirical findings between two or more independent papers in this collection.
            </p>
          </div>
        </div>
      </div>

      {/* Tier 2: Inferred Research Gaps */}
      {(activeTab === 'all' || activeTab === 'inferred') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-amber-300 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Tier 2: Potential Gaps in Uploaded Research Collection ({inferredGaps.length})
            </span>
            <span>Synthesized from cross-paper empirical tensions</span>
          </div>

          {inferredGaps.length === 0 ? (
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              No cross-paper contradictions detected yet to synthesize inferred research gaps. Run NLI comparison to generate empirical pairs.
            </div>
          ) : (
            inferredGaps.map((gap) => (
              <div
                key={gap.id}
                className="bg-slate-900 border border-amber-900/40 hover:border-amber-700/60 rounded-2xl p-6 space-y-4 transition shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800/60 inline-block">
                      Potential gap in the uploaded research collection
                    </span>
                    <h4 className="font-bold text-slate-100 text-base mt-1">
                      {gap.title}
                    </h4>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-300 text-xs font-mono font-semibold">
                    {(gap.confidence_score * 100).toFixed(0)}% Relevance
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {gap.description}
                </p>

                {/* Conflicting Papers */}
                {gap.conflicting_paper_titles && gap.conflicting_paper_titles.length > 0 && (
                  <div className="text-xs space-y-1.5">
                    <span className="text-slate-400 font-semibold">Tension Identified Between:</span>
                    <div className="flex flex-wrap gap-2">
                      {gap.conflicting_paper_titles.map((title, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300 text-xs"
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Research Question */}
                {gap.suggested_research_question && (
                  <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300">
                      <HelpCircle className="w-4 h-4" />
                      <span>Suggested Open Research Question:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-200/90 font-medium italic">
                      "{gap.suggested_research_question}"
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tier 1: Explicit Limitations */}
      {(activeTab === 'all' || activeTab === 'explicit') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-cyan-300 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              Tier 1: Explicit Author-Stated Limitations ({limitations.length})
            </span>
            <span>Direct author provenance from paper text</span>
          </div>

          {limitations.length === 0 ? (
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              No explicit limitations found in paper sections yet.
            </div>
          ) : (
            limitations.map((limit) => (
              <div
                key={limit.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <Badge variant="info">Author Stated</Badge>
                    <span className="text-xs text-slate-400 font-medium">
                      Section: {limit.section_found}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Page {limit.page_number}</span>
                </div>

                <blockquote className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif pl-3 border-l-2 border-cyan-500">
                  "{limit.limitation_text}"
                </blockquote>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="line-clamp-1 font-medium text-slate-300">{limit.paper_title}</span>
                  <button
                    onClick={() => onOpenPdfAtPage(limit.paper_id, limit.page_number)}
                    className="flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 transition shrink-0 ml-3 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View in PDF</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
