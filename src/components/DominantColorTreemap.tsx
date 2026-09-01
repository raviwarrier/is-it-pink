/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Audiobook, 
  TreemapMetric, 
  TreemapNode, 
  ActiveFilters 
} from '../types';
import { buildTreemapHierarchy } from '../utils/treemapUtils';
import { 
  formatHours, 
  formatBytes, 
  COLOR_FAMILY_PALETTES 
} from '../utils/colorUtils';
import { 
  Sparkles, 
  Clock, 
  BookOpen, 
  User, 
  Layers, 
  ArrowRight, 
  LayoutGrid,
  List,
  Info,
  ChevronRight
} from 'lucide-react';
import { BookListGridView } from './BookListGridView';

interface DominantColorTreemapProps {
  audiobooks: Audiobook[];
  metric: TreemapMetric;
  onSelectColorBox?: (audiobook: Audiobook, colorFamily?: string) => void;
  onOpenBookDetail: (audiobook: Audiobook) => void;
  activeFilters: ActiveFilters;
  onFilterColorFamily: (family?: string) => void;
}

export const DominantColorTreemap: React.FC<DominantColorTreemapProps> = ({
  audiobooks,
  metric,
  onSelectColorBox,
  onOpenBookDetail,
  activeFilters,
  onFilterColorFamily,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 900, height: 560 });
  const [hoveredNode, setHoveredNode] = useState<TreemapNode | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [renderStyle, setRenderStyle] = useState<'solid' | 'cover'>('solid');

  // Level 2 Selection State: When a block is clicked, drill down to Level 2 list/grid
  const [level2Selection, setLevel2Selection] = useState<{
    label: string;
    books: Audiobook[];
    colorHex?: string;
    colorFamily?: string;
  } | null>(null);

  // ResizeObserver for fluid, dynamic container sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const calcHeight = Math.max(480, Math.min(680, Math.round(width * 0.58)));
        setDimensions({ width: Math.max(320, Math.round(width)), height: calcHeight });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter audiobooks if colorFamily filter is active
  const filteredBooks = activeFilters.colorFamily
    ? audiobooks.filter(b => b.dominantColor.colorFamily === activeFilters.colorFamily)
    : audiobooks;

  // Build Treemap layout using D3 (memoized for high-volume performance with 4,700+ books)
  const nodes = React.useMemo(() => {
    return buildTreemapHierarchy(
      filteredBooks,
      'dominantColor',
      metric,
      dimensions.width,
      dimensions.height,
      filteredBooks.length > 500 ? 1 : 3
    );
  }, [filteredBooks, metric, dimensions.width, dimensions.height]);

  // Handler for clicking a block on Level 1
  const handleBlockClick = (node: TreemapNode) => {
    const book = node.audiobook;
    let groupBooks: Audiobook[] = [];
    let label = '';
    const fam = node.colorFamily || book?.dominantColor.colorFamily;

    if (fam) {
      groupBooks = audiobooks.filter(b => b.dominantColor.colorFamily === fam);
      label = `${fam} Color Family`;
    } else if (book) {
      groupBooks = [book];
      label = book.title;
    } else {
      groupBooks = filteredBooks;
      label = 'Selected Collection';
    }

    // Set Level 2 state
    setLevel2Selection({
      label,
      books: groupBooks.length > 0 ? groupBooks : (book ? [book] : filteredBooks),
      colorHex: node.hex || book?.dominantColor.hex,
      colorFamily: fam
    });
  };

  // If currently in Level 2 view, render the dedicated BookListGridView
  if (level2Selection) {
    return (
      <BookListGridView
        books={level2Selection.books}
        selectedLabel={level2Selection.label}
        selectedColorHex={level2Selection.colorHex}
        selectedColorFamily={level2Selection.colorFamily}
        onBackToTreemap={() => setLevel2Selection(null)}
        onOpenBookDetail={onOpenBookDetail}
      />
    );
  }

  // Level 1: Pure Visual Treemap of Book Covers
  return (
    <div id="level1-cover-treemap-root" className="space-y-4 animate-fadeIn">
      
      {/* Top Chromatic Spectrum Filter Strip & Level Indicators */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-[#14171D] p-3.5 rounded-xl border border-zinc-800 shadow-md">
        
        {/* Left: Spectrum Label */}
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <Sparkles className="w-4 h-4 text-amber-200/90" />
          <span className="uppercase tracking-wider text-[11px] text-zinc-400 font-bold">
            Level 1 • Cover Spectrum Treemap:
          </span>
        </div>

        {/* Color Family Filter Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onFilterColorFamily(undefined)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              !activeFilters.colorFamily
                ? 'bg-zinc-200 text-zinc-950 font-bold border border-white shadow-xs'
                : 'bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-750 hover:bg-zinc-800'
            }`}
          >
            All Colors ({audiobooks.length.toLocaleString()})
          </button>

          {Object.entries(COLOR_FAMILY_PALETTES).map(([family, config]) => {
            const count = audiobooks.filter(b => b.dominantColor.colorFamily === family).length;
            if (count === 0) return null;
            const isSelected = activeFilters.colorFamily === family;

            return (
              <button
                key={family}
                onClick={() => onFilterColorFamily(isSelected ? undefined : family)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                  isSelected
                    ? 'border-white ring-2 ring-white/40 text-white font-bold shadow-sm'
                    : 'border-zinc-750 text-zinc-300 hover:border-zinc-600 bg-zinc-850 hover:bg-zinc-800'
                }`}
                style={{
                  backgroundColor: isSelected ? config.bgHex : undefined,
                  color: isSelected ? config.textHex : undefined
                }}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-sm shadow-xs shrink-0"
                  style={{ backgroundColor: config.bgHex }} 
                />
                <span>{family}</span>
                <span className="text-[10px] opacity-75">({count.toLocaleString()})</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Render Style & Level 2 List button */}
        <div className="flex items-center gap-2">
          {/* Render Style Toggle */}
          <div className="flex items-center bg-zinc-850 p-1 rounded-lg border border-zinc-750 text-[11px]">
            <button
              onClick={() => setRenderStyle('solid')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                renderStyle === 'solid'
                  ? 'bg-zinc-200 text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Display pure radiant chromatic color blocks"
            >
              Solid Colors
            </button>
            <button
              onClick={() => setRenderStyle('cover')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                renderStyle === 'cover'
                  ? 'bg-zinc-200 text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Blend cover artwork with dominant color tint"
            >
              Cover Blend
            </button>
          </div>

          {/* View All as Level 2 list button */}
          <button
            onClick={() => {
              setLevel2Selection({
                label: activeFilters.colorFamily ? `${activeFilters.colorFamily} Palette` : 'All Library Audiobooks',
                books: filteredBooks,
                colorFamily: activeFilters.colorFamily
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-zinc-700 cursor-pointer shadow-xs"
            title="Open Level 2 List View"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-zinc-400" />
            <span>View Books List →</span>
          </button>
        </div>

      </div>

      {/* Level 1 Treemap Canvas */}
      <div 
        ref={containerRef}
        id="dominant-color-treemap-container"
        className="relative w-full bg-[#0E1015] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden group select-none min-h-[500px]"
        onMouseMove={(e) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        }}
        onMouseLeave={() => setHoveredNode(null)}
      >
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center p-6 space-y-3">
            <Layers className="w-12 h-12 text-zinc-600 animate-pulse" />
            <p className="text-sm font-semibold text-zinc-300">No audiobooks match current chromatic filter</p>
            <button
              onClick={() => onFilterColorFamily(undefined)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg border border-zinc-700 cursor-pointer shadow-sm"
            >
              Reset Color Filters
            </button>
          </div>
        ) : (
          <svg 
            width={dimensions.width} 
            height={dimensions.height}
            className="w-full h-full block"
          >
            {nodes.map((node) => {
              const x = node.x0 || 0;
              const y = node.y0 || 0;
              const w = Math.max(0, (node.x1 || 0) - x);
              const h = Math.max(0, (node.y1 || 0) - y);
              const isHovered = hoveredNode?.id === node.id;
              const book = node.audiobook;

              if (w <= 0.5 || h <= 0.5) return null;
              const cornerRadius = (w > 14 && h > 14) ? 4 : 0;

              return (
                <g
                  key={node.id}
                  id={`treemap-box-${node.id}`}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer"
                  onClick={() => handleBlockClick(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                >
                  {/* Base Solid Chromatic Rectangle */}
                  <rect
                    width={w}
                    height={h}
                    rx={cornerRadius}
                    ry={cornerRadius}
                    fill={node.color}
                    className="transition-colors duration-150"
                  />

                  {/* Optional Cover Blend Mode */}
                  {renderStyle === 'cover' && book && book.coverUrl && w > 8 && h > 8 && (
                    <>
                      <image
                        href={book.coverUrl}
                        width={w}
                        height={h}
                        preserveAspectRatio="xMidYMid slice"
                        opacity={isHovered ? 0.95 : 0.88}
                      />
                      <rect
                        width={w}
                        height={h}
                        rx={cornerRadius}
                        ry={cornerRadius}
                        fill={node.color}
                        opacity={0.25}
                        className="mix-blend-color"
                      />
                    </>
                  )}

                  {/* Subtle color badge pill on bottom-right for large blocks */}
                  {w > 65 && h > 40 && (
                    <rect
                      x={w - 18}
                      y={h - 18}
                      width={12}
                      height={12}
                      rx={3}
                      ry={3}
                      fill={node.hex || node.color}
                      stroke="#ffffff"
                      strokeWidth={1}
                      strokeOpacity={0.4}
                    />
                  )}

                  {/* High-contrast border outline on hover */}
                  <rect
                    width={w}
                    height={h}
                    rx={cornerRadius}
                    ry={cornerRadius}
                    fill="none"
                    stroke={isHovered ? '#ffffff' : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isHovered ? 2.5 : 0.5}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip / Floating Preview Card */}
        {hoveredNode && hoveredNode.audiobook && (
          <div
            id="treemap-hover-card"
            className="pointer-events-none absolute z-30 w-80 bg-[#16191E]/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-4 shadow-2xl text-zinc-200 space-y-3 animate-fadeIn"
            style={{
              left: Math.min(mousePos.x + 16, dimensions.width - 340),
              top: Math.min(mousePos.y + 16, dimensions.height - 240),
            }}
          >
            <div className="flex gap-3">
              {/* Cover Thumbnail */}
              <div 
                className="w-16 h-24 rounded-lg overflow-hidden shrink-0 shadow-md border border-white/10 relative bg-[#090B0E]"
              >
                <img
                  src={hoveredNode.audiobook.coverUrl}
                  alt={hoveredNode.audiobook.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Meta Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span 
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0" 
                    style={{ backgroundColor: hoveredNode.hex }}
                  />
                  <span className="text-[10px] font-mono font-semibold text-amber-200/90 truncate">
                    {hoveredNode.colorName} ({hoveredNode.hex})
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                  {hoveredNode.audiobook.title}
                </h3>
                
                <p className="text-xs text-zinc-300 flex items-center gap-1">
                  <User className="w-3 h-3 text-zinc-500" />
                  <span className="truncate">{hoveredNode.audiobook.author}</span>
                </p>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {formatHours(hoveredNode.audiobook.durationHours)}
                  </span>
                  <span>•</span>
                  <span>{hoveredNode.audiobook.year}</span>
                </div>
              </div>
            </div>

            {/* Extracted 4-5 Color Palette Swatches */}
            <div className="space-y-1 pt-2 border-t border-zinc-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Cover Palette:
              </span>
              <div className="flex h-4 rounded-md overflow-hidden border border-zinc-750 shadow-inner">
                {hoveredNode.audiobook.palette.map((swatch, idx) => (
                  <div
                    key={idx}
                    className="h-full"
                    style={{ 
                      backgroundColor: swatch.hex, 
                      width: `${swatch.percentage || 25}%` 
                    }}
                    title={`${swatch.colorName} (${swatch.hex}) - ${swatch.percentage}%`}
                  />
                ))}
              </div>
            </div>

            {/* Click Navigation Prompt */}
            <div className="flex items-center justify-between text-[11px] text-zinc-200 font-semibold bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700">
              <span>Click block → Open Level 2 List/Grid</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
        )}

      </div>

      {/* Helpful Navigation Guidance Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-400" />
          <span><strong>Level 1 (Cover Treemap):</strong> Click on any cover block to drill down into <strong>Level 2 (List or Grid View)</strong>.</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500">
          <span>{filteredBooks.length.toLocaleString()} / {audiobooks.length.toLocaleString()} audiobooks shown</span>
        </div>
      </div>

    </div>
  );
};
