import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PaperAnalysis } from '../../types';
import { Spinner } from '../common/Spinner';
import { Badge } from '../common/Badge';
import { ProcessingDetailsModal } from './ProcessingDetailsModal';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Sparkles,
  BookOpen,
  Database,
  Cpu,
  Layers,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Hash,
  BookmarkCheck,
  ShieldCheck,
  FlaskConical,
  GraduationCap,
  Mail,
  Download,
  RefreshCw
} from 'lucide-react';

interface PaperAnalysisWorkspaceProps {
  paperId: string;
  onBack: () => void;
  onAskAboutPaper?: (paperTitle: string, paperId: string) => void;
}

type TabType = 'overview' | 'methodology' | 'claims' | 'limitations' | 'evidence';

export const PaperAnalysisWorkspace: React.FC<PaperAnalysisWorkspaceProps> = ({
  paperId,
  onBack,
  onAskAboutPaper,
}) => {
  const [data, setData] = useState<PaperAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activePdfPage, setActivePdfPage] = useState<number>(1);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const handleReanalyze = async () => {
    try {
      setReanalyzing(true);
      const updated = await api.reanalyzePaper(paperId);
      setData(updated);
    } catch (err: any) {
      console.error('Failed to reanalyze paper:', err);
    } finally {
      setReanalyzing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    api.getPaperAnalysis(paperId)
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load paper analysis');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [paperId]);

  const jumpToPage = (pageNum: number) => {
    setActivePdfPage(pageNum);
    // Automatically switch to evidence tab if in split view
    if (activeTab !== 'evidence') {
      setActiveTab('evidence');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-indigo-500" />
        <div className="text-center">
          <h3 className="text-base font-semibold text-slate-200">Analyzing Research Paper</h3>
          <p className="text-xs text-slate-400 mt-1">
            Synthesizing problem statements, methodology, claims, and limitations with page provenance...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4 text-center">
        <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-rose-300 text-sm">
          <p className="font-semibold mb-1">Could not load paper analysis</p>
          <p className="text-xs text-rose-400">{error || 'Unknown error occurred'}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium inline-flex items-center space-x-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Library</span>
        </button>
      </div>
    );
  }

  const pdfUrl = `${api.getPDFUrl(paperId)}#page=${activePdfPage}`;

  return (
    <div className="space-y-6 animate-fade-in selection:bg-forest-500/30">
      {/* Top Navigation Bar */}
      <div className="bg-archival-900 border border-archival-750 backdrop-blur-md rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="self-start inline-flex items-center space-x-2 text-xs font-mono font-medium text-archival-400 hover:text-forest-400 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Research Library</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3 py-1.5 rounded-lg bg-archival-850 hover:bg-archival-800 text-archival-300 text-xs font-mono transition inline-flex items-center space-x-1.5 cursor-pointer border border-archival-750"
            >
              <Cpu className="w-3.5 h-3.5 text-forest-400" />
              <span>Pipeline Audit</span>
            </button>

            {onAskAboutPaper && (
              <button
                onClick={() => onAskAboutPaper(data.title, data.paper_id)}
                className="px-3 py-1.5 rounded-lg bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold shadow transition inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask Q&A About Paper</span>
              </button>
            )}

            <button
              onClick={handleReanalyze}
              disabled={reanalyzing}
              title="Re-run scientific claim extraction, section synthesis, and multi-tier limitation discovery"
              className="px-3 py-1.5 rounded-lg bg-archival-850 hover:bg-archival-800 text-archival-300 text-xs font-mono transition inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 border border-archival-750"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-forest-400 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>{reanalyzing ? 'Re-analyzing...' : 'Re-analyze'}</span>
            </button>

            <a
              href={api.getDownloadPDFUrl(paperId)}
              download
              className="px-3 py-1.5 rounded-lg bg-archival-850 hover:bg-archival-800 text-archival-300 text-xs font-mono transition inline-flex items-center space-x-1.5 border border-archival-750"
            >
              <Download className="w-3.5 h-3.5 text-archival-400" />
              <span>Download</span>
            </a>

            <a
              href={api.getPDFUrl(paperId)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-archival-850 hover:bg-archival-800 text-forest-300 text-xs font-mono transition inline-flex items-center space-x-1.5 border border-archival-750"
            >
              <ExternalLink className="w-3.5 h-3.5 text-forest-400" />
              <span>Full PDF</span>
            </a>
          </div>
        </div>

        {/* Title and Metadata */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {data.is_test_document ? (
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950/80 border border-amber-800/60 text-amber-300 flex items-center gap-1">
                <FlaskConical className="w-3 h-3" />
                Test Fixture Document
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-forest-950/80 border border-forest-800/60 text-forest-300 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Research Paper
              </span>
            )}
            {data.has_ocr_applied && (
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-archival-800 border border-archival-700 text-forest-400">
                OCR Supplemented
              </span>
            )}
            <Badge variant={data.processing_status === 'INDEXED' ? 'success' : 'info'}>
              {data.processing_status}
            </Badge>
          </div>

          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-archival-100 leading-tight">
            {data.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-archival-400">
            <span className="flex items-center gap-1.5 font-medium text-archival-200">
              <User className="w-3.5 h-3.5 text-forest-400" />
              {data.authors || 'Author not identified'}
            </span>
            {data.affiliations && data.affiliations.length > 0 && (
              <span className="flex items-center gap-1.5 text-archival-300" title={data.affiliations.join('; ')}>
                <GraduationCap className="w-3.5 h-3.5 text-forest-400" />
                <span>{data.affiliations.join(' • ')}</span>
              </span>
            )}
            {data.emails && data.emails.length > 0 && (
              <span className="flex items-center gap-1.5 text-archival-400 font-mono text-[11px]">
                <Mail className="w-3.5 h-3.5 text-forest-400" />
                <span>{data.emails.join(', ')}</span>
              </span>
            )}
            {data.year && (
              <span className="flex items-center gap-1.5 font-mono text-archival-400">
                <Calendar className="w-3.5 h-3.5 text-archival-500" />
                {data.year}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-mono text-archival-500">
              <FileText className="w-3.5 h-3.5" />
              {data.filename}
            </span>
            <span className="text-forest-400 font-mono text-[11px]">
              {data.total_pages} Pages • {data.evidence_passages.length} Passages • {data.claims.length} Claims
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 border-b border-archival-800 pt-2 overflow-x-auto font-mono">
          {[
            { id: 'overview', label: '1. Overview', icon: BookOpen },
            { id: 'methodology', label: '2. Methodology & Results', icon: Database },
            { id: 'claims', label: '3. Scientific Claims', icon: Sparkles, count: data.claims.length },
            { id: 'limitations', label: '4. Limitations & Gaps', icon: Lightbulb },
            { id: 'evidence', label: '5. Evidence & PDF Reader', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-archival-800 text-forest-300 border-b-2 border-forest-500 shadow-sm'
                    : 'text-archival-400 hover:text-archival-200 hover:bg-archival-850'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-forest-400' : 'text-archival-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                    isActive ? 'bg-forest-950 text-forest-300 border border-forest-800' : 'bg-archival-850 text-archival-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Abstract */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Abstract & Core Summary
                </h2>
                {(!data.abstract.is_reliable || data.abstract.text.includes('not explicitly or reliably identified')) && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 border border-amber-800/60 text-amber-300">
                    Structure Warning: Abstract unconfirmed
                  </span>
                )}
              </div>
              {data.abstract.source && (
                <button
                  onClick={() => jumpToPage(data.abstract.source!.page_number)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Page {data.abstract.source.page_number} ({data.abstract.source.section})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-serif">
              {data.abstract.text}
            </p>
          </div>

          {/* Research Problem & Objectives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Research Problem & Motivation
              </h3>
              {data.research_problems.length > 0 ? (
                <ul className="space-y-2.5">
                  {data.research_problems.map((item, idx) => (
                    <li key={idx} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/70 text-xs text-slate-300 space-y-1">
                      <p className="leading-relaxed">{item.statement}</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                        <span>Section: {item.section}</span>
                        <button
                          onClick={() => jumpToPage(item.page_number)}
                          className="text-indigo-400 hover:underline cursor-pointer"
                        >
                          Jump to Page {item.page_number}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No explicit problem statement extracted.</p>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Core Contributions & Objectives
              </h3>
              {data.contributions.length > 0 ? (
                <ul className="space-y-2.5">
                  {data.contributions.map((item, idx) => (
                    <li key={idx} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/70 text-xs text-slate-300 space-y-1">
                      <p className="leading-relaxed">{item.statement}</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                        <span>Section: {item.section}</span>
                        <button
                          onClick={() => jumpToPage(item.page_number)}
                          className="text-indigo-400 hover:underline cursor-pointer"
                        >
                          Jump to Page {item.page_number}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No explicit contributions extracted.</p>
              )}
            </div>
          </div>

          {/* Author Conclusion */}
          {data.conclusion && data.conclusion.text && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4" />
                  Author Conclusion & Final Takeaway
                </h3>
                {data.conclusion.page_number && (
                  <button
                    onClick={() => jumpToPage(data.conclusion.page_number!)}
                    className="text-xs text-indigo-400 hover:underline cursor-pointer"
                  >
                    Page {data.conclusion.page_number}
                  </button>
                )}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed p-4 bg-slate-950/50 rounded-xl border border-slate-800/70">
                {data.conclusion.text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Methodology & Results */}
      {activeTab === 'methodology' && (
        <div className="space-y-6">
          {/* Methodology Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Methodology, Models & Algorithms
            </h3>
            {data.methodology_overview.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.methodology_overview.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span>Section: {item.section}</span>
                      <button
                        onClick={() => jumpToPage(item.page_number)}
                        className="text-indigo-400 hover:underline cursor-pointer"
                      >
                        Page {item.page_number}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No specific methodology statements extracted.</p>
            )}
          </div>

          {/* Datasets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Reported Datasets & Experimental Corpus
            </h3>
            {data.datasets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.datasets.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                    <p className="text-xs font-medium text-emerald-300 leading-relaxed">{item.dataset_info}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span>Found in: {item.section}</span>
                      <button
                        onClick={() => jumpToPage(item.page_number)}
                        className="text-indigo-400 hover:underline cursor-pointer"
                      >
                        Page {item.page_number}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No benchmark datasets explicitly cataloged.</p>
            )}
          </div>

          {/* Numerical Results */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Hash className="w-4 h-4 text-cyan-400" />
              Extracted Numerical Metrics & Empirical Results
            </h3>
            {data.numerical_results.length > 0 ? (
              <div className="space-y-3">
                {data.numerical_results.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.metric_category && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                            {item.metric_category}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          item.is_own_finding
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.is_own_finding ? 'Primary Finding' : 'Literature / Quoted Finding'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">§ {item.section}</span>
                        <button
                          onClick={() => jumpToPage(item.page_number)}
                          className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 hover:bg-slate-700 text-[10px] cursor-pointer"
                        >
                          Page {item.page_number}
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-mono text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                      {item.finding}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No numerical findings isolated.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Scientific Claims Explorer */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-semibold text-slate-200">
                Extracted Scientific Claims ({data.claims.length})
              </h3>
              <p className="text-slate-400 text-[11px]">
                Isolated using spaCy syntactic dependency parsing and scientific finding verb indicators.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-medium text-[11px]">
                High Confidence &gt; 0.60
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {data.claims.map((claim) => (
              <div
                key={claim.id}
                className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                      {claim.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-300">
                      Verb: {claim.extracted_verb}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-400">
                      {claim.extraction_method}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-400">
                      Score: {(claim.confidence_score * 100).toFixed(0)}%
                    </span>
                    <button
                      onClick={() => jumpToPage(claim.page_number)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] cursor-pointer"
                    >
                      Page {claim.page_number}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-200">
                    Normalized Claim:
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    "{claim.normalized_claim || claim.verbatim_text}"
                  </p>
                </div>

                {claim.normalized_claim && (
                  <div className="text-[11px] text-slate-500 font-serif italic">
                    Verbatim source: "{claim.verbatim_text}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Limitations & Opportunities */}
      {activeTab === 'limitations' && (
        <div className="space-y-6">
          {/* Tier 1: Author-Stated Limitations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Tier 1: Author-Stated Limitations (Explicit)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extracted directly from the paper's limitation, threats to validity, or discussion sections.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 text-xs font-semibold border border-amber-800/60">
                {data.limitations_and_gaps.author_stated_limitations.length} Found
              </span>
            </div>

            {data.limitations_and_gaps.author_stated_limitations.length > 0 ? (
              <div className="space-y-3">
                {data.limitations_and_gaps.author_stated_limitations.map((item) => {
                  let tierColor = 'bg-amber-950/80 text-amber-300 border-amber-800/60';
                  let tierLabel = 'Author Stated';
                  if (item.tier === 'THREATS_TO_VALIDITY') {
                    tierColor = 'bg-purple-950/80 text-purple-300 border-purple-800/60';
                    tierLabel = 'Threat to Validity';
                  } else if (item.tier === 'FUTURE_WORK') {
                    tierColor = 'bg-blue-950/80 text-blue-300 border-blue-800/60';
                    tierLabel = 'Future Work Goal';
                  } else if (item.tier === 'PRACTICAL_RECOMMENDATION') {
                    tierColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
                    tierLabel = 'Practical Recommendation';
                  } else if (item.tier === 'METHODOLOGICAL_CAVEAT') {
                    tierColor = 'bg-slate-800 text-slate-300 border-slate-700';
                    tierLabel = 'Methodological Caveat';
                  }

                  return (
                    <div key={item.id} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${tierColor}`}>
                          {tierLabel}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">§ {item.section}</span>
                          <button
                            onClick={() => jumpToPage(item.page_number)}
                            className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 hover:bg-slate-700 text-[10px] cursor-pointer"
                          >
                            Page {item.page_number}
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        "{item.text}"
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No explicit author-stated limitations detected.</p>
            )}
          </div>

          {/* Tier 2: AI-Inferred Limitations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Tier 2: AI-Inferred Methodological Constraints
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Algorithmically inferred from dataset constraints, sample sizes, or baseline omissions.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-950/80 text-indigo-300 text-xs font-semibold border border-indigo-800/60">
                {data.limitations_and_gaps.ai_inferred_limitations.length} Inferred
              </span>
            </div>

            {data.limitations_and_gaps.ai_inferred_limitations.length > 0 ? (
              <div className="space-y-3">
                {data.limitations_and_gaps.ai_inferred_limitations.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{item.title}</span>
                      <button
                        onClick={() => jumpToPage(item.page_number)}
                        className="text-indigo-400 hover:underline text-[11px] cursor-pointer"
                      >
                        Evidence on Page {item.page_number}
                      </button>
                    </div>
                    <p className="text-slate-300">{item.description}</p>
                    <p className="text-[11px] text-slate-500 font-mono italic">Context: "{item.evidence}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No additional inferred constraints flagged.</p>
            )}
          </div>

          {/* Tier 3: Potential Research Gaps */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Tier 3: Potential Research Gaps & Future Directions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gaps suggested by unaddressed experimental configurations and future work hints.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-semibold border border-emerald-800/60">
                {data.limitations_and_gaps.potential_research_gaps.length} Opportunities
              </span>
            </div>

            {data.limitations_and_gaps.potential_research_gaps.map((gap, idx) => (
              <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-300">{gap.title}</span>
                  <button
                    onClick={() => jumpToPage(gap.page_number)}
                    className="text-indigo-400 hover:underline text-[11px] cursor-pointer"
                  >
                    Page {gap.page_number}
                  </button>
                </div>
                <p className="text-slate-300">{gap.description}</p>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-indigo-300">
                  <span className="font-semibold">Suggested Research Question: </span>
                  {gap.suggested_question}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Evidence & PDF Split-View */}
      {activeTab === 'evidence' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[750px]">
          {/* Left Column: Embedded PDF Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Original Document (Viewing Page {activePdfPage})
              </span>
              <a
                href={api.getPDFUrl(paperId)}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline text-xs flex items-center gap-1"
              >
                <span>New Window</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex-1 min-h-[600px] bg-slate-950">
              <iframe
                src={pdfUrl}
                title="Paper PDF Viewer"
                className="w-full h-full border-0 min-h-[650px]"
              />
            </div>
          </div>

          {/* Right Column: Searchable Passages & Claims with Click-to-Jump */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-200 text-sm">
                  Searchable Passages ({data.evidence_passages.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Click any passage to immediately jump the PDF viewer to its corresponding page.
                </p>
              </div>
            </div>

            <div className="overflow-y-auto space-y-3 max-h-[650px] pr-2">
              {data.evidence_passages.map((passage) => {
                const isSelected = activePdfPage === passage.page_number;
                return (
                  <div
                    key={passage.chunk_id}
                    onClick={() => setActivePdfPage(passage.page_number)}
                    className={`p-3.5 rounded-xl border text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-semibold text-indigo-300">
                        {passage.section_name || 'Passage'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        isSelected ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Page {passage.page_number} • {passage.token_count} tokens
                      </span>
                    </div>

                    <p className="text-slate-300 line-clamp-3 leading-relaxed">
                      {passage.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Processing Details Modal */}
      {showAuditModal && (
        <ProcessingDetailsModal
          paperId={paperId}
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
        />
      )}
    </div>
  );
};
