import React, { useEffect, useState } from 'react';
import { SystemStats, Paper } from '../../types';
import { api } from '../../services/api';
import {
  Upload,
  BookOpen,
  MessageSquare,
  ArrowRight,
  FileText,
  ChevronRight
} from 'lucide-react';
import {
  ResearchHeroIllustration,
  EmptyCorpusIllustration
} from '../common/ResearchIllustrations';

interface DashboardViewProps {
  onUploadClick: () => void;
  onExploreLibraryClick: () => void;
  onNavigateToTab: (tab: 'workspace' | 'papers' | 'qa' | 'findings' | 'eval') => void;
  onTrySampleQuestion: (question: string) => void;
  papers?: Paper[];
  onOpenAnalysis?: (paperId: string) => void;
}

const SAMPLE_RESEARCH_QUESTIONS = [
  "Do these papers agree that Transformer models consistently outperform simpler baselines across all datasets?",
  "Does the performance of simpler text classification models depend on the size of the training dataset?",
  "What methodological differences explain conflicting results between these studies?",
  "What explicit limitations and computational bottlenecks are acknowledged across these papers?"
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onUploadClick,
  onExploreLibraryClick,
  onNavigateToTab,
  onTrySampleQuestion,
  papers = [],
  onOpenAnalysis
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [customQuestion, setCustomQuestion] = useState('');

  useEffect(() => {
    let mounted = true;
    api.getSystemStats()
      .then((res) => {
        if (mounted) {
          setStats(res);
          setLoadingStats(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load system stats:", err);
        if (mounted) setLoadingStats(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleRunAnalysis = (questionText: string) => {
    if (!questionText.trim()) return;
    onTrySampleQuestion(questionText.trim());
  };

  const hasPapers = papers.length > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12 selection:bg-forest-500/30">
      {/* 1. Academic Hero & Positioning Section with Research Artwork */}
      <div className="relative overflow-hidden rounded-2xl bg-archival-900 border border-archival-750 p-6 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-forest-950/80 border border-forest-800/70 text-forest-300 text-xs font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-400" />
              <span>Academic Literature Intelligence</span>
            </div>

            <div className="space-y-2.5">
              <h1 className="font-editorial text-2xl sm:text-4xl lg:text-5xl font-bold text-archival-100 tracking-tight leading-[1.15]">
                Compare findings across research papers with verifiable evidence.
              </h1>
              <p className="text-archival-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Upload scientific PDFs to extract key claims, identify agreements and contradictions across independent studies, and ask cross-paper questions with exact page-level citations.
              </p>
            </div>

            {/* Primary & Secondary Call-to-Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onUploadClick}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-forest-600 hover:bg-forest-500 active:bg-forest-700 text-white font-medium text-xs sm:text-sm shadow-sm transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Research Papers</span>
              </button>

              <button
                onClick={() => onNavigateToTab('qa')}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-archival-800 hover:bg-archival-750 text-archival-200 font-medium text-xs sm:text-sm border border-archival-700 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-forest-400" />
                <span>Ask Across Papers</span>
              </button>

              <button
                onClick={onExploreLibraryClick}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg hover:bg-archival-800 text-archival-400 hover:text-archival-200 font-medium text-xs sm:text-sm transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>View Collection ({papers.length})</span>
              </button>
            </div>
          </div>

          {/* Research Hero Graphic */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <ResearchHeroIllustration className="w-full max-w-md h-auto drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* Live Corpus Metrics Bar */}
      {stats && !loadingStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-archival-900 border border-archival-800 rounded-xl">
            <span className="text-[11px] font-mono text-archival-400 block uppercase tracking-wider">Research Papers</span>
            <span className="font-editorial text-xl font-bold text-archival-100 mt-1 block">
              {stats.user_research_papers?.value ?? papers.length}
            </span>
          </div>
          <div className="p-3.5 bg-archival-900 border border-archival-800 rounded-xl">
            <span className="text-[11px] font-mono text-archival-400 block uppercase tracking-wider">Indexed Passages</span>
            <span className="font-editorial text-xl font-bold text-forest-300 mt-1 block">
              {stats.searchable_passages?.value ?? 0}
            </span>
          </div>
          <div className="p-3.5 bg-archival-900 border border-archival-800 rounded-xl">
            <span className="text-[11px] font-mono text-archival-400 block uppercase tracking-wider">Extracted Claims</span>
            <span className="font-editorial text-xl font-bold text-copper-300 mt-1 block">
              {stats.total_extracted_claims?.value ?? 0}
            </span>
          </div>
          <div className="p-3.5 bg-archival-900 border border-archival-800 rounded-xl">
            <span className="text-[11px] font-mono text-archival-400 block uppercase tracking-wider">Inquiries Analyzed</span>
            <span className="font-editorial text-xl font-bold text-amber-300 mt-1 block">
              {stats.questions_asked?.value ?? 0}
            </span>
          </div>
        </div>
      )}

      {/* 2. Interactive Cross-Paper Question Composer */}
      <div className="bg-archival-900 border border-archival-750 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-archival-800">
          <div>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-archival-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-forest-400" />
              Inquire Across Your Research Collection
            </h2>
            <p className="text-xs text-archival-400 mt-0.5">
              Formulate a proposition or question. Answers synthesize empirical findings directly from your uploaded papers.
            </p>
          </div>
          <span className="text-[11px] text-archival-400 px-2.5 py-1 rounded bg-archival-950 border border-archival-800 font-mono self-start sm:self-center">
            {papers.length} Papers Available
          </span>
        </div>

        {/* Input area */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunAnalysis(customQuestion);
              }}
              placeholder="e.g., Do these papers agree that Transformer models outperform simpler baselines on smaller training datasets?"
              className="w-full pl-4 pr-36 py-3.5 bg-archival-950 border border-archival-750 rounded-xl text-archival-100 placeholder-archival-500 text-xs sm:text-sm focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 transition"
            />
            <button
              onClick={() => handleRunAnalysis(customQuestion)}
              disabled={!customQuestion.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-forest-600 hover:bg-forest-500 disabled:opacity-40 text-white font-medium text-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Analyze</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sample Prompts */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-mono font-medium text-archival-400 uppercase tracking-wider block">
              Curated Research Inquiries:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_RESEARCH_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunAnalysis(q)}
                  className="text-left p-2.5 rounded-lg bg-archival-950/70 hover:bg-archival-850 border border-archival-800 hover:border-forest-700/60 text-archival-300 hover:text-forest-200 text-xs transition line-clamp-1 cursor-pointer flex items-center justify-between group"
                >
                  <span className="truncate">"{q}"</span>
                  <ArrowRight className="w-3 h-3 text-archival-500 group-hover:text-forest-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. The 3-Step Research Journey */}
      <div className="bg-archival-900 border border-archival-750 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <div>
          <h2 className="font-editorial text-lg sm:text-xl font-bold text-archival-100">
            How PaperLens-AI Analyzes Research
          </h2>
          <p className="text-xs text-archival-400 mt-0.5">
            A grounded four-stage pipeline ensuring every answer is linked to exact source text
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          {/* Step 1 */}
          <div className="p-4 bg-archival-950 rounded-xl border border-archival-800 space-y-2">
            <div className="flex items-center space-x-2 text-forest-300 font-semibold">
              <span className="w-5 h-5 rounded-full bg-forest-950 border border-forest-700 flex items-center justify-center text-[11px] text-forest-300 font-mono">
                1
              </span>
              <span>Upload & Extract</span>
            </div>
            <p className="text-archival-400 leading-relaxed text-xs">
              Upload PDF files. Text, section headings, metadata, and coordinates are extracted with page-level bounding.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-archival-950 rounded-xl border border-archival-800 space-y-2">
            <div className="flex items-center space-x-2 text-copper-300 font-semibold">
              <span className="w-5 h-5 rounded-full bg-copper-950 border border-copper-700 flex items-center justify-center text-[11px] text-copper-300 font-mono">
                2
              </span>
              <span>Compare Scientific Claims</span>
            </div>
            <p className="text-archival-400 leading-relaxed text-xs">
              Natural Language Inference models identify whether independent findings corroborate, conflict, or diverge by dataset.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-archival-950 rounded-xl border border-archival-800 space-y-2">
            <div className="flex items-center space-x-2 text-amber-300 font-semibold">
              <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-700 flex items-center justify-center text-[11px] text-amber-300 font-mono">
                3
              </span>
              <span>Synthesize with Citations</span>
            </div>
            <p className="text-archival-400 leading-relaxed text-xs">
              Generate query-grounded answers separating original experiments from cited observations, linking directly to source PDF pages.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Active Collection Overview or Empty Folio */}
      {!hasPapers ? (
        <div className="bg-archival-900 border-2 border-dashed border-archival-750 rounded-2xl p-10 text-center space-y-4">
          <EmptyCorpusIllustration />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-editorial text-lg font-bold text-archival-100">
              Your Research Library is Empty
            </h3>
            <p className="text-xs text-archival-400 leading-relaxed">
              Upload two or more academic papers in PDF format. PaperLens will extract findings, evaluate agreements and contradictions, and prepare your collection for comparative inquiry.
            </p>
          </div>
          <button
            onClick={onUploadClick}
            className="px-5 py-2.5 rounded-lg bg-forest-600 hover:bg-forest-500 text-white font-medium text-xs shadow-sm transition inline-flex items-center space-x-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Your First Papers</span>
          </button>
        </div>
      ) : (
        <div className="bg-archival-900 border border-archival-750 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-archival-800">
            <h3 className="font-editorial text-base font-bold text-archival-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-forest-400" />
              Ingested Research Papers ({papers.length})
            </h3>
            <button
              onClick={() => onNavigateToTab('papers')}
              className="text-xs text-forest-400 hover:text-forest-300 font-medium transition cursor-pointer flex items-center gap-1"
            >
              <span>Manage Library</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {papers.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="p-3.5 bg-archival-950 border border-archival-800 hover:border-archival-700 rounded-xl flex items-start justify-between gap-3 transition"
              >
                <div className="space-y-1 min-w-0">
                  <h4 className="text-xs font-semibold text-archival-200 line-clamp-1 hover:text-forest-300 cursor-pointer" onClick={() => onOpenAnalysis && onOpenAnalysis(p.id)} title={p.title || p.filename}>
                    {p.title || p.filename}
                  </h4>
                  <p className="text-[11px] text-archival-400 line-clamp-1">
                    {p.authors || 'Unknown author'} • {p.total_pages} pages
                  </p>
                </div>
                {onOpenAnalysis && (
                  <button
                    onClick={() => onOpenAnalysis(p.id)}
                    className="px-2 py-1 rounded bg-archival-850 hover:bg-archival-800 text-archival-300 text-[11px] font-medium shrink-0 transition cursor-pointer"
                  >
                    Inspect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
