import React, { useState } from 'react';
import { Claim, NLIMatrixResponse, GapAnalysisResponse, Paper } from '../../types';
import { NLIMatrixView } from '../claims/NLIMatrixView';
import { ClaimList } from '../claims/ClaimList';
import { GapReportView } from '../gaps/GapReportView';
import { GitCompare, Layers, Compass, HelpCircle } from 'lucide-react';

interface FindingsAndComparisonsViewProps {
  papers: Paper[];
  claims: Claim[];
  matrixData: NLIMatrixResponse | null;
  isLoadingMatrix: boolean;
  onRunMatrixComparison: (similarityThreshold: number, maxPairs: number) => Promise<void>;
  gapData: GapAnalysisResponse | null;
  isLoadingGaps: boolean;
  onRefreshGaps: () => void;
  onOpenPdfAtPage: (paperId: string, pageNumber: number) => void;
  initialSubTab?: 'matrix' | 'claims' | 'gaps';
}

export const FindingsAndComparisonsView: React.FC<FindingsAndComparisonsViewProps> = ({
  papers,
  claims,
  matrixData,
  isLoadingMatrix,
  onRunMatrixComparison,
  gapData,
  isLoadingGaps,
  onRefreshGaps,
  onOpenPdfAtPage,
  initialSubTab = 'matrix',
}) => {
  const [subTab, setSubTab] = useState<'matrix' | 'claims' | 'gaps'>(initialSubTab);

  const totalLimitations = (gapData?.total_explicit_limitations || 0) + (gapData?.total_inferred_gaps || 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12 selection:bg-forest-500/30">
      {/* Page Header */}
      <div className="bg-archival-900 border border-archival-750 rounded-2xl p-6 sm:p-7 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-forest-400 mb-1 font-mono text-xs uppercase tracking-wider font-semibold">
              <GitCompare className="w-4 h-4" />
              <span>Comparative Evidence & Findings</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-archival-100 tracking-tight">
              Findings, Agreements & Research Gaps
            </h1>
            <p className="text-xs sm:text-sm text-archival-400 mt-1 max-w-2xl leading-relaxed">
              Examine the empirical claims extracted from your papers, inspect pairwise agreements and
              contradictions, and identify unexplored research gaps.
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center p-1 bg-archival-950 border border-archival-750 rounded-xl shrink-0 self-start md:self-center font-mono">
            <button
              onClick={() => setSubTab('matrix')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                subTab === 'matrix'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-archival-400 hover:text-archival-200 hover:bg-archival-900'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Contradiction Matrix</span>
              {matrixData && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  subTab === 'matrix' ? 'bg-forest-800 text-forest-100' : 'bg-archival-850 text-archival-400'
                }`}>
                  {matrixData.total_comparisons}
                </span>
              )}
            </button>

            <button
              onClick={() => setSubTab('claims')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                subTab === 'claims'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-archival-400 hover:text-archival-200 hover:bg-archival-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Scientific Claims</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                subTab === 'claims' ? 'bg-forest-800 text-forest-100' : 'bg-archival-850 text-archival-400'
              }`}>
                {claims.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab('gaps')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                subTab === 'gaps'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-archival-400 hover:text-archival-200 hover:bg-archival-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Research Gaps</span>
              {totalLimitations > 0 && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  subTab === 'gaps' ? 'bg-forest-800 text-forest-100' : 'bg-archival-850 text-archival-400'
                }`}>
                  {totalLimitations}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Academic Context Callout */}
        <div className="pt-3 border-t border-archival-800 flex items-start space-x-2 text-xs text-archival-400">
          <HelpCircle className="w-4 h-4 text-forest-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-archival-200">Methodological Note:</strong> Discrepancies between findings often arise from
            differences in evaluation benchmarks, sample cohorts, and experimental setups. PaperLens-AI flags potential
            contradictions to guide researchers, but does not treat linguistic disagreement as proof of scientific error.
          </p>
        </div>
      </div>

      {/* Tab 1: Contradiction & Support Matrix */}
      {subTab === 'matrix' && (
        <NLIMatrixView
          matrixData={matrixData}
          papers={papers}
          isLoading={isLoadingMatrix}
          onRunComparison={onRunMatrixComparison}
          onOpenPdfAtPage={onOpenPdfAtPage}
        />
      )}

      {/* Tab 2: Scientific Claims List */}
      {subTab === 'claims' && (
        <ClaimList
          claims={claims}
          papers={papers}
          onOpenPdfAtPage={onOpenPdfAtPage}
        />
      )}

      {/* Tab 3: Research Gaps & Limitations */}
      {subTab === 'gaps' && (
        <GapReportView
          gapData={gapData}
          papers={papers}
          isLoading={isLoadingGaps}
          onRefreshGaps={onRefreshGaps}
          onOpenPdfAtPage={onOpenPdfAtPage}
        />
      )}
    </div>
  );
};
