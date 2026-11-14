import React from 'react';
import { BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { CitationItem } from '../../types';

interface CitationPillProps {
  citation?: CitationItem;
  paperTitle?: string;
  pageNumber?: number;
  sectionName?: string;
  isVerified?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CitationPill: React.FC<CitationPillProps> = ({
  citation,
  paperTitle,
  pageNumber,
  sectionName,
  isVerified,
  onClick,
  className = '',
}) => {
  const title = citation ? citation.paper_title : (paperTitle || 'Paper');
  const page = citation ? citation.page_number : (pageNumber || 1);
  const section = citation ? citation.section_name : sectionName;
  const verified = citation ? citation.is_verified : (isVerified ?? true);

  const shortTitle = title.length > 28 ? `${title.substring(0, 25)}...` : title;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
        verified
          ? 'bg-forest-950/80 text-forest-300 border-forest-800/80 hover:bg-forest-900/80 hover:border-forest-600'
          : 'bg-amber-950/80 text-amber-300 border-amber-800/80 hover:bg-amber-900/80'
      } ${className}`}
      title={`${title} (Page ${page}${section ? `, §${section}` : ''})`}
    >
      <BookOpen className="w-3.5 h-3.5 text-forest-400" />
      <span className="font-semibold text-archival-200">{shortTitle}</span>
      <span className="text-archival-400 font-mono text-[11px]">p. {page}</span>
      {section && <span className="text-archival-500 text-[11px]">§{section}</span>}
      {verified ? (
        <CheckCircle className="w-3 h-3 text-forest-400 shrink-0" />
      ) : (
        <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
      )}
    </button>
  );
};
