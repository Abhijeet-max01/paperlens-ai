import React, { useState } from 'react';
import { Paper } from '../../types';
import { Badge } from '../common/Badge';
import { ProcessingDetailsModal } from './ProcessingDetailsModal';
import {
  FileText,
  Calendar,
  User,
  Sparkles,
  AlertTriangle,
  Eye,
  Trash2,
  ScanText,
  Cpu,
  Layers,
  FlaskConical,
  BookOpen
} from 'lucide-react';

interface PaperCardProps {
  paper: Paper;
  onOpenAnalysis: (paper: Paper) => void;
  onViewPdf: (paper: Paper) => void;
  onDeletePaper: (paperId: string) => Promise<void>;
  onExploreClaims?: (paper: Paper) => void;
}

export const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  onOpenAnalysis,
  onViewPdf,
  onDeletePaper,
  onExploreClaims,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeletePaper(paper.id);
      setShowConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = () => {
    switch (paper.processing_status) {
      case 'INDEXED':
        return <Badge variant="success">Indexed</Badge>;
      case 'PROCESSING':
        return <Badge variant="info">Processing...</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="neutral">Pending</Badge>;
    }
  };

  return (
    <>
      <div className={`bg-archival-900 border rounded-xl p-5 hover:border-forest-600/70 transition-all duration-200 shadow-sm flex flex-col justify-between space-y-4 group ${
        paper.is_test_document ? 'border-amber-900/40 bg-archival-900/90' : 'border-archival-750'
      }`}>
        {/* Top Header */}
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {paper.is_test_document ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/80 border border-amber-800/60 text-amber-300 flex items-center gap-1">
                    <FlaskConical className="w-2.5 h-2.5" />
                    Test Fixture
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-forest-950/80 border border-forest-800/60 text-forest-300 flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5" />
                    Research Paper
                  </span>
                )}
                {paper.has_ocr_applied && (
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-archival-800 border border-archival-700 text-forest-400 flex items-center gap-1"
                    title="Tesseract OCR extracted text for low-density/scanned pages"
                  >
                    <ScanText className="w-2.5 h-2.5" />
                    OCR
                  </span>
                )}
              </div>

              <h3
                onClick={() => onOpenAnalysis(paper)}
                className="font-editorial font-bold text-archival-100 text-base leading-snug line-clamp-2 hover:text-forest-300 cursor-pointer transition-colors"
                title={paper.title || paper.filename}
              >
                {paper.title || paper.filename}
              </h3>

              <div className="text-xs text-archival-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1 font-mono text-[11px] text-archival-500 truncate max-w-[200px]" title={paper.filename}>
                  <FileText className="w-3 h-3 text-archival-500 shrink-0" />
                  {paper.filename}
                </span>
                {paper.year && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-archival-400">
                    <Calendar className="w-3 h-3 text-archival-500 shrink-0" />
                    {paper.year}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1.5">
              {getStatusBadge()}
            </div>
          </div>

          {paper.authors ? (
            <p className="text-xs text-archival-300 flex items-center gap-1.5 line-clamp-1" title={paper.authors}>
              <User className="w-3 h-3 text-forest-400 shrink-0" />
              <span className="font-medium">{paper.authors}</span>
            </p>
          ) : (
            <p className="text-xs text-archival-500 flex items-center gap-1.5 line-clamp-1">
              <User className="w-3 h-3 text-archival-600 shrink-0" />
              <span className="italic">Unknown Author</span>
            </p>
          )}

          {paper.affiliations && paper.affiliations.length > 0 && (
            <p className="text-[11px] text-archival-500 flex items-center gap-1.5 line-clamp-1" title={paper.affiliations.join('; ')}>
              <span className="truncate">{paper.affiliations.join(' • ')}</span>
            </p>
          )}
        </div>

        {/* Scholarly Metadata Ribbon */}
        <div className="grid grid-cols-4 gap-2 py-2 px-3 bg-archival-950 rounded-lg border border-archival-800 text-center font-mono">
          <div>
            <span className="block text-[9px] text-archival-500 uppercase">Pages</span>
            <span className="text-xs font-bold text-archival-200">{paper.total_pages}</span>
          </div>

          <div>
            <span className="block text-[9px] text-forest-400 uppercase">Passages</span>
            <span className="text-xs font-bold text-forest-300">
              {paper.searchable_passages_count || paper.chunk_count}
            </span>
          </div>

          <div>
            <span className="block text-[9px] text-copper-400 uppercase">Claims</span>
            <span className="text-xs font-bold text-copper-300">
              {paper.candidate_claims_count || paper.claim_count}
            </span>
          </div>

          <div>
            <span className="block text-[9px] text-amber-400 uppercase">Limits</span>
            <span className="text-xs font-bold text-amber-300">
              {paper.author_limitations_count !== undefined
                ? `${paper.author_limitations_count}/${paper.ai_inferred_limitations_count || 0}`
                : paper.limitation_count}
            </span>
          </div>
        </div>

        {/* Section Tags */}
        {paper.sections_detected && paper.sections_detected.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {paper.sections_detected.slice(0, 4).map((sec, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded bg-archival-850 text-archival-400 border border-archival-750 font-mono"
              >
                §{sec}
              </span>
            ))}
            {paper.sections_detected.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-archival-850 text-archival-500 font-mono">
                +{paper.sections_detected.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Error message if failed */}
        {paper.error_message && (
          <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900/40 p-2 rounded-lg flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span className="line-clamp-1">{paper.error_message}</span>
          </div>
        )}

        {/* Primary and Secondary Actions */}
        <div className="pt-2.5 border-t border-archival-800 flex flex-col gap-2">
          {/* Primary Action Button: Open Analysis */}
          <button
            onClick={() => onOpenAnalysis(paper)}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-forest-600 hover:bg-forest-500 active:bg-forest-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Paper Intelligence</span>
          </button>

          {/* Secondary Actions Row */}
          <div className="flex items-center justify-between gap-1.5 text-xs">
            <button
              onClick={() => onViewPdf(paper)}
              className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md bg-archival-850 hover:bg-archival-800 text-archival-300 hover:text-white border border-archival-750 transition cursor-pointer"
              title="View original PDF viewer"
            >
              <Eye className="w-3 h-3 text-forest-400" />
              <span>PDF</span>
            </button>

            {onExploreClaims && (
              <button
                onClick={() => onExploreClaims(paper)}
                className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md bg-archival-850 hover:bg-archival-800 text-archival-300 hover:text-white border border-archival-750 transition cursor-pointer"
                title="Explore scientific claims"
              >
                <Layers className="w-3 h-3 text-copper-400" />
                <span>Claims</span>
              </button>
            )}

            <button
              onClick={() => setShowProcessingModal(true)}
              className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md bg-archival-850 hover:bg-archival-800 text-archival-400 hover:text-white border border-archival-750 transition cursor-pointer"
              title="View processing audit trail & stage timeline"
            >
              <Cpu className="w-3 h-3 text-archival-400" />
              <span className="hidden sm:inline">Audit</span>
            </button>

            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-1.5 rounded-md hover:bg-rose-950/70 text-archival-500 hover:text-rose-400 transition cursor-pointer border border-transparent hover:border-rose-900"
              title="Delete paper"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Processing Details Modal */}
      {showProcessingModal && (
        <ProcessingDetailsModal
          paperId={paper.id}
          isOpen={showProcessingModal}
          onClose={() => setShowProcessingModal(false)}
        />
      )}

      {/* Safe Deletion Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-archival-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-archival-900 border border-archival-750 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-900/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-editorial text-base font-bold text-archival-100">Confirm Paper Deletion</h3>
                <p className="text-xs text-archival-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-archival-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-archival-100">"{paper.title || paper.filename}"</span>?
              This will safely remove its extracted text passages, FAISS index vectors, candidate claims, and limitation records.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-archival-850 hover:bg-archival-800 text-archival-300 text-xs font-medium transition cursor-pointer border border-archival-750"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Paper</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
