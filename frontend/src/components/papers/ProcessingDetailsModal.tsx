import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ProcessingTransparency, ProcessingStage } from '../../types';
import { Spinner } from '../common/Spinner';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  SkipForward,
  Cpu,
  ScanText,
  AlertTriangle,
  X
} from 'lucide-react';

interface ProcessingDetailsModalProps {
  paperId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProcessingDetailsModal: React.FC<ProcessingDetailsModalProps> = ({
  paperId,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<ProcessingTransparency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !paperId) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    api.getPaperProcessing(paperId)
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to load processing details');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [paperId, isOpen]);

  if (!isOpen) return null;

  const renderStageIcon = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-forest-400 shrink-0" />;
      case 'in_progress':
        return <Spinner size="sm" className="text-forest-400 shrink-0" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'skipped':
        return <SkipForward className="w-5 h-5 text-archival-500 shrink-0" />;
      default:
        return <Clock className="w-5 h-5 text-archival-600 shrink-0" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-forest-950 text-forest-300 border border-forest-800/80">Completed</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-archival-800 text-forest-300 border border-forest-700/80">In Progress</span>;
      case 'failed':
        return <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-rose-950 text-rose-300 border border-rose-800/60">Failed</span>;
      case 'skipped':
        return <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-archival-850 text-archival-400 border border-archival-750">Skipped</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-archival-900 text-archival-500 border border-archival-800">Waiting</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-archival-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-archival-900 border border-archival-750 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-archival-750 flex items-center justify-between bg-archival-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-forest-950/80 border border-forest-800/80 text-forest-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial text-lg font-bold text-archival-100 flex items-center gap-2">
                Processing Audit & Transparency Log
              </h2>
              <p className="text-xs text-archival-400">
                Detailed step-by-step extraction, OCR, and indexing record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-archival-400 hover:text-archival-100 hover:bg-archival-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Spinner size="lg" className="text-forest-400" />
              <p className="text-sm text-archival-400">Retrieving pipeline audit trail...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Paper Metadata Bar */}
              <div className="p-4 bg-archival-950/70 border border-archival-800 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-archival-100 text-sm font-editorial">{data.title}</h3>
                    <p className="text-xs text-archival-400 font-mono mt-0.5">{data.filename}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-archival-800 text-archival-300 border border-archival-700">
                      Status: {data.processing_status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-archival-800 text-xs">
                  <div>
                    <span className="text-archival-500 block">Total Pages</span>
                    <span className="font-semibold text-archival-200">{data.total_pages}</span>
                  </div>
                  <div>
                    <span className="text-archival-500 block">Searchable Passages</span>
                    <span className="font-semibold text-forest-300">{data.chunk_count}</span>
                  </div>
                  <div>
                    <span className="text-archival-500 block">Candidate Claims</span>
                    <span className="font-semibold text-forest-300">{data.claim_count}</span>
                  </div>
                  <div>
                    <span className="text-archival-500 block">Limitations Found</span>
                    <span className="font-semibold text-copper-300">{data.limitation_count}</span>
                  </div>
                </div>
              </div>

              {/* OCR and Page Health Alerts */}
              <div className="space-y-3">
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                  data.has_ocr_applied
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    : 'bg-archival-950/40 border-archival-800 text-archival-300'
                }`}>
                  <ScanText className={`w-5 h-5 shrink-0 ${data.has_ocr_applied ? 'text-amber-400' : 'text-archival-400'}`} />
                  <div>
                    <div className="font-medium text-archival-200">
                      {data.has_ocr_applied
                        ? 'Tesseract OCR Fallback Was Triggered'
                        : 'Standard High-Density PyMuPDF Text Extraction'}
                    </div>
                    <p className="text-archival-400 mt-0.5">
                      {data.has_ocr_applied
                        ? 'Digital text was sparse or missing on some pages, so Tesseract OCR was executed to recover textual tokens.'
                        : 'Vector text layers were parsed directly from PyMuPDF with full character fidelity.'}
                      {' '}
                      {data.ocr_engine_available
                        ? '(Tesseract OCR is installed and available on this host).'
                        : '(Note: Tesseract OCR is currently not detected on host system PATH).'}
                    </p>
                  </div>
                </div>

                {data.unextractable_pages && data.unextractable_pages.length > 0 && (
                  <div className="p-3.5 bg-amber-950/30 border border-amber-900/50 rounded-xl text-xs text-amber-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                    <div>
                      <div className="font-medium">Unextractable Pages Detected</div>
                      <p className="text-amber-300/80 mt-0.5">
                        Pages {data.unextractable_pages.join(', ')} contained non-text graphical elements or scans with insufficient resolution for text extraction.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 9 Stages Timeline */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-archival-400 mb-3">
                  Document Ingestion Pipeline (9 Stages)
                </h4>
                <div className="space-y-2.5">
                  {data.stages && data.stages.length > 0 ? (
                    data.stages.map((stage) => (
                      <div
                        key={stage.id}
                        className="p-3 bg-archival-950/40 border border-archival-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          {renderStageIcon(stage.status)}
                          <div>
                            <span className="font-semibold text-archival-200 block">
                              Stage {stage.id}: {stage.name}
                            </span>
                            <span className="text-archival-400 block line-clamp-1">
                              {stage.detail}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          {stage.completed_at && (
                            <span className="text-[11px] text-archival-500 font-mono hidden sm:inline">
                              {new Date(stage.completed_at).toLocaleTimeString()}
                            </span>
                          )}
                          {getStatusBadge(stage.status)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-archival-500 italic">No stage logs available for this paper.</p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-archival-800 bg-archival-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-archival-800 hover:bg-archival-750 text-archival-200 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
