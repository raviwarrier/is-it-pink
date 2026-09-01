/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Audiobook } from '../types';
import { formatHours, formatBytes, COLOR_FAMILY_PALETTES } from '../utils/colorUtils';
import { 
  ArrowLeft, 
  LayoutGrid, 
  List as ListIcon, 
  Search, 
  ArrowUpDown, 
  Clock, 
  User, 
  BookOpen, 
  Sparkles, 
  Calendar, 
  Copy, 
  Check,
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { AudiobookCard } from './AudiobookCard';

interface BookListGridViewProps {
  books: Audiobook[];
  selectedLabel: string;
  selectedColorHex?: string;
  selectedColorFamily?: string;
  onBackToTreemap: () => void;
  onOpenBookDetail: (book: Audiobook) => void;
}

export const BookListGridView: React.FC<BookListGridViewProps> = ({
  books,
  selectedLabel,
  selectedColorHex,
  selectedColorFamily,
  onBackToTreemap,
  onOpenBookDetail
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'duration-desc' | 'duration-asc' | 'year-desc' | 'year-asc' | 'title' | 'author'>('duration-desc');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = (hex: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1400);
  };

  // Filter books by internal search
  const filteredBooks = useMemo(() => {
    if (!searchFilter.trim()) return books;
    const q = searchFilter.toLowerCase();
    return books.filter(b => 
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.genres.some(g => g.toLowerCase().includes(q)) ||
      b.tags.some(t => t.toLowerCase().includes(q)) ||
      b.dominantColor.colorName.toLowerCase().includes(q) ||
      b.dominantColor.hex.toLowerCase().includes(q)
    );
  }, [books, searchFilter]);

  // Sort books
  const sortedBooks = useMemo(() => {
    const list = [...filteredBooks];
    switch (sortBy) {
      case 'duration-desc':
        return list.sort((a, b) => b.durationHours - a.durationHours);
      case 'duration-asc':
        return list.sort((a, b) => a.durationHours - b.durationHours);
      case 'year-desc':
        return list.sort((a, b) => b.year - a.year);
      case 'year-asc':
        return list.sort((a, b) => a.year - b.year);
      case 'title':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case 'author':
        return list.sort((a, b) => a.author.localeCompare(b.author));
      default:
        return list;
    }
  }, [filteredBooks, sortBy]);

  const totalDuration = useMemo(() => {
    return books.reduce((acc, b) => acc + b.durationHours, 0);
  }, [books]);

  const totalBytes = useMemo(() => {
    return books.reduce((acc, b) => acc + b.fileSizeBytes, 0);
  }, [books]);

  const colorConfig = selectedColorFamily ? COLOR_FAMILY_PALETTES[selectedColorFamily] : null;

  return (
    <div id="level2-book-list-grid-view" className="space-y-5 animate-fadeIn">
      
      {/* Level 2 Navigation & Breadcrumb Header Bar */}
      <div className="bg-[#14171D] border border-zinc-800 rounded-xl p-4 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Breadcrumb & Selected Category Info */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onBackToTreemap}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold transition-all border border-zinc-700 shadow-sm shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-300" />
              <span>← Back to Level 1 (Cover Treemap)</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-zinc-600 hidden sm:inline">•</span>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-850 rounded-lg border border-zinc-750">
                {selectedColorHex && (
                  <span 
                    className="w-3.5 h-3.5 rounded-sm border border-white/20 shadow-sm shrink-0"
                    style={{ backgroundColor: selectedColorHex }}
                  />
                )}
                <span className="text-xs font-semibold text-white font-sans">
                  {selectedLabel}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  ({books.length} {books.length === 1 ? 'book' : 'books'})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0 font-mono">
            <span className="flex items-center gap-1 bg-zinc-850 px-2.5 py-1 rounded-lg border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <strong className="text-white">{formatHours(totalDuration)}</strong>
            </span>
            <span className="flex items-center gap-1 bg-zinc-850 px-2.5 py-1 rounded-lg border border-zinc-800">
              <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
              <strong className="text-white">{formatBytes(totalBytes)}</strong>
            </span>
          </div>
        </div>

        {/* Search, Sort, and Grid/List Mode Toggle Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
          
          {/* Search within Level 2 */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search books in this group..."
              className="w-full bg-[#0F1115] text-zinc-200 text-xs pl-8.5 pr-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 font-sans"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Sort and View Mode Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-[#0F1115] px-2.5 py-1.5 rounded-lg border border-zinc-700 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-400 text-[11px] hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-zinc-200 text-xs focus:outline-none font-medium pr-1 cursor-pointer"
              >
                <option value="duration-desc" className="bg-[#16191E]">Longest First</option>
                <option value="duration-asc" className="bg-[#16191E]">Shortest First</option>
                <option value="year-desc" className="bg-[#16191E]">Newest Year</option>
                <option value="year-asc" className="bg-[#16191E]">Oldest Year</option>
                <option value="title" className="bg-[#16191E]">Title (A-Z)</option>
                <option value="author" className="bg-[#16191E]">Author (A-Z)</option>
              </select>
            </div>

            {/* Grid / List Mode Switcher with High Contrast */}
            <div className="flex items-center bg-[#0F1115] p-1 rounded-lg border border-zinc-700 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-zinc-200 text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Grid View (Visual Cards)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-zinc-200 text-zinc-950 font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="List View (Table)"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Level 2 Main Body: Books Display */}
      {sortedBooks.length === 0 ? (
        <div className="bg-[#14171D] border border-zinc-800 rounded-xl p-10 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-zinc-300">No audiobooks found matching "{searchFilter}".</p>
          <button
            onClick={() => setSearchFilter('')}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-medium rounded-lg border border-zinc-700 cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedBooks.map((book) => (
            <AudiobookCard
              key={book.id}
              audiobook={book}
              onOpenDetail={() => onOpenBookDetail(book)}
            />
          ))}
        </div>
      ) : (
        /* List / Table View Mode */
        <div className="bg-[#14171D] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F1115] text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Cover</th>
                  <th className="px-4 py-3">Title & Author (Click to inspect)</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Genre</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Dominant Color</th>
                  <th className="px-4 py-3">Palette</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {sortedBooks.map((book) => (
                  <tr 
                    key={book.id}
                    className="hover:bg-zinc-850/60 transition-colors group cursor-pointer"
                    onClick={() => onOpenBookDetail(book)}
                  >
                    {/* Cover Thumbnail */}
                    <td className="px-4 py-2.5">
                      <div className="w-10 h-14 rounded-md overflow-hidden border border-zinc-700 bg-[#0F1115] shrink-0 shadow-xs">
                        <img 
                          src={book.coverUrl} 
                          alt={book.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </td>

                    {/* Title & Author */}
                    <td className="px-4 py-2.5 max-w-xs">
                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-white group-hover:text-amber-100 transition-colors line-clamp-1">
                          {book.title}
                        </h4>
                        <p className="text-zinc-400 text-[11px] truncate flex items-center gap-1">
                          <User className="w-3 h-3 text-zinc-500" />
                          <span>{book.author}</span>
                        </p>
                      </div>
                    </td>

                    {/* Year */}
                    <td className="px-4 py-2.5 font-mono text-zinc-400">
                      {book.year}
                    </td>

                    {/* Genre */}
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 bg-zinc-850 text-zinc-300 rounded-md text-[10px] border border-zinc-750">
                        {book.genres[0]}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-2.5 font-mono text-zinc-200 whitespace-nowrap">
                      {formatHours(book.durationHours)}
                    </td>

                    {/* Dominant Color */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-3.5 h-3.5 rounded-sm border border-white/20 shadow-xs shrink-0" 
                          style={{ backgroundColor: book.dominantColor.hex }}
                        />
                        <span className="text-[11px] font-mono text-zinc-300 truncate max-w-[100px]">
                          {book.dominantColor.colorName}
                        </span>
                      </div>
                    </td>

                    {/* Extracted Palette Swatches */}
                    <td className="px-4 py-2.5">
                      <div className="flex h-3.5 w-24 rounded-md overflow-hidden border border-zinc-700 shadow-xs">
                        {book.palette.map((swatch, sIdx) => (
                          <div 
                            key={sIdx}
                            className="h-full"
                            style={{ 
                              backgroundColor: swatch.hex, 
                              width: `${swatch.percentage || 25}%` 
                            }}
                            title={`${swatch.colorName} (${swatch.hex})`}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBookDetail(book);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-md text-[11px] font-semibold transition-all border border-zinc-700 cursor-pointer"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
