import React from 'react';
import {
  Compass,
  BookOpen,
  GitCompare,
  MessageSquare,
  BarChart3,
  HelpCircle
} from 'lucide-react';

export type NavTab = 'workspace' | 'papers' | 'qa' | 'findings' | 'eval';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  paperCount: number;
  claimCount: number;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  paperCount,
  claimCount,
  onOpenUpload
}) => {
  const mainNavItems = [
    {
      id: 'workspace' as NavTab,
      label: 'Research Studio',
      step: 'Overview',
      description: 'Orientation & guided analysis',
      icon: Compass,
    },
    {
      id: 'papers' as NavTab,
      label: 'Research Library',
      step: 'Corpus',
      description: 'Manage & select paper collection',
      icon: BookOpen,
      badge: paperCount > 0 ? paperCount : undefined,
      badgeColor: 'bg-archival-800 text-forest-300 border-archival-700'
    },
    {
      id: 'qa' as NavTab,
      label: 'Cross-Paper Synthesis',
      step: 'Inquire',
      description: 'Ask questions with verified citations',
      icon: MessageSquare,
      highlight: true
    },
    {
      id: 'findings' as NavTab,
      label: 'Contradictions & Gaps',
      step: 'Evidence',
      description: 'Linguistic claims & tension matrix',
      icon: GitCompare,
      badge: claimCount > 0 ? claimCount : undefined,
      badgeColor: 'bg-copper-950/70 text-copper-300 border-copper-800/60'
    }
  ];

  return (
    <aside className="w-64 bg-archival-900 border-r border-archival-750 flex flex-col justify-between p-4 shrink-0 selection:bg-forest-500/30">
      <div className="space-y-6">
        {/* Core Researcher Tasks Navigation */}
        <div>
          <span className="text-[11px] font-semibold text-archival-500 uppercase tracking-wider px-3 block mb-2 font-mono">
            Research Workflow
          </span>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition cursor-pointer ${
                    isActive
                      ? 'bg-forest-950/80 text-forest-100 font-semibold border border-forest-700/70 shadow-sm'
                      : 'text-archival-300 hover:bg-archival-850 hover:text-archival-100'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-forest-400' : item.highlight ? 'text-forest-400' : 'text-archival-500'}`} />
                    <div className="truncate">
                      <div className="text-xs font-medium truncate flex items-center gap-1.5">
                        <span>{item.label}</span>
                      </div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-forest-300' : 'text-archival-500'}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium border shrink-0 ${
                        isActive
                          ? 'bg-forest-900 text-forest-200 border-forest-600'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Multi-Paper Research Context Callout */}
        <div className="p-3.5 bg-archival-950 rounded-lg border border-archival-800 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-archival-200 font-semibold text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-forest-400 shrink-0" />
            <span>Why Cross-Paper Analysis?</span>
          </div>
          <p className="text-[11px] text-archival-400 leading-relaxed">
            Individual papers report localized outcomes. PaperLens compares findings across independent studies to surface scientific consensus, empirical contradictions, and unexplored literature gaps.
          </p>
          {paperCount < 2 && (
            <button
              onClick={onOpenUpload}
              className="w-full mt-1.5 py-1.5 px-2 bg-forest-950/60 hover:bg-forest-900/80 border border-forest-800/80 text-forest-300 rounded text-[11px] font-medium transition cursor-pointer text-center block"
            >
              + Upload 2nd Paper for Comparisons
            </button>
          )}
        </div>
      </div>

      {/* Footer / System Transparency Nav */}
      <div className="pt-4 border-t border-archival-800 space-y-2">
        <button
          onClick={() => onTabChange('eval')}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition cursor-pointer ${
            activeTab === 'eval'
              ? 'bg-archival-850 text-forest-300 font-medium border border-archival-750'
              : 'text-archival-400 hover:bg-archival-850 hover:text-archival-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0 text-archival-500" />
          <div className="truncate">
            <span className="text-xs block text-archival-200">System Benchmarks</span>
            <span className="text-[10px] text-archival-500 block truncate">Model evaluation & metrics</span>
          </div>
        </button>

        <div className="px-3 text-[10px] text-archival-500 flex items-center justify-between font-mono">
          <span>PaperLens v1.0</span>
          <span className="text-forest-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-400" />
            Offline NLI
          </span>
        </div>
      </div>
    </aside>
  );
};
