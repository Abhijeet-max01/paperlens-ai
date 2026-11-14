import React from 'react';
import { SystemHealth } from '../../types';
import { Upload, RefreshCw, Cpu, BookOpen } from 'lucide-react';
import { MonographLogo } from '../common/ResearchIllustrations';

interface NavbarProps {
  health: SystemHealth | null;
  paperCount: number;
  onOpenUpload: () => void;
  onRefreshHealth: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  paperCount,
  onOpenUpload,
  onRefreshHealth,
  isRefreshing = false
}) => {
  const isHealthy = health?.status === 'healthy';
  const isCuda = health?.device?.toLowerCase().includes('cuda');

  return (
    <header className="bg-archival-900 border-b border-archival-750 text-archival-100 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Academic Brand & Purpose */}
        <div className="flex items-center space-x-3.5">
          <MonographLogo size={36} className="shadow-sm shrink-0" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-editorial text-lg font-bold tracking-tight text-archival-100">
                PaperLens-AI
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-archival-850 border border-archival-700 text-forest-300 font-mono tracking-wider">
                Research Studio
              </span>
            </div>
            <p className="text-xs text-archival-400 hidden sm:block">
              Multi-Paper Comparative Analysis & Evidence Provenance
            </p>
          </div>
        </div>

        {/* Status Indicators & Main Action */}
        <div className="flex items-center space-x-3">
          {/* Status Badge */}
          {health ? (
            <div className="hidden md:flex items-center space-x-2 text-xs">
              <div
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium ${
                  isHealthy
                    ? 'bg-archival-950 border-forest-800/60 text-forest-300'
                    : 'bg-archival-950 border-rose-800/40 text-rose-300'
                }`}
                title="FastAPI Backend Health"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-forest-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{isHealthy ? 'System Ready' : 'Degraded'}</span>
              </div>

              {/* Hardware Device */}
              <div
                className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-archival-950 border border-archival-750 text-archival-400 text-[11px]"
                title={`Hardware Device: ${health.hardware}`}
              >
                <Cpu className="w-3 h-3 text-archival-500" />
                <span className="font-mono text-[10px]">{isCuda ? 'GPU CUDA' : 'CPU Local'}</span>
              </div>

              {/* Paper Count Badge */}
              <div
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-archival-950 border border-archival-750 text-archival-300 text-[11px]"
                title="Total papers in research collection"
              >
                <BookOpen className="w-3 h-3 text-forest-400" />
                <span>{paperCount} {paperCount === 1 ? 'Paper' : 'Papers'}</span>
              </div>
            </div>
          ) : null}

          {/* Refresh Health Button */}
          <button
            onClick={onRefreshHealth}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-archival-850 hover:bg-archival-800 text-archival-400 hover:text-archival-200 border border-archival-750 transition cursor-pointer"
            title="Refresh backend status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Primary Action Button: Upload Research Papers */}
          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-forest-600 hover:bg-forest-500 active:bg-forest-700 text-white font-medium text-xs sm:text-sm shadow-sm transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Papers</span>
          </button>
        </div>
      </div>
    </header>
  );
};
