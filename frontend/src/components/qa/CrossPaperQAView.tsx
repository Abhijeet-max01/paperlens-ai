import React, { useState } from 'react';
import { Paper, QAResponse } from '../../types';
import { CitationPill } from '../common/CitationPill';
import { Spinner } from '../common/Spinner';
import {
  MessageSquare,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  BookOpen,
  Scale,
  Database,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CrossPaperQAViewProps {
  papers: Paper[];
  qaResponse: QAResponse | null;
  isLoading: boolean;
  onAsk: (question: string, selectedPaperIds: string[]) => void;
  onOpenCitation: (paperId: string, pageNumber: number) => void;
  initialQuestion?: string;
  selectedPaperIds?: string[];
  onSelectedPaperIdsChange?: (ids: string[]) => void;
}

const SAMPLE_RESEARCH_QUESTIONS = [
  "Do these papers agree that Transformer models consistently outperform simpler baselines across all datasets?",
  "Does the performance of simpler text classification models depend on the size of the training dataset?",
  "What methodological differences explain conflicting results between these studies?",
  "What explicit limitations and computational bottlenecks are acknowledged across these papers?"
];

export const CrossPaperQAView: React.FC<CrossPaperQAViewProps> = ({
  papers,
  qaResponse,
  isLoading,
  onAsk,
  onOpenCitation,
  initialQuestion = '',
  selectedPaperIds: controlledSelectedIds,
  onSelectedPaperIdsChange,
}) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [localSelectedPaperIds, setLocalSelectedPaperIds] = useState<string[]>([]);
  const selectedPaperIds = controlledSelectedIds ?? localSelectedPaperIds;
  const setSelectedPaperIds = (updater: string[] | ((prev: string[]) => string[])) => {
    const nextVal = typeof updater === 'function' ? updater(selectedPaperIds) : updater;
    const uniqueNext = Array.from(new Set(nextVal));
    if (onSelectedPaperIdsChange) {
      onSelectedPaperIdsChange(uniqueNext);
    } else {
      setLocalSelectedPaperIds(uniqueNext);
    }
  };
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    onAsk(question.trim(), Array.from(new Set(selectedPaperIds)));
  };

  const handleSelectSample = (sample: string) => {
    setQuestion(sample);
  };

  const togglePaperSelection = (id: string) => {
    setSelectedPaperIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const selectAllPapers = () => {
    setSelectedPaperIds([]);
  };

  const isScopeAll = selectedPaperIds.length === 0;

  // Deduplicate searched and evidence-providing papers by unique paper ID
  const uniqueSearchedPapers = qaResponse?.searched_papers
    ? Array.from(new Map(qaResponse.searched_papers.map(sp => [sp.id, sp])).values())
    : [];
  const uniqueEvidencePapers = qaResponse?.evidence_papers
    ? Array.from(new Map(qaResponse.evidence_papers.map(ep => [ep.id, ep])).values())
    : [];
  const uniqueContributingCount = qaResponse?.unique_contributing_paper_count ?? uniqueEvidencePapers.length;

  // Detect if user altered scope after generating the currently displayed answer
  const hasScopeMismatchWithDisplayedResult = Boolean(
    qaResponse &&
    selectedPaperIds.length > 0 &&
    (uniqueSearchedPapers.length !== selectedPaperIds.length ||
      uniqueSearchedPapers.some(sp => !selectedPaperIds.includes(sp.id)))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12 selection:bg-forest-500/30">
      {/* Editorial Header */}
      <div className="bg-archival-900 border border-archival-750 rounded-2xl p-6 sm:p-7 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 text-forest-400 font-mono text-xs font-semibold uppercase tracking-wider">
          <MessageSquare className="w-4 h-4" />
          <span>Cross-Paper Scientific Inquiry</span>
        </div>
        <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-archival-100 tracking-tight">
          Literature Synthesis & Contradiction Studio
        </h1>
        <p className="text-xs sm:text-sm text-archival-300 max-w-3xl leading-relaxed">
          Formulate a comparative research question across your uploaded papers. PaperLens extracts relevant passages, evaluates scientific consensus versus tension, and synthesizes evidence with strict page-level verification.
        </p>

        {/* Academic Grounding Notice */}
        <div className="pt-2 flex items-start space-x-2 text-xs text-archival-400 border-t border-archival-800">
          <ShieldCheck className="w-4 h-4 text-forest-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-archival-200">Strict Provenance Validation:</strong> Every finding is cross-checked against source PDF text chunks. Citations link directly to exact document pages.
          </p>
        </div>
      </div>

      {/* Query Composer Card */}
      <div className="bg-archival-900 border border-archival-750 rounded-2xl p-6 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-medium text-archival-400 uppercase tracking-wider">
              Research Question or Proposition
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question across your papers (e.g., 'Do these papers provide evidence that the performance of simpler text classification models depends on training dataset size? Compare experimental findings, datasets, and metrics.')..."
                className="w-full p-4 bg-archival-950 border border-archival-750 rounded-xl text-archival-100 placeholder-archival-500 text-xs sm:text-sm focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Scope Controls & Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs pt-1">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition cursor-pointer font-mono text-xs ${
                  isScopeAll
                    ? 'bg-archival-950 border-archival-750 text-archival-300 hover:text-white hover:border-archival-700'
                    : 'bg-forest-950/80 border-forest-800 text-forest-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-forest-400" />
                <span>
                  {isScopeAll
                    ? `Scope: All Papers (${papers.length})`
                    : `Scope: ${selectedPaperIds.length} of ${papers.length} Selected`}
                </span>
                {isFilterOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-archival-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-archival-500" />
                )}
              </button>

              {!isScopeAll && (
                <button
                  type="button"
                  onClick={selectAllPapers}
                  className="text-forest-400 hover:text-forest-300 text-[11px] font-mono cursor-pointer underline"
                >
                  Reset to All
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="px-6 py-2.5 rounded-lg bg-forest-600 hover:bg-forest-500 active:bg-forest-700 text-white font-medium transition disabled:opacity-50 shadow-sm flex items-center justify-center space-x-2 cursor-pointer text-xs sm:text-sm"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  <span>Synthesizing Across Papers...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Synthesize Across Papers</span>
                </>
              )}
            </button>
          </div>

          {/* Paper Scope Selector Panel */}
          {isFilterOpen && (
            <div className="p-4 bg-archival-950 rounded-xl border border-archival-800 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-archival-850">
                <span className="font-semibold text-archival-200">
                  Select Papers to Include in Analysis Scope:
                </span>
                <span className="text-[11px] text-archival-500 font-mono">
                  {selectedPaperIds.length === 0 ? 'Searching all ingested papers' : `${selectedPaperIds.length} selected`}
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-2">
                {papers.map((p) => {
                  const isChecked = selectedPaperIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center space-x-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                        isChecked
                          ? 'bg-forest-950/40 border-forest-800/80 text-forest-200'
                          : 'bg-archival-900 border-archival-800 text-archival-300 hover:border-archival-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePaperSelection(p.id)}
                        className="rounded border-archival-700 bg-archival-950 text-forest-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="truncate flex-1 font-medium">{p.title || p.filename}</span>
                      <span className="text-[10px] text-archival-500 font-mono shrink-0">{p.total_pages} pp.</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        {/* Curated Sample Questions */}
        <div className="pt-3 border-t border-archival-800 space-y-2">
          <span className="text-[11px] font-mono font-medium text-archival-400 uppercase tracking-wider block">
            Suggested Research Questions:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_RESEARCH_QUESTIONS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="text-left p-2.5 rounded-lg bg-archival-950/60 hover:bg-archival-850 border border-archival-800 hover:border-forest-700/60 text-archival-300 hover:text-forest-200 text-xs transition line-clamp-1 cursor-pointer"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Synthesized Answer Report */}
      {qaResponse && (
        <div className="bg-archival-900 border border-archival-750 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm">
          {/* Answer Report Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-archival-800">
            <div className="space-y-1.5 max-w-2xl">
              <span className="text-[11px] font-mono font-semibold text-forest-400 uppercase tracking-wider">
                Cross-Paper Synthesis Report
              </span>
              <h2 className="font-editorial text-xl sm:text-2xl font-bold text-archival-100">
                "{qaResponse.question}"
              </h2>
            </div>

            {/* Strict Provenance Badge */}
            <div
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-archival-950 border border-forest-800/80 text-forest-300 text-xs font-mono font-medium shrink-0"
              title="Every citation snippet is verified against stored document text chunks"
            >
              <ShieldCheck className="w-4 h-4 text-forest-400" />
              <span>
                {qaResponse.verified_citation_count} / {qaResponse.citations.length} Verified Page Citations
              </span>
            </div>
          </div>

          {/* Scope Mismatch Notice if selection changed after last run */}
          {hasScopeMismatchWithDisplayedResult && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200">
              <span>
                Your paper scope selection ({selectedPaperIds.length} papers) differs from the papers analyzed below ({uniqueSearchedPapers.length}). Re-synthesize to update.
              </span>
              <button
                type="button"
                onClick={() => question.trim() && onAsk(question.trim(), selectedPaperIds)}
                className="px-3 py-1 rounded-lg bg-amber-700/70 hover:bg-amber-600 text-white font-medium shrink-0 cursor-pointer transition"
              >
                Re-run for {selectedPaperIds.length} Selected
              </button>
            </div>
          )}

          {/* Corpus Distribution Tally: Searched vs Evidence-Providing Papers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Searched Papers */}
            <div className="p-4 bg-archival-950 rounded-xl border border-archival-800 space-y-2">
              <span className="font-semibold text-archival-400 uppercase tracking-wider text-[10px] block">
                Papers Analyzed ({uniqueSearchedPapers.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {uniqueSearchedPapers.length > 0 ? (
                  uniqueSearchedPapers.map((sp) => (
                    <span
                      key={sp.id}
                      className="px-2 py-0.5 rounded bg-archival-900 text-archival-300 border border-archival-800 text-[11px]"
                    >
                      {sp.title}
                    </span>
                  ))
                ) : (
                  <span className="text-archival-500 italic">Indexed library papers</span>
                )}
              </div>
            </div>

            {/* Evidence-Providing Papers */}
            <div className="p-4 bg-archival-950 rounded-xl border border-forest-900/60 space-y-2">
              <span className="font-semibold text-forest-400 uppercase tracking-wider text-[10px] block">
                Evidence-Providing Papers ({uniqueContributingCount})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {uniqueEvidencePapers.length > 0 ? (
                  uniqueEvidencePapers.map((ep) => (
                    <span
                      key={ep.id}
                      className="px-2 py-0.5 rounded bg-forest-950/80 text-forest-300 border border-forest-800/60 text-[11px] font-medium"
                    >
                      {ep.title} (p. {ep.page_numbers.join(', ')})
                    </span>
                  ))
                ) : (
                  <span className="text-archival-500 italic">No direct evidence passages isolated</span>
                )}
              </div>
            </div>
          </div>

          {/* 1. Executive Synthesis & Direct Answer */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-semibold text-archival-400 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-forest-400" />
              1. Executive Answer & Direct Verdict
            </h3>
            <div className="p-5 bg-archival-950 rounded-xl border border-forest-800/50 text-archival-100 text-sm leading-relaxed whitespace-pre-line shadow-sm">
              {qaResponse.direct_response || qaResponse.answer}
            </div>
          </div>

          {/* 2. Paper-Wise Comparative Summary */}
          {qaResponse.summary_of_evidence && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-semibold text-archival-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-forest-400" />
                2. Summary of Findings Across Contributing Studies
              </h3>
              <div className="p-5 bg-archival-950 rounded-xl border border-archival-800 text-xs sm:text-sm text-archival-300 leading-relaxed whitespace-pre-line font-sans">
                {qaResponse.summary_of_evidence}
              </div>
            </div>
          )}

          {/* 3 & 4. Categorized Consensus vs Contradiction Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supporting Findings (Consensus) */}
            <div className="p-5 bg-archival-950 rounded-xl border border-forest-900/50 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-forest-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-forest-400" />
                <span>3. Supporting Evidence (Agreement)</span>
              </div>
              {qaResponse.supporting_findings && qaResponse.supporting_findings.length > 0 ? (
                <ul className="space-y-2.5 text-xs text-archival-300 pl-4 list-disc marker:text-forest-400">
                  {qaResponse.supporting_findings.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-archival-500 italic">No unanimous consensus isolated across these papers.</p>
              )}
            </div>

            {/* Contradicting & Divergent Findings (Tension) */}
            <div className="p-5 bg-archival-950 rounded-xl border border-copper-900/50 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-copper-300 font-mono">
                <AlertCircle className="w-4 h-4 text-copper-400" />
                <span>4. Contradictions & Divergent Findings</span>
              </div>
              {qaResponse.contradicting_findings && qaResponse.contradicting_findings.length > 0 ? (
                <ul className="space-y-2.5 text-xs text-archival-300 pl-4 list-disc marker:text-copper-400">
                  {qaResponse.contradicting_findings.map((item, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-archival-500 italic">No empirical contradictions isolated for this query.</p>
              )}
              <p className="text-[11px] text-archival-500 pt-2 border-t border-archival-900 font-sans">
                Note: Discrepancies usually indicate variation in evaluation benchmarks, model size, or test conditions rather than direct factual error.
              </p>
            </div>
          </div>

          {/* 5. Methodology & Dataset Variations */}
          {qaResponse.methodology_and_dataset_differences && qaResponse.methodology_and_dataset_differences.length > 0 && (
            <div className="p-5 bg-archival-950 rounded-xl border border-archival-800 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-archival-300 font-mono">
                <Database className="w-4 h-4 text-forest-400" />
                <span>5. Methodology & Benchmark Controls (Why Outcomes Differ)</span>
              </div>
              <ul className="space-y-2 text-xs text-archival-300 pl-4 list-disc marker:text-archival-500">
                {qaResponse.methodology_and_dataset_differences.map((diff, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {diff}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. Inconclusive Evidence & Research Gaps */}
          {qaResponse.inconclusive_evidence && qaResponse.inconclusive_evidence.length > 0 && (
            <div className="p-5 bg-archival-950 rounded-xl border border-amber-950/60 space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300 font-mono">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>6. Inconclusive Evidence & Literature Gaps</span>
              </div>
              <ul className="space-y-1.5 text-xs text-archival-400 pl-4 list-disc marker:text-amber-500">
                {qaResponse.inconclusive_evidence.map((gap, idx) => (
                  <li key={idx} className="leading-relaxed">{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 7. Balanced Scientific Interpretation */}
          {qaResponse.balanced_interpretation && (
            <div className="p-5 bg-archival-950 rounded-xl border border-forest-900/60 space-y-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-forest-300 flex items-center gap-2">
                <Scale className="w-4 h-4 text-forest-400" />
                7. Balanced Scientific Interpretation
              </h3>
              <p className="text-xs sm:text-sm text-archival-200 leading-relaxed font-sans">
                {qaResponse.balanced_interpretation}
              </p>
            </div>
          )}

          {/* Verifiable Page Citations Section */}
          <div className="space-y-4 pt-4 border-t border-archival-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-archival-400">
              <span className="font-bold text-archival-200 uppercase tracking-wider text-xs flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-forest-400" />
                Verifiable Page-Level Citations ({qaResponse.citations.length})
              </span>
              <span className="text-archival-500 text-[11px]">
                Click 'Inspect in PDF' to navigate to the exact source page
              </span>
            </div>

            <div className="space-y-3">
              {qaResponse.citations.map((cite, index) => {
                const isChallenge = cite.semantic_support_status === 'CHALLENGES';
                const isSupport = cite.semantic_support_status === 'SUPPORTS';
                const isConditional = cite.semantic_support_status === 'CONDITIONAL';

                return (
                  <div
                    key={cite.citation_id || index}
                    className={`p-4 bg-archival-950 rounded-xl border transition flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs ${
                      isSupport
                        ? 'border-forest-900/60 hover:border-forest-700'
                        : isChallenge
                        ? 'border-copper-900/60 hover:border-copper-700'
                        : 'border-archival-800 hover:border-archival-700'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CitationPill
                          citation={cite}
                          onClick={() => onOpenCitation(cite.paper_id, cite.page_number)}
                        />
                        <span className="text-archival-500 font-mono text-[11px]">
                          [{cite.section_name || 'Passage'}]
                        </span>
                        {cite.semantic_support_status && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                              isSupport
                                ? 'bg-forest-950 text-forest-300 border-forest-800'
                                : isChallenge
                                ? 'bg-copper-950 text-copper-300 border-copper-800'
                                : isConditional
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-archival-900 text-archival-400 border-archival-750'
                            }`}
                            title={cite.verification_note || 'Semantic relationship to query'}
                          >
                            {isSupport
                              ? 'Direct Evidence (Supports)'
                              : isChallenge
                              ? 'Counter-Evidence (Challenges)'
                              : isConditional
                              ? 'Conditional / Bounded Evidence'
                              : 'Contextual Only'}
                          </span>
                        )}
                      </div>

                      {/* Scholarly Blockquote */}
                      <p className="text-archival-200 text-xs italic pl-3 border-l-2 border-forest-500/70 leading-relaxed font-serif">
                        "{cite.quoted_snippet}"
                      </p>

                      {cite.verification_note && (
                        <p className="text-[11px] text-archival-400 font-mono">
                          {cite.verification_note}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onOpenCitation(cite.paper_id, cite.page_number)}
                      className="px-3 py-1.5 rounded-lg bg-archival-850 hover:bg-archival-800 text-forest-300 hover:text-white transition flex items-center space-x-1.5 text-xs shrink-0 cursor-pointer border border-archival-750"
                    >
                      <span>Inspect in PDF (p. {cite.page_number})</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
