/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Audiobook, 
  TreemapMetric, 
  TreemapNode, 
  TreemapViewType,
  ActiveFilters 
} from '../types';
import { buildTreemapHierarchy } from '../utils/treemapUtils';
import { formatHours, COLOR_FAMILY_PALETTES } from '../utils/colorUtils';
import { 
  Sparkles, 
  LayoutGrid, 
  Layers, 
  Tags, 
  Calendar, 
  Users, 
  Palette, 
  Filter, 
  X, 
  Check, 
  BookOpen, 
  ArrowLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { AudiobookCard } from './AudiobookCard';

interface MultiTreemapViewProps {
  allBooks: Audiobook[];
  metric: TreemapMetric;
  activeFilters: ActiveFilters;
  onUpdateFilters: (filters: ActiveFilters) => void;
  onClearFilters: () => void;
  onOpenBookDetail: (book: Audiobook) => void;
  onBackToDominantColor: () => void;
}

export const MultiTreemapView: React.FC<MultiTreemapViewProps> = ({
  allBooks,
  metric,
  activeFilters,
  onUpdateFilters,
  onClearFilters,
  onOpenBookDetail,
  onBackToDominantColor
}) => {
  const [activeFacet, setActiveFacet] = useState<TreemapViewType>('genre');
  const [layoutMode, setLayoutMode] = useState<'focused' | 'quadGrid'>('focused');
  const [hoveredNode, setHoveredNode] = useState<TreemapNode | null>(null);

  // Filter books according to active multi-filters
  const filteredBooks = allBooks.filter(book => {
    if (activeFilters.colorFamily && book.dominantColor.colorFamily !== activeFilters.colorFamily) {
      return false;
    }
    if (activeFilters.colorHex && book.dominantColor.hex !== activeFilters.colorHex) {
      return false;
    }
    if (activeFilters.genre && !book.genres.includes(activeFilters.genre)) {
      return false;
    }
    if (activeFilters.author && book.author !== activeFilters.author) {
      return false;
    }
    if (activeFilters.year && book.year !== activeFilters.year) {
      return false;
    }
    if (activeFilters.decade) {
      const bookDecade = `${Math.floor(book.year / 10) * 10}s`;
      if (bookDecade !== activeFilters.decade) return false;
    }
    if (activeFilters.tag && !book.tags.includes(activeFilters.tag)) {
      return false;
    }
    if (activeFilters.searchQuery) {
      const q = activeFilters.searchQuery.toLowerCase();
      const match = book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.genres.some(g => g.toLowerCase().includes(q)) ||
        book.tags.some(t => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const hasActiveFilters = Object.values(activeFilters).some(v => Boolean(v));

  return (
    <div id="multi-treemap-view-root" className="space-y-6 animate-fadeIn">
      
      {/* Active Breadcrumb & Filter Bar */}
      <div className="bg-[#16191E] border border-white/5 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onBackToDominantColor}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1F232B] hover:bg-white/10 text-slate-300 hover:text-white rounded-full text-xs font-semibold transition-colors shrink-0 border border-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Color Treemap</span>
            </button>

            <span className="text-slate-600 hidden sm:inline">•</span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-400">Filtered By:</span>
              
              {activeFilters.colorFamily && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium rounded-full">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shadow-sm" 
                    style={{ backgroundColor: COLOR_FAMILY_PALETTES[activeFilters.colorFamily]?.bgHex || '#6366f1' }} 
                  />
                  <span>Color: {activeFilters.colorFamily}</span>
                  <button 
                    onClick={() => onUpdateFilters({ ...activeFilters, colorFamily: undefined, colorHex: undefined })}
                    className="hover:text-white font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              )}

              {activeFilters.genre && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium rounded-full">
                  <span>Genre: {activeFilters.genre}</span>
                  <button 
                    onClick={() => onUpdateFilters({ ...activeFilters, genre: undefined })}
                    className="hover:text-white font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              )}

              {activeFilters.author && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium rounded-full">
                  <span>Author: {activeFilters.author}</span>
                  <button 
                    onClick={() => onUpdateFilters({ ...activeFilters, author: undefined })}
                    className="hover:text-white font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              )}

              {activeFilters.decade && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium rounded-full">
                  <span>Era: {activeFilters.decade}</span>
                  <button 
                    onClick={() => onUpdateFilters({ ...activeFilters, decade: undefined })}
                    className="hover:text-white font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              )}

              {activeFilters.tag && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium rounded-full">
                  <span>Tag: {activeFilters.tag}</span>
                  <button 
                    onClick={() => onUpdateFilters({ ...activeFilters, tag: undefined })}
                    className="hover:text-white font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              )}

              {!hasActiveFilters && (
                <span className="text-xs text-slate-400 italic">
                  All Library Titles ({filteredBooks.length})
                </span>
              )}
            </div>
          </div>

          {/* Clear Filter / Layout Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="px-3 py-1 bg-[#1F232B] hover:bg-white/10 text-slate-300 hover:text-white rounded-full text-xs font-medium transition-colors border border-white/5"
              >
                Clear All Filters
              </button>
            )}

            <div className="flex items-center bg-[#1F232B] p-1 rounded-full border border-white/10 text-xs">
              <button
                onClick={() => setLayoutMode('focused')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  layoutMode === 'focused'
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Focused Tabs
              </button>
              <button
                onClick={() => setLayoutMode('quadGrid')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  layoutMode === 'quadGrid'
                    ? 'bg-indigo-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                4-Treemap Grid
              </button>
            </div>
          </div>

        </div>

        {/* Facet Tabs (When in Focused Mode) */}
        {layoutMode === 'focused' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-white/5 scrollbar-none">
            <button
              onClick={() => setActiveFacet('genre')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                activeFacet === 'genre'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#1F232B] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Genres Treemap</span>
            </button>

            <button
              onClick={() => setActiveFacet('year')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                activeFacet === 'year'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#1F232B] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>2. Publication Years Treemap</span>
            </button>

            <button
              onClick={() => setActiveFacet('tags')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                activeFacet === 'tags'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#1F232B] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Tags className="w-3.5 h-3.5" />
              <span>3. Tags & Tropes Treemap</span>
            </button>

            <button
              onClick={() => setActiveFacet('author')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                activeFacet === 'author'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#1F232B] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>4. Author Names Treemap</span>
            </button>

            <button
              onClick={() => setActiveFacet('palette')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                activeFacet === 'palette'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#1F232B] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>5. Palette Swatches Treemap</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Treemaps Display */}
      {layoutMode === 'focused' ? (
        <SingleTreemapCard
          title={
            activeFacet === 'genre' ? 'Genres Treemap' :
            activeFacet === 'year' ? 'Publication Decades & Years Treemap' :
            activeFacet === 'tags' ? 'Thematic Tags & Tropes Treemap' :
            activeFacet === 'author' ? 'Authors Treemap' :
            'Palette Swatches & Color Harmonies Treemap'
          }
          viewType={activeFacet}
          books={filteredBooks}
          metric={metric}
          onNodeClick={(node) => {
            if (node.audiobook) {
              onOpenBookDetail(node.audiobook);
            } else if (activeFacet === 'genre' && node.category) {
              onUpdateFilters({ ...activeFilters, genre: node.name });
            } else if (activeFacet === 'year' && node.category === 'Decade') {
              onUpdateFilters({ ...activeFilters, decade: node.name });
            } else if (activeFacet === 'author' && node.category === 'Author') {
              onUpdateFilters({ ...activeFilters, author: node.name });
            } else if (activeFacet === 'tags' && node.name) {
              onUpdateFilters({ ...activeFilters, tag: node.name });
            }
          }}
          onOpenDetail={onOpenBookDetail}
        />
      ) : (
        /* 4-Treemap Simultaneous Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SingleTreemapCard
            title="1. Genres Treemap"
            viewType="genre"
            books={filteredBooks}
            metric={metric}
            height={340}
            onNodeClick={(node) => {
              if (node.audiobook) onOpenBookDetail(node.audiobook);
              else onUpdateFilters({ ...activeFilters, genre: node.name });
            }}
            onOpenDetail={onOpenBookDetail}
          />
          <SingleTreemapCard
            title="2. Publication Years Treemap"
            viewType="year"
            books={filteredBooks}
            metric={metric}
            height={340}
            onNodeClick={(node) => {
              if (node.audiobook) onOpenBookDetail(node.audiobook);
              else onUpdateFilters({ ...activeFilters, decade: node.name });
            }}
            onOpenDetail={onOpenBookDetail}
          />
          <SingleTreemapCard
            title="3. Tags & Tropes Treemap"
            viewType="tags"
            books={filteredBooks}
            metric={metric}
            height={340}
            onNodeClick={(node) => {
              if (node.audiobook) onOpenBookDetail(node.audiobook);
              else onUpdateFilters({ ...activeFilters, tag: node.name });
            }}
            onOpenDetail={onOpenBookDetail}
          />
          <SingleTreemapCard
            title="4. Authors Treemap"
            viewType="author"
            books={filteredBooks}
            metric={metric}
            height={340}
            onNodeClick={(node) => {
              if (node.audiobook) onOpenBookDetail(node.audiobook);
              else onUpdateFilters({ ...activeFilters, author: node.name });
            }}
            onOpenDetail={onOpenBookDetail}
          />
        </div>
      )}

      {/* Synchronized Audiobooks Catalog Grid */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white font-sans flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Matching Audiobooks ({filteredBooks.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive cards with extracted palettes, audio specs, and chapter details
            </p>
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="p-8 text-center bg-[#16191E] rounded-2xl border border-white/5 space-y-3">
            <p className="text-sm text-slate-300 font-semibold">No audiobooks match the active filters.</p>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-full"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBooks.map((book) => (
              <AudiobookCard
                key={book.id}
                audiobook={book}
                onOpenDetail={() => onOpenBookDetail(book)}
                onFilterGenre={(g) => onUpdateFilters({ ...activeFilters, genre: g })}
                onFilterAuthor={(a) => onUpdateFilters({ ...activeFilters, author: a })}
                onFilterTag={(t) => onUpdateFilters({ ...activeFilters, tag: t })}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

interface SingleTreemapCardProps {
  title: string;
  viewType: TreemapViewType;
  books: Audiobook[];
  metric: TreemapMetric;
  height?: number;
  onNodeClick: (node: TreemapNode) => void;
  onOpenDetail: (book: Audiobook) => void;
}

const SingleTreemapCard: React.FC<SingleTreemapCardProps> = ({
  title,
  viewType,
  books,
  metric,
  height = 500,
  onNodeClick,
  onOpenDetail
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 700, height });
  const [hoveredNode, setHoveredNode] = useState<TreemapNode | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.max(280, Math.round(entry.contentRect.width)),
          height: height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  const nodes = buildTreemapHierarchy(books, viewType, metric, dimensions.width, dimensions.height, 4);

  return (
    <div className="bg-[#16191E] border border-white/5 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs sm:text-sm font-semibold text-slate-200 font-sans tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>{title}</span>
        </h4>
        <span className="text-[10px] font-mono text-slate-500">
          Click tile to filter or inspect
        </span>
      </div>

      <div 
        ref={containerRef}
        className="w-full bg-[#0F1115] rounded-xl border border-white/5 overflow-hidden relative select-none"
        style={{ height }}
      >
        <svg width={dimensions.width} height={dimensions.height} className="w-full h-full block">
          {nodes.map((node) => {
            const x = node.x0 || 0;
            const y = node.y0 || 0;
            const w = Math.max(0, (node.x1 || 0) - x);
            const h = Math.max(0, (node.y1 || 0) - y);
            const isHovered = hoveredNode?.id === node.id;

            if (w <= 2 || h <= 2) return null;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer transition-all duration-150"
                onClick={() => onNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <rect
                  width={w}
                  height={h}
                  fill={node.color}
                  rx={6}
                  ry={6}
                  stroke={isHovered ? '#ffffff' : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all"
                  style={{
                    filter: isHovered ? 'brightness(1.15) drop-shadow(0 4px 10px rgba(0,0,0,0.5))' : 'none'
                  }}
                />

                {w > 65 && h > 28 && (
                  <foreignObject width={w} height={h} className="pointer-events-none p-1.5 overflow-hidden">
                    <div 
                      className="h-full flex flex-col justify-center text-center"
                      style={{ color: node.textColor }}
                    >
                      <p className="text-[10px] sm:text-xs font-bold leading-tight truncate drop-shadow-sm">
                        {node.name}
                      </p>
                      {h > 45 && (
                        <p className="text-[9px] opacity-80 truncate">
                          {node.category || node.audiobook?.author}
                        </p>
                      )}
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredNode && (
          <div className="pointer-events-none absolute bottom-2 left-2 z-20 bg-[#16191E]/95 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-slate-200 shadow-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredNode.color }} />
            <strong className="font-bold text-white">{hoveredNode.name}</strong>
            {hoveredNode.audiobook && (
              <span className="text-slate-400">by {hoveredNode.audiobook.author}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
