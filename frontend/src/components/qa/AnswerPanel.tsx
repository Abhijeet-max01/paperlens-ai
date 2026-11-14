import React from 'react';
import { QAResponse } from '../../types';
import { CitationPill } from '../common/CitationPill';
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ShieldCheck
} from 'lucide-react';

interface AnswerPanelProps {
  response: QAResponse;
  onOpenCitation: (paperId: string, pageNumber: number) => void;
}

export const AnswerPanel: React.FC<AnswerPanelProps> = ({
  response,
  onOpenCitation,
}) => {
  const verifiedCount = response.verified_citation_count;
  const unverifiedCount = response.unverified_citation_count;
  const totalCitations = response.citations.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Top Header & Provenance Verification Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Synthesized Evidence
          </span>
          <h3 className="text-sm font-semibold text-slate-200 mt-0.5">
            "{response.question}"
          </h3>
        </div>

        {/* Verification Status */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
            unverifiedCount === 0 && totalCitations > 0
              ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
              : 'bg-amber-950/70 border-amber-700/60 text-amber-300'
          }`}
          title="Every citation was strictly verified against SQLite document chunks & page numbers"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {unverifiedCount === 0 && totalCitations > 0
              ? `100% Provenance Verified (${verifiedCount}/${totalCitations})`
              : `${verifiedCount} Verified, ${unverifiedCount} Unverified`}
          </span>
        </div>
      </div>

      {/* Answer Body */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Synthesized Answer</span>
        </h4>
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans">
          {response.answer}
        </div>
      </div>

      {/* Cross-Paper Agreements & Discrepancies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agreements */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-emerald-900/40 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cross-Paper Convergence & Agreements</span>
          </div>
          {response.agreements && response.agreements.length > 0 ? (
            <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc marker:text-emerald-500">
              {response.agreements.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No direct mutual agreements detected on this topic.</p>
          )}
        </div>

        {/* Discrepancies */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-amber-900/40 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span>Empirical Discrepancies & Divergence</span>
          </div>
          {response.discrepancies && response.discrepancies.length > 0 ? (
            <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc marker:text-amber-500">
              {response.discrepancies.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No empirical contradictions found between the cited papers.</p>
          )}
        </div>
      </div>

      {/* Verified Provenance Citations */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Verifiable Citations ({totalCitations})</span>
          </span>
          <span className="text-slate-400">Click citation pill to open source page</span>
        </div>

        <div className="space-y-2.5">
          {response.citations.map((cite, index) => (
            <div
              key={cite.citation_id || index}
              className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <CitationPill
                    citation={cite}
                    onClick={() => onOpenCitation(cite.paper_id, cite.page_number)}
                  />
                  <span className="text-slate-400 font-mono text-[11px]">
                    [{cite.section_name || 'General'}]
                  </span>
                </div>
                <p className="text-slate-300 text-xs italic pl-2 border-l-2 border-indigo-500/50">
                  "{cite.quoted_snippet}"
                </p>
              </div>

              <button
                onClick={() => onOpenCitation(cite.paper_id, cite.page_number)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium shrink-0 self-start sm:self-center cursor-pointer"
              >
                Jump to Page {cite.page_number} →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
