import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Paper } from '../../types';
import { api } from '../../services/api';
import { ExternalLink, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface PDFViewerModalProps {
  paper: Paper | null;
  initialPage?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  paper,
  initialPage = 1,
  isOpen,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  if (!paper) return null;

  const pdfUrl = `${api.getPDFUrl(paper.id)}#page=${currentPage}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paper.title || paper.filename}
      size="2xl"
    >
      <div className="flex flex-col h-[75vh]">
        {/* Controls Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-archival-750 text-xs font-mono">
          <div className="flex items-center space-x-2 text-archival-400">
            <FileText className="w-4 h-4 text-forest-400" />
            <span className="font-medium text-archival-200">{paper.filename}</span>
            <span>•</span>
            <span>{paper.total_pages} pages</span>
            {paper.has_ocr_applied && (
              <span className="px-2 py-0.5 rounded bg-archival-800 text-forest-300 border border-archival-700 text-[10px]">
                OCR
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded bg-archival-850 hover:bg-archival-800 text-archival-300 disabled:opacity-40 transition border border-archival-750 cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-archival-300 font-mono text-xs">
                Page {currentPage} of {paper.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(paper.total_pages, p + 1))}
                disabled={currentPage >= paper.total_pages}
                className="p-1 rounded bg-archival-850 hover:bg-archival-800 text-archival-300 disabled:opacity-40 transition border border-archival-750 cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <a
              href={api.getPDFUrl(paper.id)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-archival-850 hover:bg-archival-800 text-forest-300 border border-archival-750 transition"
              title="Open full PDF in new browser tab"
            >
              <span>Open Tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Embedded PDF iframe */}
        <div className="flex-1 mt-3 bg-archival-950 rounded-xl overflow-hidden border border-archival-750 relative">
          <iframe
            key={`${paper.id}-${currentPage}`}
            src={pdfUrl}
            title={paper.title}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </Modal>
  );
};
