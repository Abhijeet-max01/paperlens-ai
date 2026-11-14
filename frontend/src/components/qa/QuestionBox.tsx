import React, { useState } from 'react';
import { Paper } from '../../types';
import { MessageSquare, Sparkles, Send, Loader2 } from 'lucide-react';

interface QuestionBoxProps {
  papers: Paper[];
  onAsk: (question: string, selectedPaperIds: string[]) => void;
  isLoading: boolean;
}

const SAMPLE_QUESTIONS = [
  'What architectural methods reduce memory complexity in Transformer attention?',
  'What accuracy gains are reported for sparse models compared to standard baselines?',
  'What limitations and computational constraints are acknowledged for long sequence modeling?'
];

export const QuestionBox: React.FC<QuestionBoxProps> = ({
  papers,
  onAsk,
  isLoading,
}) => {
  const [question, setQuestion] = useState('');
  const [selectedPaperId, setSelectedPaperId] = useState<string>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const paperIds = selectedPaperId !== 'all' ? [selectedPaperId] : [];
    onAsk(question.trim(), paperIds);
  };

  const handleSelectSample = (sample: string) => {
    setQuestion(sample);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center space-x-2">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-slate-100 text-base">
          Evidence-Grounded Cross-Paper Question Answering
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a scientific or comparative research question across indexed papers..."
            className="w-full p-4 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          {/* Target Papers */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Scope:</span>
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Indexed Papers ({papers.length})</option>
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.filename}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50 shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Answer...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Ask Question</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Sample Query Suggestions */}
      <div className="pt-3 border-t border-slate-800 space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Suggested Cross-Paper Queries</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectSample(sq)}
              className="text-left text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 text-slate-300 hover:text-white transition"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
