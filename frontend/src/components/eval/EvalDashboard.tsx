import React, { useState } from 'react';
import { EvalReport } from '../../types';
import { api } from '../../services/api';
import {
  BarChart3,
  RefreshCw,
  Table,
  Target,
  Search,
  Info,
  Loader2
} from 'lucide-react';

interface EvalDashboardProps {
  initialReport: EvalReport | null;
}

export const EvalDashboard: React.FC<EvalDashboardProps> = ({ initialReport }) => {
  const [report, setReport] = useState<EvalReport | null>(initialReport);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunEvaluation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getBenchmarkReport();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to execute benchmark evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 selection:bg-forest-500/30">
      {/* Header Card */}
      <div className="bg-archival-900 border border-archival-750 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-editorial font-bold text-archival-100 text-lg flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-forest-400" />
              <span>Model Evaluation & Empirical Benchmark</span>
            </h3>
            <p className="text-xs text-archival-400 mt-0.5">
              Transparent offline empirical evaluation of Hugging Face DeBERTa NLI and BGE dense vector retrieval.
            </p>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-forest-600 hover:bg-forest-500 text-white font-medium text-xs sm:text-sm transition disabled:opacity-50 shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Benchmark Inference...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Run Live Benchmark</span>
              </>
            )}
          </button>
        </div>

        {/* Transparency note */}
        <div className="p-3 bg-archival-950 border border-archival-800 rounded-xl flex items-start space-x-2.5 text-xs text-archival-300">
          <Info className="w-4 h-4 text-forest-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-forest-300">Zero Synthetic Hallucinations:</span>
            <p className="text-archival-400 text-[11px] leading-relaxed">
              Every metric reported here is calculated directly using scikit-learn from ground-truth labeled scientific claim pairs and actual retrieval rankings. No numbers are hardcoded.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200">
          {error}
        </div>
      )}

      {report ? (
        <>
          {/* Key Overall Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <span className="block text-[11px] text-slate-400 uppercase font-medium">Evaluated Pairs</span>
              <span className="text-2xl font-bold text-slate-100">{report.total_claim_pairs}</span>
              <span className="block text-[10px] text-slate-400 mt-1">Ground Truth Labeled</span>
            </div>

            <div className="bg-slate-900 border border-indigo-950/80 rounded-xl p-4 text-center">
              <span className="block text-[11px] text-indigo-400 uppercase font-medium">Overall Accuracy</span>
              <span className="text-2xl font-bold text-indigo-300">
                {(report.accuracy * 100).toFixed(1)}%
              </span>
              <span className="block text-[10px] text-slate-400 mt-1">Multi-class Classification</span>
            </div>

            <div className="bg-slate-900 border border-emerald-950/80 rounded-xl p-4 text-center">
              <span className="block text-[11px] text-emerald-400 uppercase font-medium">Macro F1 Score</span>
              <span className="text-2xl font-bold text-emerald-300">{report.macro_f1.toFixed(3)}</span>
              <span className="block text-[10px] text-slate-400 mt-1">Unweighted Class Average</span>
            </div>

            <div className="bg-slate-900 border border-purple-950/80 rounded-xl p-4 text-center">
              <span className="block text-[11px] text-purple-400 uppercase font-medium">Weighted F1</span>
              <span className="text-2xl font-bold text-purple-300">{report.weighted_f1.toFixed(3)}</span>
              <span className="block text-[10px] text-slate-400 mt-1">Support Weighted Average</span>
            </div>
          </div>

          {/* Per-Class Metrics Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <Table className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-slate-200 text-sm">
                Per-Class Performance Metrics (DeBERTa-v3-small)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Precision</th>
                    <th className="py-2.5 px-3">Recall</th>
                    <th className="py-2.5 px-3">F1-Score</th>
                    <th className="py-2.5 px-3">Test Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {Object.entries(report.class_metrics).map(([cls, met]) => (
                    <tr key={cls} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-sans font-medium text-slate-200">
                        {cls}
                      </td>
                      <td className="py-3 px-3 text-indigo-300">
                        {(met.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-emerald-300">
                        {(met.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-cyan-300 font-bold">
                        {met.f1_score.toFixed(3)}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {met.support} pairs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confusion Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <h4 className="font-semibold text-slate-200 text-sm">
                Empirical Confusion Matrix (Rows: Ground Truth, Cols: Predicted)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs text-slate-300 border border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Actual \ Pred</th>
                    {report.confusion_matrix.labels.map((lbl) => (
                      <th key={lbl} className="py-2.5 px-3">
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {report.confusion_matrix.matrix.map((row, rowIdx) => {
                    const rowLabel = report.confusion_matrix.labels[rowIdx];
                    return (
                      <tr key={rowLabel} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 text-left font-sans font-semibold text-slate-300 bg-slate-950/40">
                          {rowLabel}
                        </td>
                        {row.map((val, colIdx) => {
                          const isDiagonal = rowIdx === colIdx;
                          return (
                            <td
                              key={colIdx}
                              className={`py-3 px-3 font-bold text-sm ${
                                isDiagonal
                                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/40'
                                  : val > 0
                                  ? 'text-rose-300/80 bg-rose-950/20'
                                  : 'text-slate-400'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Retrieval Benchmark (Precision@K, Recall@K, MRR) */}
          {report.retrieval_metrics && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-purple-400" />
                <h4 className="font-semibold text-slate-200 text-sm">
                  FAISS Dense Retrieval Benchmark (BGE-small-en-v1.5)
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="block text-[10px] text-slate-400 uppercase">Precision@3</span>
                  <span className="text-base font-bold text-slate-200 font-mono">
                    {(report.retrieval_metrics.precision_at_3 * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="block text-[10px] text-slate-400 uppercase">Recall@3</span>
                  <span className="text-base font-bold text-slate-200 font-mono">
                    {(report.retrieval_metrics.recall_at_3 * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="block text-[10px] text-slate-400 uppercase">Precision@5</span>
                  <span className="text-base font-bold text-slate-200 font-mono">
                    {(report.retrieval_metrics.precision_at_5 * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="block text-[10px] text-slate-400 uppercase">Recall@5</span>
                  <span className="text-base font-bold text-slate-200 font-mono">
                    {(report.retrieval_metrics.recall_at_5 * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-indigo-900/50">
                  <span className="block text-[10px] text-indigo-400 uppercase font-semibold">MRR</span>
                  <span className="text-base font-bold text-indigo-300 font-mono">
                    {report.retrieval_metrics.mrr.toFixed(3)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Evaluated across {report.retrieval_metrics.sample_queries_evaluated} scientific domain queries. Last benchmark timestamp: {new Date(report.evaluated_at).toLocaleString()}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-2">
          <p className="text-sm">No benchmark report loaded yet.</p>
          <p className="text-xs text-slate-400">
            Click "Run Live Benchmark" to evaluate the 30 ground-truth pairs and calculate empirical metrics.
          </p>
        </div>
      )}
    </div>
  );
};
