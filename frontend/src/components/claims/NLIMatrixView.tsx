import React, { useState } from 'react';
import { NLIMatrixResponse, Paper } from '../../types';
import { Badge } from '../common/Badge';
import {
  GitCompare,
  AlertTriangle,
  Info,
  Loader2,
  Table
} from 'lucide-react';

interface NLIMatrixViewProps {
  matrixData: NLIMatrixResponse | null;
  papers: Paper[];
  isLoading: boolean;
  onRunComparison: (similarityThreshold: number, maxPairs: number) => Promise<void>;
  onOpenPdfAtPage: (paperId: string, pageNumber: number) => void;
}

export const NLIMatrixView: React.FC<NLIMatrixViewProps> = ({
  matrixData,
  papers,
  isLoading,
  onRunComparison,
  onOpenPdfAtPage,
}) => {
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.60);
  const [maxPairs, setMaxPairs] = useState<number>(50);
  const [filterLabel, setFilterLabel] = useState<string>('ALL');

  const handleRun = () => {
    onRunComparison(similarityThreshold, maxPairs);
  };

  const pairs = matrixData?.pairs || [];
  const filteredPairs = pairs.filter((p) => {
    if (filterLabel === 'ALL') return true;
    return p.nli_label === filterLabel;
  });

  const getLabelBadge = (label: string) => {
    switch (label) {
      case 'CONTRADICTION':
        return <Badge variant="danger">Contradiction</Badge>;
      case 'ENTAILMENT':
        return <Badge variant="success">Support (Entailment)</Badge>;
      default:
        return <Badge variant="neutral">Neutral</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 selection:bg-forest-500/30">
      {/* Header & Controls Card */}
      <div className="bg-archival-900 border border-archival-750 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-forest-400 mb-1 font-mono text-xs font-semibold uppercase tracking-wider">
              <GitCompare className="w-5 h-5" />
              <span>Natural Language Inference</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-archival-100">
              Cross-Paper Contradiction & Support Matrix
            </h1>
            <p className="text-xs sm:text-sm text-archival-400 mt-1 max-w-2xl leading-relaxed">
              Two-stage pipeline: Dense vector pre-filtering isolates topically related findings,
              then Hugging Face DeBERTa-v3 cross-encoder classifies textual support, contradiction, or neutrality.
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={isLoading || papers.length < 1}
            className="px-5 py-3 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs sm:text-sm transition disabled:opacity-50 shadow-sm flex items-center justify-center space-x-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Claim Pairs...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                <span>Run Pairwise NLI Inference</span>
              </>
            )}
          </button>
        </div>

        {/* Sliders & Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-archival-800 text-xs font-mono">
          <div>
            <div className="flex justify-between text-archival-300 mb-1.5 font-medium">
              <span>Stage 1 Dense Similarity Pre-filter:</span>
              <span className="text-forest-400 font-bold">{similarityThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.40}
              max={0.85}
              step={0.05}
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              className="w-full accent-forest-500 cursor-pointer"
            />
            <p className="text-[11px] text-archival-500 mt-1 font-sans">
              Prunes unrelated claim pairs before cross-encoder evaluation to prevent quadratic O(N²) explosion.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-archival-300 mb-1.5 font-medium">
              <span>Max Evaluated Claim Pairs:</span>
              <span className="text-forest-400 font-bold">{maxPairs}</span>
            </div>
            <input
              type="range"
              min={10}
              max={150}
              step={10}
              value={maxPairs}
              onChange={(e) => setMaxPairs(parseInt(e.target.value))}
              className="w-full accent-forest-500 cursor-pointer"
            />
            <p className="text-[11px] text-archival-500 mt-1 font-sans">
              Limits the pairwise DeBERTa inference workload on local Windows CPU for responsive execution.
            </p>
          </div>
        </div>

        {/* Epistemic Caveat Banner */}
        <div className="p-4 bg-archival-950 border border-archival-800 rounded-xl flex items-start space-x-3 text-xs text-archival-300">
          <Info className="w-5 h-5 text-forest-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-forest-300">
              Crucial Epistemic Disclaimer & Scientific Context:
            </span>
            <p className="text-archival-400 text-xs leading-relaxed">
              {matrixData?.epistemic_disclaimer ||
                'NLI models evaluate textual entailment and contradiction between isolated statements. Predicted contradictions indicate potential empirical discrepancies, benchmark variations, or divergent findings across experimental setups, datasets, and metrics—not absolute scientific disproof.'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      {matrixData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="bg-archival-900 border border-archival-750 rounded-xl p-4 text-center">
            <span className="block text-[11px] text-archival-400 uppercase font-medium">Pairs Evaluated</span>
            <span className="text-2xl font-extrabold text-archival-100">{matrixData.total_comparisons}</span>
          </div>
          <div className="bg-archival-900 border border-copper-900/60 rounded-xl p-4 text-center">
            <span className="block text-[11px] text-copper-400 uppercase font-medium">Contradictions Found</span>
            <span className="text-2xl font-extrabold text-copper-300">{matrixData.total_contradictions}</span>
          </div>
          <div className="bg-archival-900 border border-forest-900/60 rounded-xl p-4 text-center">
            <span className="block text-[11px] text-forest-400 uppercase font-medium">Supporting Pairs</span>
            <span className="text-2xl font-extrabold text-forest-300">{matrixData.total_entailments}</span>
          </div>
          <div className="bg-archival-900 border border-archival-750 rounded-xl p-4 text-center">
            <span className="block text-[11px] text-archival-400 uppercase font-medium">Neutral / Unrelated</span>
            <span className="text-2xl font-extrabold text-archival-300">
              {matrixData.total_comparisons - matrixData.total_contradictions - matrixData.total_entailments}
            </span>
          </div>
        </div>
      )}

      {/* Inter-Paper Matrix Summary Grid */}
      {matrixData && matrixData.matrix_cells && matrixData.matrix_cells.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-200">
            <Table className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Pairwise Paper Relationship Matrix
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3 font-semibold">Paper Pair Comparison</th>
                  <th className="py-2.5 px-3 font-semibold text-center text-emerald-400">Support</th>
                  <th className="py-2.5 px-3 font-semibold text-center text-rose-400">Contradiction</th>
                  <th className="py-2.5 px-3 font-semibold text-center text-slate-400">Neutral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrixData.matrix_cells.map((cell, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{cell.paper_a_title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="text-indigo-400 font-mono">vs</span>
                        <span>{cell.paper_b_title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                        {cell.entailment_count}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                        {cell.contradiction_count}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        {cell.neutral_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {matrixData && (
        <div className="flex items-center space-x-2 text-xs">
          {['ALL', 'CONTRADICTION', 'ENTAILMENT', 'NEUTRAL'].map((lbl) => (
            <button
              key={lbl}
              onClick={() => setFilterLabel(lbl)}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                filterLabel === lbl
                  ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {lbl === 'ALL'
                ? `All Evaluated Pairs (${pairs.length})`
                : `${lbl} (${pairs.filter((p) => p.nli_label === lbl).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Pairwise Comparison Cards */}
      <div className="space-y-4">
        {filteredPairs.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
            {matrixData
              ? 'No claim pairs match the selected label filter.'
              : 'Click "Run Pairwise NLI Inference" above to evaluate claim relationships across your papers.'}
          </div>
        ) : (
          filteredPairs.map((pair) => {
            const contraPct = Math.round(pair.contradiction_score * 100);
            const entailPct = Math.round(pair.entailment_score * 100);
            const neutralPct = Math.round(pair.neutral_score * 100);

            return (
              <div
                key={pair.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center space-x-2">
                    {getLabelBadge(pair.nli_label)}
                    <span className="text-[11px] font-mono text-slate-400">
                      Dense Similarity: {(pair.semantic_similarity * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Probability meter bars */}
                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="text-rose-400">Contra: {contraPct}%</span>
                    <span className="text-emerald-400">Support: {entailPct}%</span>
                    <span className="text-slate-400">Neutral: {neutralPct}%</span>
                  </div>
                </div>

                {/* Side-by-side comparison grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Claim A */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-indigo-300 line-clamp-1">{pair.claim_a_paper_title}</span>
                      <button
                        onClick={() => onOpenPdfAtPage(pair.claim_a_id, pair.claim_a_page)}
                        className="text-indigo-400 hover:underline cursor-pointer"
                      >
                        Page {pair.claim_a_page}
                      </button>
                    </div>
                    <blockquote className="text-xs text-slate-200 leading-relaxed font-serif">
                      "{pair.claim_a_text}"
                    </blockquote>
                  </div>

                  {/* Claim B */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-cyan-300 line-clamp-1">{pair.claim_b_paper_title}</span>
                      <button
                        onClick={() => onOpenPdfAtPage(pair.claim_b_id, pair.claim_b_page)}
                        className="text-indigo-400 hover:underline cursor-pointer"
                      >
                        Page {pair.claim_b_page}
                      </button>
                    </div>
                    <blockquote className="text-xs text-slate-200 leading-relaxed font-serif">
                      "{pair.claim_b_text}"
                    </blockquote>
                  </div>
                </div>

                {/* Context comparison note if available */}
                {pair.context_comparison_note && (
                  <div className="text-xs text-amber-300/90 bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl flex items-start space-x-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <span className="leading-relaxed">{pair.context_comparison_note}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
