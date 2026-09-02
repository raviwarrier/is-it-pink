/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Audiobook, 
  TreemapMetric, 
  TreemapNode, 
  ActiveFilters 
} from '../types';
import { 
  buildFamilyContiguousTreemap, 
  buildFamilyBreakupTreemap,
  normalizeAudiobooks 
} from '../utils/treemapUtils';
import { 
  formatHours, 
  formatBytes, 
  COLOR_FAMILY_PALETTES,
  getContrastTextColor 
} from '../utils/colorUtils';
import { 
  Sparkles, 
  Clock, 
  User, 
  Layers, 
  ArrowRight, 
  LayoutGrid,
  ArrowLeft,
  ChevronRight,
  ZoomIn
} from 'lucide-react';
import { BookListGridView } from './BookListGridView';
import { ErrorBoundary } from './ErrorBoundary';

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
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 960, height: 560 });
  const [hoveredNode, setHoveredNode] = useState<TreemapNode | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [renderStyle, setRenderStyle] = useState<'solid' | 'cover'>('solid');

  // Multi-Level Navigation: Level 1 (Family Contiguous) -> Level 2 (Family Breakup) -> Level 3 (Book List/Grid)
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedSubBlock, setSelectedSubBlock] = useState<{
    label: string;
    books: Audiobook[];
    colorHex?: string;
    colorFamily?: string;
  } | null>(null);

  // Sync external filter with internal level state if filter changed from outside
  useEffect(() => {
    if (activeFilters.colorFamily) {
      setSelectedFamily(activeFilters.colorFamily);
      setCurrentLevel(2);
    }
  }, [activeFilters.colorFamily]);

  // Robust, fluid dynamic resizing for window maximize / restore and container layout changes
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerW = rect.width || containerRef.current.clientWidth || (window.innerWidth ? window.innerWidth - 64 : 960);
    const validW = Math.max(320, Math.round(containerW));
    const calcH = Math.max(480, Math.min(720, Math.round(validW * 0.55)));
    setDimensions({ width: validW, height: calcH });
  }, []);

  useEffect(() => {
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        updateDimensions();
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const handleWindowResize = () => {
      window.requestAnimationFrame(() => {
        updateDimensions();
      });
    };

    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('orientationchange', handleWindowResize);

    // Initial check after paint
    const timer = setTimeout(updateDimensions, 100);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleWindowResize);
      clearTimeout(timer);
    };
  }, [updateDimensions]);

  // Books filtered by search/collection
  const currentBooks = audiobooks;

  // Level 1 Nodes: One Contiguous Block per Color Family (Red, Orange & Brown, Yellow, Green, Blue, Indigo, Violet, Pink, Black & Dark Gray, White & Light Gray)
  const level1Nodes = useMemo(() => {
    if (currentBooks.length === 0) return [];
    return buildFamilyContiguousTreemap(
      currentBooks,
      metric,
      dimensions.width,
      dimensions.height,
      1 // minimal gap (1px)
    );
  }, [currentBooks, metric, dimensions.width, dimensions.height]);

  // Level 2 Books for the selected family
  const familyBooks = useMemo(() => {
    if (!selectedFamily) return currentBooks;
    return currentBooks.filter(b => (b.dominantColor.colorFamily || (b.dominantColor.luminance > 0.5 ? 'White' : 'Black')) === selectedFamily);
  }, [currentBooks, selectedFamily]);

  // Level 2 Nodes: Breakup blocks (individual books / shades of that color family)
  const level2Nodes = useMemo(() => {
    if (familyBooks.length === 0) return [];
    return buildFamilyBreakupTreemap(
      familyBooks,
      metric,
      dimensions.width,
      dimensions.height,
      1 // minimal gap (1px)
    );
  }, [familyBooks, metric, dimensions.width, dimensions.height]);

  // Total library duration & bytes for metrics
  const totalLibHours = useMemo(() => currentBooks.reduce((sum, b) => sum + b.durationHours, 0), [currentBooks]);
  const totalFamilyHours = useMemo(() => familyBooks.reduce((sum, b) => sum + b.durationHours, 0), [familyBooks]);

  // Click Handler for Level 1: One Contiguous Color Family Block -> Go to Level 2
  const handleLevel1BlockClick = (node: TreemapNode) => {
    const fam = node.colorFamily || node.name;
    setSelectedFamily(fam);
    onFilterColorFamily(fam);
    setCurrentLevel(2);
    setHoveredNode(null);
  };

  // Click Handler for Level 2: Sub-Color Breakup Block -> Go to Level 3
  const handleLevel2BlockClick = (node: TreemapNode) => {
    let rawBooks = node.audiobooks && node.audiobooks.length > 0 
      ? node.audiobooks 
      : (node.audiobook ? [node.audiobook] : familyBooks);
    
    if (!rawBooks || rawBooks.length === 0) {
      rawBooks = familyBooks.length > 0 ? familyBooks : currentBooks;
    }

    const safeBooks = normalizeAudiobooks(rawBooks);
    const colorLabel = node.colorName || node.name || 'Sub-Color Selection';
    const label = `${colorLabel} (${safeBooks.length} ${safeBooks.length === 1 ? 'Book' : 'Books'})`;

    setSelectedSubBlock({
      label,
      books: safeBooks,
      colorHex: node.hex || node.color,
      colorFamily: selectedFamily || undefined
    });
    setCurrentLevel(3);
    setHoveredNode(null);
  };

  // If in Level 3: Dedicated Grid/List View
  if (currentLevel === 3) {
    const activeSubBlock = selectedSubBlock || {
      label: selectedFamily ? `${selectedFamily} Audiobooks` : 'All Audiobooks',
      books: normalizeAudiobooks(familyBooks.length > 0 ? familyBooks : currentBooks),
      colorFamily: selectedFamily || undefined,
      colorHex: selectedFamily ? COLOR_FAMILY_PALETTES[selectedFamily]?.bgHex : undefined
    };

    return (
      <div className="space-y-3 animate-fadeIn">
        {/* Breadcrumb Navigation Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 bg-[#14171D] px-4 py-3 rounded-xl border border-zinc-800 shadow-md">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                setCurrentLevel(1);
                setSelectedFamily(null);
                onFilterColorFamily(undefined);
              }}
              className="text-zinc-400 hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Level 1: All Colors</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <button
              onClick={() => setCurrentLevel(2)}
              className="text-zinc-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
            >
              {selectedFamily && (
                <span 
                  className="w-2.5 h-2.5 rounded-sm shadow-xs inline-block" 
                  style={{ backgroundColor: COLOR_FAMILY_PALETTES[selectedFamily]?.bgHex || '#3b82f6' }} 
                />
              )}
              <span>Level 2: {selectedFamily || 'Color'} Breakup</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-amber-200/90 font-semibold">
              Level 3: Book List ({activeSubBlock.books.length})
            </span>
          </div>

          <button
            onClick={() => setCurrentLevel(2)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-zinc-700 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Color Breakup</span>
          </button>
        </div>

        {/* Level 3 Books List Grid View inside Error Boundary */}
        <ErrorBoundary fallbackTitle="Audiobook Inspector Recovery" onReset={() => setCurrentLevel(2)}>
          <BookListGridView
            books={activeSubBlock.books}
            selectedLabel={activeSubBlock.label}
            selectedColorHex={activeSubBlock.colorHex}
            selectedColorFamily={activeSubBlock.colorFamily}
            onBackToTreemap={() => setCurrentLevel(2)}
            onOpenBookDetail={onOpenBookDetail}
          />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div id="cover-treemap-root" className="space-y-4 animate-fadeIn">
      
      {/* Top Filter Strip with Refined Mid-Gray Selected State & White Filter Included */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-[#14171D] p-3 rounded-xl border border-zinc-800/80 shadow-md">
        
        {/* Left: Breadcrumbs / Active Level Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <Sparkles className="w-4 h-4 text-amber-200/90" />
          {currentLevel === 1 ? (
            <span className="uppercase tracking-wider text-[11px] text-zinc-300 font-bold">
              Level 1 • Color Spectrum Overview
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setCurrentLevel(1);
                  setSelectedFamily(null);
                  onFilterColorFamily(undefined);
                }}
                className="text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Colors</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-zinc-100 font-bold flex items-center gap-1.5">
                {selectedFamily && (
                  <span 
                    className="w-2.5 h-2.5 rounded-sm shadow-xs shrink-0 inline-block" 
                    style={{ backgroundColor: COLOR_FAMILY_PALETTES[selectedFamily]?.bgHex || '#3b82f6' }} 
                  />
                )}
                {selectedFamily} Breakup (Level 2)
              </span>
            </div>
          )}
        </div>

        {/* Color Family Filter Pills: Mid-gray background when selected, faint borders */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setSelectedFamily(null);
              onFilterColorFamily(undefined);
              setCurrentLevel(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              !selectedFamily && currentLevel === 1
                ? 'bg-zinc-700 text-zinc-100 font-semibold border border-transparent shadow-xs'
                : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:bg-zinc-850 hover:border-zinc-700/40'
            }`}
          >
            All Colors ({audiobooks.length.toLocaleString()})
          </button>

          {Object.entries(COLOR_FAMILY_PALETTES).map(([family, config]) => {
            const count = audiobooks.filter(b => (b.dominantColor.colorFamily || (b.dominantColor.luminance > 0.5 ? 'White' : 'Black')) === family).length;
            if (count === 0) return null;
            const isSelected = selectedFamily === family;

            return (
              <button
                key={family}
                onClick={() => {
                  if (isSelected && currentLevel === 2) {
                    setSelectedFamily(null);
                    onFilterColorFamily(undefined);
                    setCurrentLevel(1);
                  } else {
                    setSelectedFamily(family);
                    onFilterColorFamily(family);
                    setCurrentLevel(2);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-700 text-zinc-100 font-semibold border border-transparent shadow-xs'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:bg-zinc-850 hover:border-zinc-700/40'
                }`}
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

        {/* Right Controls: Render Style & Level 3 List button */}
        <div className="flex items-center gap-2">
          {currentLevel === 2 && (
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
              <button
                onClick={() => setRenderStyle('solid')}
                className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  renderStyle === 'solid'
                    ? 'bg-zinc-700 text-white font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Display solid chromatic color blocks"
              >
                Solid
              </button>
              <button
                onClick={() => setRenderStyle('cover')}
                className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  renderStyle === 'cover'
                    ? 'bg-zinc-700 text-white font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Blend cover artwork"
              >
                Cover
              </button>
            </div>
          )}

          {/* View Books as Level 3 list button */}
          <button
            onClick={() => {
              const books = currentLevel === 2 ? familyBooks : currentBooks;
              setSelectedSubBlock({
                label: selectedFamily ? `${selectedFamily} Color Family` : 'All Audiobooks',
                books,
                colorFamily: selectedFamily || undefined
              });
              setCurrentLevel(3);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-zinc-700 cursor-pointer shadow-xs"
            title="Open Level 3 List View"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-zinc-400" />
            <span>View Books List →</span>
          </button>
        </div>

      </div>

      {/* Main Treemap Canvas Container */}
      <div 
        ref={containerRef}
        id="dominant-color-treemap-container"
        className="relative w-full bg-[#0B0D11] rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden group select-none min-h-[500px]"
        onMouseMove={(e) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        }}
        onMouseLeave={() => setHoveredNode(null)}
      >
        {((currentLevel === 1 && level1Nodes.length === 0) || (currentLevel === 2 && level2Nodes.length === 0)) ? (
          <div className="flex flex-col items-center justify-center h-96 text-center p-6 space-y-3">
            <Layers className="w-12 h-12 text-zinc-600 animate-pulse" />
            <p className="text-sm font-semibold text-zinc-300">No audiobooks match current chromatic filter</p>
            <button
              onClick={() => {
                setSelectedFamily(null);
                onFilterColorFamily(undefined);
                setCurrentLevel(1);
              }}
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
            {/* LEVEL 1: One Contiguous Block per Color Represented */}
            {currentLevel === 1 && level1Nodes.map((node) => {
              const x = node.x0 || 0;
              const y = node.y0 || 0;
              const w = Math.max(0, (node.x1 || 0) - x);
              const h = Math.max(0, (node.y1 || 0) - y);
              const isHovered = hoveredNode?.id === node.id;
              if (w <= 0.5 || h <= 0.5) return null;

              const textColor = node.textColor || getContrastTextColor(node.color);
              const count = node.count || (node.audiobooks ? node.audiobooks.length : 1);
              const percentage = node.percentage || 0;

              // Format label string: "# - %"
              const labelMain = `${count} - ${percentage}%`;
              const familyName = node.name;

              return (
                <g
                  key={node.id}
                  id={`level1-box-${node.id}`}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer transition-transform"
                  onClick={() => handleLevel1BlockClick(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                >
                  {/* Solid Contiguous Color Rectangle (Zero gap / 1px inner hairline) */}
                  <rect
                    width={w}
                    height={h}
                    fill={node.color}
                    className="transition-colors duration-150"
                  />

                  {/* Contrast Label: "# - %" */}
                  {w > 45 && h > 28 && (
                    <g className="pointer-events-none select-none">
                      {/* Family Name */}
                      {w > 65 && h > 44 && (
                        <text
                          x={w / 2}
                          y={h / 2 - 8}
                          textAnchor="middle"
                          fill={textColor}
                          fontSize={Math.min(15, Math.max(11, Math.round(w / 14)))}
                          fontWeight="700"
                          opacity={0.95}
                          style={{ textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none' }}
                        >
                          {familyName}
                        </text>
                      )}
                      
                      {/* "# - %" Small font label */}
                      <text
                        x={w / 2}
                        y={w > 65 && h > 44 ? h / 2 + 10 : h / 2 + 4}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize={Math.min(13, Math.max(10, Math.round(w / 18)))}
                        fontWeight="600"
                        opacity={0.9}
                        style={{ textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none' }}
                      >
                        {labelMain}
                      </text>
                    </g>
                  )}

                  {/* Hover Outline */}
                  <rect
                    width={w}
                    height={h}
                    fill="none"
                    stroke={isHovered ? '#ffffff' : 'rgba(255,255,255,0.06)'}
                    strokeWidth={isHovered ? 2.5 : 0.5}
                  />
                </g>
              );
            })}

            {/* LEVEL 2: Breakup Sub-blocks of the selected color family */}
            {currentLevel === 2 && level2Nodes.map((node) => {
              const x = node.x0 || 0;
              const y = node.y0 || 0;
              const w = Math.max(0, (node.x1 || 0) - x);
              const h = Math.max(0, (node.y1 || 0) - y);
              const isHovered = hoveredNode?.id === node.id;
              const book = node.audiobook;
              if (w <= 0.5 || h <= 0.5) return null;

              const textColor = node.textColor || getContrastTextColor(node.hex || node.color);
              const colorName = node.colorName || node.name || 'Color Shade';
              const bookCount = node.count || (node.audiobooks ? node.audiobooks.length : 1);
              const percentage = node.percentage || 0;
              const subLabel = `${bookCount} - ${percentage}%`;

              return (
                <g
                  key={node.id}
                  id={`level2-box-${node.id}`}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer"
                  onClick={() => handleLevel2BlockClick(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                >
                  {/* Base Color Swatch */}
                  <rect
                    width={w}
                    height={h}
                    fill={node.color}
                    className="transition-colors duration-150"
                  />

                  {/* Cover Blend if enabled and single representative cover */}
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
                        fill={node.color}
                        opacity={0.25}
                        className="mix-blend-color"
                      />
                    </>
                  )}

                  {/* Labels: Main label = Color Name, Sub-label = count of books - % of sub-color */}
                  {w > 45 && h > 26 && (
                    <g className="pointer-events-none select-none">
                      {w > 65 && h > 42 ? (
                        <>
                          {/* Main Label: Name of the Color */}
                          <text
                            x={w / 2}
                            y={h / 2 - 7}
                            textAnchor="middle"
                            fill={textColor}
                            fontSize={Math.min(14, Math.max(11, Math.round(w / 14)))}
                            fontWeight="700"
                            opacity={0.95}
                            style={{ textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none' }}
                          >
                            {colorName.length > Math.floor(w / 8) ? colorName.slice(0, Math.max(4, Math.floor(w / 8) - 1)) + '…' : colorName}
                          </text>

                          {/* Sub-label: count of books - % of sub-color */}
                          <text
                            x={w / 2}
                            y={h / 2 + 10}
                            textAnchor="middle"
                            fill={textColor}
                            fontSize={Math.min(13, Math.max(10, Math.round(w / 18)))}
                            fontWeight="600"
                            opacity={0.9}
                            style={{ textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none' }}
                          >
                            {subLabel}
                          </text>
                        </>
                      ) : (
                        <text
                          x={w / 2}
                          y={h / 2 + 4}
                          textAnchor="middle"
                          fill={textColor}
                          fontSize={Math.min(12, Math.max(10, Math.round(w / 14)))}
                          fontWeight="600"
                          opacity={0.92}
                          style={{ textShadow: textColor === '#ffffff' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none' }}
                        >
                          {subLabel}
                        </text>
                      )}
                    </g>
                  )}

                  {/* Border Outline on hover */}
                  <rect
                    width={w}
                    height={h}
                    fill="none"
                    stroke={isHovered ? '#ffffff' : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isHovered ? 2.5 : 0.5}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Level 1 Hover Tooltip */}
        {hoveredNode && currentLevel === 1 && (
          <div
            id="level1-hover-card"
            className="pointer-events-none absolute z-30 w-72 bg-[#16191E]/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-3.5 shadow-2xl text-zinc-200 space-y-2.5 animate-fadeIn"
            style={{
              left: Math.min(mousePos.x + 16, dimensions.width - 300),
              top: Math.min(mousePos.y + 16, dimensions.height - 180),
            }}
          >
            <div className="flex items-center gap-2">
              <span 
                className="w-4 h-4 rounded-md border border-white/20 shrink-0" 
                style={{ backgroundColor: hoveredNode.color }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate">
                  {hoveredNode.name} Color Family
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {hoveredNode.count || hoveredNode.audiobooks?.length || 0} books ({hoveredNode.percentage || 0}% of library)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-800">
              <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Hours</span>
                <span className="font-semibold text-zinc-200">{formatHours(hoveredNode.durationHours || 0)}</span>
              </div>
              <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Storage</span>
                <span className="font-semibold text-zinc-200">{formatBytes(hoveredNode.fileSizeBytes || 0)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-200 font-semibold bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700">
              <span>Click block → View color breakup</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
        )}

        {/* Level 2 Hover Tooltip */}
        {hoveredNode && currentLevel === 2 && (
          <div
            id="level2-hover-card"
            className="pointer-events-none absolute z-30 w-80 bg-[#16191E]/95 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-4 shadow-2xl text-zinc-200 space-y-3 animate-fadeIn"
            style={{
              left: Math.min(mousePos.x + 16, dimensions.width - 340),
              top: Math.min(mousePos.y + 16, dimensions.height - 240),
            }}
          >
            {/* Header: Color Swatch + Name + Hex */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span 
                  className="w-4 h-4 rounded-md border border-white/20 shrink-0 shadow-xs" 
                  style={{ backgroundColor: hoveredNode.hex || hoveredNode.color }}
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {hoveredNode.colorName || hoveredNode.name}
                  </h3>
                  <p className="text-[11px] text-amber-200/90 font-mono">
                    {hoveredNode.hex} • {hoveredNode.count || 1} {(hoveredNode.count || 1) === 1 ? 'audiobook' : 'audiobooks'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-zinc-400 px-2 py-0.5 bg-zinc-850 rounded-md border border-zinc-750 shrink-0">
                {hoveredNode.percentage}% of {selectedFamily || 'Family'}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Listening Time</span>
                <span className="font-semibold text-zinc-200">{formatHours(hoveredNode.durationHours || 0)}</span>
              </div>
              <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Audio Storage</span>
                <span className="font-semibold text-zinc-200">{formatBytes(hoveredNode.fileSizeBytes || 0)}</span>
              </div>
            </div>

            {/* Clubbed Books Preview */}
            {hoveredNode.audiobooks && hoveredNode.audiobooks.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                  Clubbed Audiobooks ({hoveredNode.audiobooks.length}):
                </span>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {hoveredNode.audiobooks.slice(0, 4).map((b) => (
                    <div 
                      key={b.id} 
                      className="w-12 h-16 rounded-md overflow-hidden shrink-0 border border-white/10 shadow-xs relative bg-zinc-900"
                      title={`${b.title} by ${b.author}`}
                    >
                      <img
                        src={b.coverUrl}
                        alt={b.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {hoveredNode.audiobooks.length > 4 && (
                    <div className="w-12 h-16 rounded-md bg-zinc-850 border border-zinc-750 flex items-center justify-center text-xs font-bold text-zinc-300">
                      +{hoveredNode.audiobooks.length - 4}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 truncate italic">
                  {hoveredNode.audiobooks.map(b => b.title).join(', ')}
                </p>
              </div>
            ) : hoveredNode.audiobook ? (
              <div className="flex gap-2.5 items-center pt-1">
                <div className="w-10 h-14 rounded-md overflow-hidden shrink-0 border border-white/10 bg-zinc-900">
                  <img
                    src={hoveredNode.audiobook.coverUrl}
                    alt={hoveredNode.audiobook.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{hoveredNode.audiobook.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{hoveredNode.audiobook.author}</p>
                </div>
              </div>
            ) : null}

            {/* Click Navigation Prompt */}
            <div className="flex items-center justify-between text-[11px] text-zinc-200 font-semibold bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-700">
              <span>Click block → View all in Level 3</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
        )}

      </div>

      {/* Helpful Navigation Guidance Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-400" />
          {currentLevel === 1 ? (
            <span><strong>Level 1 (All Colors):</strong> Click on any color block (e.g. Red, Blue, White) to open <strong>Level 2 (Color Breakup)</strong>.</span>
          ) : (
            <span><strong>Level 2 ({selectedFamily} Breakup):</strong> Click any sub-color block to open <strong>Level 3 (Book List & Inspector)</strong>.</span>
          )}
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500">
          <span>{familyBooks.length.toLocaleString()} {selectedFamily ? `${selectedFamily} ` : ''}audiobooks • {currentLevel === 1 ? totalLibHours.toFixed(1) : totalFamilyHours.toFixed(1)} hrs</span>
        </div>
      </div>

    </div>
  );
};
