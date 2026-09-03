/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FolderSearch, 
  Palette, 
  LayoutGrid, 
  BarChart3, 
  Share2, 
  Headphones, 
  Search,
  SlidersHorizontal,
  Clock,
  Sparkles,
  BookOpen,
  FileJson,
  FolderDown,
  Download
} from 'lucide-react';
import { TreemapMetric, LibraryStats, LibraryMode, AudiobookshelfConfig } from '../types';
import { formatHours } from '../utils/colorUtils';

interface HeaderProps {
  currentTab: 'dominantColor' | 'multiTreemap' | 'analytics' | 'export';
  onTabChange: (tab: 'dominantColor' | 'multiTreemap' | 'analytics' | 'export') => void;
  libraryPath: string;
  onOpenPathScanner: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  metric: TreemapMetric;
  onMetricChange: (m: TreemapMetric) => void;
  stats: LibraryStats;
  filteredCount: number;
  libraryMode?: LibraryMode;
  onLibraryModeChange?: (mode: LibraryMode) => void;
  onOpenAbsModal?: () => void;
  absConfig?: AudiobookshelfConfig | null;
  readCount?: number;
  onOpenMapDataModal: () => void;
  onQuickSave?: () => void;
  onSmartLoad?: () => void;
  isSaving?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  libraryPath,
  onOpenPathScanner,
  searchQuery,
  onSearchChange,
  metric,
  onMetricChange,
  stats,
  filteredCount: _filteredCount,
  onOpenMapDataModal,
  onQuickSave,
  onSmartLoad,
  isSaving
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-[#12151A] border-b border-zinc-800/80 shadow-xl">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3 lg:h-16 gap-3">
          
          {/* Left: Logo & Brand */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-850 border border-zinc-700/80 rounded-xl flex items-center justify-center shadow-md">
                <Headphones className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
                  Is it Pink?
                </h1>
                <p className="text-xs text-zinc-400 font-medium">
                  What color is your audiobook shelf?
                </p>
              </div>
            </div>
          </div>

          {/* Right: Path Selector & Library Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="library-path-btn"
              onClick={onOpenPathScanner}
              title="Click to enter or change library folder path"
              className="flex items-center gap-2 px-3.5 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/70 rounded-lg text-xs font-mono transition-all group max-w-[200px] sm:max-w-[280px] truncate cursor-pointer"
            >
              <FolderSearch className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0" />
              <span className="truncate text-zinc-300">
                {libraryPath}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-white/5 text-zinc-400 rounded-md shrink-0">
                Change
              </span>
            </button>

            <button
              id="header-scan-folder-btn"
              onClick={onOpenPathScanner}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-100 text-xs font-medium rounded-lg border border-zinc-700 transition-colors shrink-0 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200/90" />
              <span>Scan Folder</span>
            </button>

            {/* Quick Save & Load Buttons */}
            <div className="flex items-center gap-1.5">
              {onQuickSave && (
                <button
                  id="header-quick-save-btn"
                  onClick={onQuickSave}
                  disabled={isSaving}
                  title="Auto-save current library to local app folder as [name]-data.json"
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 hover:border-zinc-700 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <FolderDown className={`w-3.5 h-3.5 text-amber-200/90 ${isSaving ? 'animate-bounce' : ''}`} />
                  <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              )}

              {onSmartLoad && (
                <button
                  id="header-smart-load-btn"
                  onClick={onSmartLoad}
                  title="Load saved map (auto-loads if only 1 save file exists, or choose from list)"
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 hover:border-zinc-700 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-300" />
                  <span className="hidden sm:inline">Load</span>
                </button>
              )}

              {/* Save / Load Map JSON Detail Modal Button */}
              <button
                id="header-map-data-btn"
                onClick={onOpenMapDataModal}
                title="Open Save / Load Maps manager & export tools"
                className="p-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 hover:border-zinc-700 rounded-lg text-xs transition-all shadow-xs cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 text-amber-200/90" />
              </button>
            </div>

            {/* Quick Metrics Badge */}
            <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-zinc-800 text-xs text-zinc-400">
              <span className="flex items-center gap-1 bg-zinc-850 px-2.5 py-1 rounded-lg border border-zinc-800">
                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                <strong className="text-zinc-200">{stats.totalBooks.toLocaleString()}</strong> books
              </span>
              <span className="flex items-center gap-1 bg-zinc-850 px-2.5 py-1 rounded-lg border border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <strong className="text-zinc-200">{formatHours(stats.totalHours)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-3 pt-1 gap-3 border-t border-zinc-800/70">
          
          {/* Main Navigation Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none" aria-label="Main Navigation">
            <button
              id="tab-dominant-color"
              onClick={() => onTabChange('dominantColor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                currentTab === 'dominantColor'
                  ? 'bg-zinc-200 text-zinc-950 font-bold border border-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850 border border-transparent'
              }`}
            >
              <Palette className={`w-3.5 h-3.5 ${currentTab === 'dominantColor' ? 'text-zinc-900' : 'text-zinc-400'}`} />
              <span>Cover Palette Treemap</span>
            </button>

            <button
              id="tab-multi-treemap"
              onClick={() => onTabChange('multiTreemap')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                currentTab === 'multiTreemap'
                  ? 'bg-zinc-200 text-zinc-950 font-bold border border-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850 border border-transparent'
              }`}
            >
              <LayoutGrid className={`w-3.5 h-3.5 ${currentTab === 'multiTreemap' ? 'text-zinc-900' : 'text-zinc-400'}`} />
              <span>Multi-Treemap Explorer</span>
            </button>

            <button
              id="tab-analytics"
              onClick={() => onTabChange('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                currentTab === 'analytics'
                  ? 'bg-zinc-200 text-zinc-950 font-bold border border-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850 border border-transparent'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${currentTab === 'analytics' ? 'text-zinc-900' : 'text-zinc-400'}`} />
              <span>Chromatic Analytics</span>
            </button>

            <button
              id="tab-export"
              onClick={() => onTabChange('export')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                currentTab === 'export'
                  ? 'bg-zinc-200 text-zinc-950 font-bold border border-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850 border border-transparent'
              }`}
            >
              <Share2 className={`w-3.5 h-3.5 ${currentTab === 'export' ? 'text-zinc-900' : 'text-zinc-400'}`} />
              <span>Reports & Social Posts</span>
            </button>
          </nav>

          {/* Search and Metric Control */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="library-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search title, author, tag..."
                className="w-full bg-zinc-850 text-zinc-200 placeholder-zinc-500 text-xs pl-9 pr-3 py-1.5 rounded-lg border border-zinc-700/70 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Treemap Size Metric Selector */}
            <div className="flex items-center bg-zinc-850 p-1 rounded-lg border border-zinc-700/70 text-xs">
              <span className="text-[10px] text-zinc-400 px-2 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
                <span className="hidden md:inline">Size:</span>
              </span>
              <button
                id="metric-count"
                onClick={() => onMetricChange('count')}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                  metric === 'count'
                    ? 'bg-zinc-200 text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Count
              </button>
              <button
                id="metric-duration"
                onClick={() => onMetricChange('duration')}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                  metric === 'duration'
                    ? 'bg-zinc-200 text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hours
              </button>
              <button
                id="metric-filesize"
                onClick={() => onMetricChange('fileSize')}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                  metric === 'fileSize'
                    ? 'bg-zinc-200 text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Size
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
