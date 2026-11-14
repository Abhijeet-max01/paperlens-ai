import React, { useState, useEffect } from 'react';
import {
  Paper,
  Claim,
  NLIMatrixResponse,
  GapAnalysisResponse,
  QAResponse,
  EvalReport,
  SystemHealth
} from './types';
import { api } from './services/api';

// Layout
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { PaperCard } from './components/papers/PaperCard';
import { PaperAnalysisWorkspace } from './components/papers/PaperAnalysisWorkspace';
import { UploadModal } from './components/papers/UploadModal';
import { PDFViewerModal } from './components/papers/PDFViewerModal';
import { CrossPaperQAView } from './components/qa/CrossPaperQAView';
import { FindingsAndComparisonsView } from './components/findings/FindingsAndComparisonsView';
import { EvalDashboard } from './components/eval/EvalDashboard';
import { EmptyCorpusIllustration } from './components/common/ResearchIllustrations';

import {
  Upload,
  RefreshCw,
  AlertCircle,
  Search
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('workspace');
  const [selectedAnalysisPaperId, setSelectedAnalysisPaperId] = useState<string | null>(null);

  // Global State
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Library Filter & Sort State
  const [paperSearchQuery, setPaperSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [includeTestPapers, setIncludeTestPapers] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'pages'>('created_at');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewerPaper, setViewerPaper] = useState<Paper | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(1);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Claims State
  const [claims, setClaims] = useState<Claim[]>([]);

  // NLI Matrix State
  const [matrixData, setMatrixData] = useState<NLIMatrixResponse | null>(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);

  // Research Gaps State
  const [gapData, setGapData] = useState<GapAnalysisResponse | null>(null);
  const [isLoadingGaps, setIsLoadingGaps] = useState(false);

  // Q&A State
  const [qaResponse, setQaResponse] = useState<QAResponse | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [qaInitialQuestion, setQaInitialQuestion] = useState<string>('');
  const [qaSelectedPaperIds, setQaSelectedPaperIds] = useState<string[]>([]);

  // Eval State
  const [evalReport, setEvalReport] = useState<EvalReport | null>(null);

  // Initial Data Fetching
  const fetchHealth = async () => {
    setIsRefreshingHealth(true);
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch (err: any) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setIsRefreshingHealth(false);
    }
  };

  const fetchPapers = async (showTestPapers: boolean = includeTestPapers) => {
    setIsLoadingPapers(true);
    setGlobalError(null);
    try {
      const data = await api.listPapers({
        includeTestPapers: showTestPapers,
      });
      // Deduplicate by ID for defensive consistency
      const uniqueMap = new Map<string, Paper>();
      data.forEach((p) => {
        if (!uniqueMap.has(p.id)) uniqueMap.set(p.id, p);
      });
      setPapers(Array.from(uniqueMap.values()));
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to load papers from database.');
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const data = await api.listClaims();
      setClaims(data);
    } catch (err: any) {
      console.error('Failed to load claims:', err);
    }
  };

  const fetchGaps = async () => {
    setIsLoadingGaps(true);
    try {
      const data = await api.getGaps();
      setGapData(data);
    } catch (err: any) {
      console.error('Failed to load research gaps:', err);
    } finally {
      setIsLoadingGaps(false);
    }
  };

  const fetchEval = async () => {
    try {
      const data = await api.getBenchmarkReport();
      setEvalReport(data);
    } catch (err: any) {
      console.error('Failed to load benchmark evaluation:', err);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchClaims();
    fetchGaps();
    fetchEval();
  }, []);

  useEffect(() => {
    fetchPapers(includeTestPapers);
  }, [includeTestPapers]);

  // Handlers
  const handleOpenPdfAtPage = (paperId: string, pageNumber: number) => {
    const targetPaper = papers.find((p) => p.id === paperId);
    if (targetPaper) {
      setViewerPaper(targetPaper);
      setViewerPage(pageNumber);
      setIsViewerOpen(true);
    } else {
      const fallback = papers[0];
      if (fallback) {
        setViewerPaper(fallback);
        setViewerPage(pageNumber);
        setIsViewerOpen(true);
      }
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    try {
      await api.deletePaper(paperId);
      if (selectedAnalysisPaperId === paperId) {
        setSelectedAnalysisPaperId(null);
      }
      await fetchPapers();
      await fetchHealth();
      await fetchClaims();
      await fetchGaps();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleRunNLIComparison = async (threshold: number, maxPairs: number) => {
    setIsLoadingMatrix(true);
    try {
      const data = await api.compareMatrix(undefined, threshold, maxPairs);
      setMatrixData(data);
      // Refresh gaps because new comparisons may reveal new inferred gaps
      await fetchGaps();
    } catch (err: any) {
      alert(`NLI comparison error: ${err.message}`);
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  const handleAskQuestion = async (question: string, paperIds: string[]) => {
    const cleanIds = Array.from(new Set(paperIds));
    setQaSelectedPaperIds(cleanIds);
    setIsAsking(true);
    try {
      const resp = await api.askQuestion(question, cleanIds);
      setQaResponse(resp);
    } catch (err: any) {
      alert(`Cross-paper analysis error: ${err.message}`);
    } finally {
      setIsAsking(false);
    }
  };

  // Filtered and Sorted Papers for Library View
  const filteredPapers = papers
    .filter((p) => {
      // Test paper filter
      if (!includeTestPapers && p.is_test_document) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && p.processing_status !== statusFilter) {
        return false;
      }
      // Search query filter
      if (paperSearchQuery.trim()) {
        const q = paperSearchQuery.toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesFilename = p.filename?.toLowerCase().includes(q);
        const matchesAuthors = p.authors?.toLowerCase().includes(q);
        return matchesTitle || matchesFilename || matchesAuthors;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || a.filename).localeCompare(b.title || b.filename);
      }
      if (sortBy === 'pages') {
        return (b.total_pages || 0) - (a.total_pages || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="min-h-screen bg-archival-950 text-archival-100 flex flex-col font-sans selection:bg-forest-500/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        health={health}
        paperCount={papers.length}
        onOpenUpload={() => setIsUploadOpen(true)}
        onRefreshHealth={fetchHealth}
        isRefreshing={isRefreshingHealth}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedAnalysisPaperId(null);
            setActiveTab(tab);
          }}
          paperCount={papers.length}
          claimCount={claims.length}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Global Error Banner */}
          {globalError && (
            <div className="mb-6 p-4 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center space-x-3 text-xs text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="flex-1">{globalError}</span>
              <button
                onClick={() => fetchPapers()}
                className="px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-medium transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* INDIVIDUAL PAPER ANALYSIS WORKSPACE (Overlay view when a paper is selected) */}
          {selectedAnalysisPaperId ? (
            <PaperAnalysisWorkspace
              paperId={selectedAnalysisPaperId}
              onBack={() => setSelectedAnalysisPaperId(null)}
              onAskAboutPaper={(title, id) => {
                const sampleQ = `What are the core findings, methodology, and limitations of "${title}"?`;
                setQaInitialQuestion(sampleQ);
                setSelectedAnalysisPaperId(null);
                setActiveTab('qa');
                handleAskQuestion(sampleQ, [id]);
              }}
            />
          ) : (
            <>
              {/* TASK 1: Research Workspace (Hub & Guided Analysis) */}
              {activeTab === 'workspace' && (
                <DashboardView
                  onUploadClick={() => setIsUploadOpen(true)}
                  onExploreLibraryClick={() => setActiveTab('papers')}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  onTrySampleQuestion={(q) => {
                    setQaInitialQuestion(q);
                    setActiveTab('qa');
                    handleAskQuestion(q, qaSelectedPaperIds);
                  }}
                  papers={papers}
                  onOpenAnalysis={(id) => setSelectedAnalysisPaperId(id)}
                />
              )}

              {/* TASK 2: My Papers (Research Paper Library) */}
              {activeTab === 'papers' && (
                <div className="space-y-6 animate-fade-in pb-12">
                  {/* Library Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-archival-100 tracking-tight">
                        Research Paper Library
                      </h1>
                      <p className="text-xs sm:text-sm text-archival-400 mt-0.5">
                        Manage, inspect, and select academic PDFs for cross-paper comparative analysis.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          fetchPapers();
                          fetchClaims();
                          fetchGaps();
                        }}
                        className="p-2.5 rounded-lg bg-archival-900 border border-archival-750 hover:bg-archival-850 text-archival-300 transition cursor-pointer"
                        title="Reload papers from database"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingPapers ? 'animate-spin text-forest-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-forest-600 hover:bg-forest-500 text-white font-medium text-xs sm:text-sm shadow-sm transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Research PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="p-4 bg-archival-900 border border-archival-750 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-archival-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={paperSearchQuery}
                        onChange={(e) => setPaperSearchQuery(e.target.value)}
                        placeholder="Search by paper title, author, or filename..."
                        className="w-full pl-9 pr-4 py-2 bg-archival-950 border border-archival-750 rounded-lg text-archival-100 placeholder-archival-500 focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    {/* Filter & Sort Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Filter */}
                      <div className="flex items-center space-x-1.5 font-mono">
                        <span className="text-archival-400">Status:</span>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="bg-archival-950 border border-archival-750 rounded py-1.5 px-2 text-archival-300 focus:outline-none focus:border-forest-500 cursor-pointer"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="INDEXED">Ready for Analysis</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="FAILED">Failed</option>
                        </select>
                      </div>

                      {/* Sort Dropdown */}
                      <div className="flex items-center space-x-1.5 font-mono">
                        <span className="text-archival-400">Sort:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="bg-archival-950 border border-archival-750 rounded py-1.5 px-2 text-archival-300 focus:outline-none focus:border-forest-500 cursor-pointer"
                        >
                          <option value="created_at">Date Ingested</option>
                          <option value="title">Paper Title</option>
                          <option value="pages">Total Pages</option>
                        </select>
                      </div>

                      {/* Test Documents Toggle */}
                      <label className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-archival-950 border border-archival-750 rounded text-archival-300 cursor-pointer select-none font-mono">
                        <input
                          type="checkbox"
                          checked={includeTestPapers}
                          onChange={(e) => setIncludeTestPapers(e.target.checked)}
                          className="rounded border-archival-700 bg-archival-900 text-forest-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-[11px]">Include Test Fixtures</span>
                      </label>
                    </div>
                  </div>

                  {/* Papers Grid */}
                  {isLoadingPapers ? (
                    <div className="p-16 text-center text-archival-400 text-sm space-y-3 font-mono">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-forest-400" />
                      <p>Loading papers from research database...</p>
                    </div>
                  ) : filteredPapers.length === 0 ? (
                    <div className="bg-archival-900 border-2 border-dashed border-archival-750 rounded-2xl p-12 text-center space-y-4">
                      <EmptyCorpusIllustration />
                      <div className="max-w-md mx-auto space-y-1">
                        <h3 className="font-editorial text-lg font-bold text-archival-100">
                          {paperSearchQuery || statusFilter !== 'ALL' || !includeTestPapers
                            ? 'No papers match your search criteria'
                            : 'No Research Papers Ingested Yet'}
                        </h3>
                        <p className="text-xs text-archival-400 leading-relaxed">
                          {paperSearchQuery || statusFilter !== 'ALL'
                            ? 'Try clearing your search query or resetting the status filter.'
                            : 'Upload your academic research papers in PDF format. PaperLens will extract text and sections, identify scientific findings, and prepare them for cross-paper analysis.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="px-5 py-2.5 rounded-lg bg-forest-600 hover:bg-forest-500 text-white font-medium text-xs shadow-sm transition inline-flex items-center space-x-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Research PDF</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredPapers.map((paper) => (
                        <PaperCard
                          key={paper.id}
                          paper={paper}
                          onOpenAnalysis={(p) => setSelectedAnalysisPaperId(p.id)}
                          onViewPdf={(p) => {
                            setViewerPaper(p);
                            setViewerPage(1);
                            setIsViewerOpen(true);
                          }}
                          onDeletePaper={handleDeletePaper}
                          onExploreClaims={() => setActiveTab('findings')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TASK 3: Cross-Paper Analysis (Q&A with Citations) */}
              {activeTab === 'qa' && (
                <CrossPaperQAView
                  papers={papers}
                  qaResponse={qaResponse}
                  isLoading={isAsking}
                  onAsk={handleAskQuestion}
                  onOpenCitation={handleOpenPdfAtPage}
                  initialQuestion={qaInitialQuestion}
                  selectedPaperIds={qaSelectedPaperIds}
                  onSelectedPaperIdsChange={setQaSelectedPaperIds}
                />
              )}

              {/* TASK 4: Findings, Comparisons & Gaps */}
              {activeTab === 'findings' && (
                <FindingsAndComparisonsView
                  papers={papers}
                  claims={claims}
                  matrixData={matrixData}
                  isLoadingMatrix={isLoadingMatrix}
                  onRunMatrixComparison={handleRunNLIComparison}
                  gapData={gapData}
                  isLoadingGaps={isLoadingGaps}
                  onRefreshGaps={fetchGaps}
                  onOpenPdfAtPage={handleOpenPdfAtPage}
                />
              )}

              {/* ADVANCED / TRANSPARENCY: System & Empirical Evaluation */}
              {activeTab === 'eval' && (
                <div className="space-y-6 animate-fade-in pb-12">
                  <EvalDashboard initialReport={evalReport} />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Upload Paper Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={async () => {
          await fetchPapers();
          await fetchHealth();
          await fetchClaims();
          await fetchGaps();
        }}
      />

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        paper={viewerPaper}
        initialPage={viewerPage}
      />
    </div>
  );
};

export default App;
