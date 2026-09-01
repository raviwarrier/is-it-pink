/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Audiobook, LibraryStats } from '../types';
import { COLOR_FAMILY_PALETTES, formatHours } from '../utils/colorUtils';
import { 
  Palette, 
  BarChart2, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  Compass, 
  Layers, 
  Sliders, 
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  BookOpen,
  User
} from 'lucide-react';

interface ChromaticAnalyticsProps {
  audiobooks: Audiobook[];
  stats: LibraryStats;
  onSelectBook: (book: Audiobook) => void;
}

export const ChromaticAnalytics: React.FC<ChromaticAnalyticsProps> = ({
  audiobooks,
  stats,
  onSelectBook
}) => {
  // State for expandable Dominant Color Family Prevalence accordion
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [expandedHue, setExpandedHue] = useState<string | null>(null);

  // Group audiobooks by decade for timeline ribbon
  const decadeGroups: Record<string, Audiobook[]> = {};
  audiobooks.forEach(b => {
    const decade = `${Math.floor(b.year / 10) * 10}s`;
    if (!decadeGroups[decade]) decadeGroups[decade] = [];
    decadeGroups[decade].push(b);
  });

  const sortedDecades = Object.entries(decadeGroups).sort(
    ([a], [b]) => parseInt(a) - parseInt(b)
  );

  // Sort audiobooks by hue for the Chromatic Mosaic
  const hueSortedBooks = [...audiobooks].sort(
    (a, b) => (a.dominantColor.hsl[0] || 0) - (b.dominantColor.hsl[0] || 0)
  );

  // Toggle family expansion
  const toggleFamily = (family: string) => {
    if (expandedFamily === family) {
      setExpandedFamily(null);
      setExpandedHue(null);
    } else {
      setExpandedFamily(family);
      setExpandedHue(null);
    }
  };

  // Toggle hue/shade expansion
  const toggleHue = (hueKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHue(prev => (prev === hueKey ? null : hueKey));
  };

  return (
    <div id="chromatic-analytics-root" className="space-y-6 animate-fadeIn">
      
      {/* Top Banner Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[#16191E] border border-white/5 rounded-2xl space-y-1 shadow-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Library Listening
          </p>
          <p className="text-2xl font-semibold text-white font-sans">
            {formatHours(stats.totalHours)}
          </p>
          <p className="text-[11px] text-indigo-400 font-mono">
            {stats.totalBooks} Unique Audiobooks
          </p>
        </div>

        <div className="p-4 bg-[#16191E] border border-white/5 rounded-2xl space-y-1 shadow-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Top Dominant Hue
          </p>
          <div className="flex items-center gap-2">
            <span 
              className="w-3.5 h-3.5 rounded-full shadow-xs" 
              style={{ backgroundColor: stats.topColorFamilies[0]?.hex || '#0284C7' }} 
            />
            <p className="text-xl font-semibold text-white font-sans truncate">
              {stats.topColorFamilies[0]?.family || 'Blue'}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {stats.topColorFamilies[0]?.percentage || 0}% of all covers
          </p>
        </div>

        <div className="p-4 bg-[#16191E] border border-white/5 rounded-2xl space-y-1 shadow-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Genre Breadth
          </p>
          <p className="text-2xl font-semibold text-white font-sans">
            {stats.uniqueGenresCount} Genres
          </p>
          <p className="text-[11px] text-indigo-400 font-mono">
            Lead: {stats.topGenres[0]?.genre || 'Sci-Fi'}
          </p>
        </div>

        <div className="p-4 bg-[#16191E] border border-white/5 rounded-2xl space-y-1 shadow-md">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Publication Span
          </p>
          <p className="text-2xl font-semibold text-white font-sans">
            {stats.earliestYear} — {stats.latestYear}
          </p>
          <p className="text-[11px] text-emerald-400 font-mono">
            {stats.uniqueAuthorsCount} Distinct Authors
          </p>
        </div>
      </div>

      {/* Analytics Section 1: Chromatic Spectrum & Palette Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Interactive Expandable Color Families Breakdown */}
        <div className="bg-[#16191E] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white font-sans">
                Dominant Color Family Prevalence
              </h3>
            </div>
            <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Click family to expand hues & titles
            </span>
          </div>

          <div className="space-y-2.5">
            {stats.topColorFamilies.map((fam) => {
              const pal = COLOR_FAMILY_PALETTES[fam.family] || { bgHex: fam.hex, label: fam.family };
              const isExpanded = expandedFamily === fam.family;
              const familyBooks = audiobooks.filter(b => b.dominantColor.colorFamily === fam.family);

              // Group books into distinct shades / hues within this color family
              const shadesMap: Record<string, { hex: string; colorName: string; books: Audiobook[] }> = {};
              familyBooks.forEach(b => {
                const shadeKey = b.dominantColor.hex.toLowerCase();
                if (!shadesMap[shadeKey]) {
                  shadesMap[shadeKey] = {
                    hex: b.dominantColor.hex,
                    colorName: b.dominantColor.colorName,
                    books: []
                  };
                }
                shadesMap[shadeKey].books.push(b);
              });

              const shadesList = Object.values(shadesMap).sort((a, b) => b.books.length - a.books.length);

              return (
                <div 
                  key={fam.family} 
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isExpanded 
                      ? 'bg-[#1F232B] border-indigo-500/40 shadow-lg' 
                      : 'bg-[#0F1115]/60 hover:bg-[#1F232B]/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Color Family Row Button */}
                  <button
                    onClick={() => toggleFamily(fam.family)}
                    className="w-full p-3 text-left space-y-2 cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs shrink-0"
                          style={{ backgroundColor: pal.bgHex }}
                        />
                        <span className="font-semibold text-slate-200 text-sm">{pal.label || fam.family}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-white/5 text-slate-400 rounded-full font-mono">
                          {shadesList.length} {shadesList.length === 1 ? 'shade' : 'shades'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300 text-[11px] font-bold">
                          {fam.count} {fam.count === 1 ? 'book' : 'books'} ({fam.percentage}%)
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#0F1115] h-2 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(4, fam.percentage)}%`,
                          backgroundColor: pal.bgHex
                        }}
                      />
                    </div>
                  </button>

                  {/* Level 2: Expanded Hues/Shades List */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 border-t border-white/5 space-y-2 bg-[#0F1115]/50">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                        Hues & Shades in {fam.family} ({familyBooks.length} Audiobooks):
                      </p>

                      <div className="space-y-1.5">
                        {shadesList.map((shade) => {
                          const isHueExpanded = expandedHue === shade.hex;
                          const shadeDuration = shade.books.reduce((sum, b) => sum + b.durationHours, 0);

                          return (
                            <div 
                              key={shade.hex}
                              className="rounded-lg border border-white/5 bg-[#16191E] overflow-hidden"
                            >
                              {/* Shade/Hue Header Button */}
                              <button
                                onClick={(e) => toggleHue(shade.hex, e)}
                                className="w-full px-3 py-2 flex items-center justify-between text-xs hover:bg-white/5 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span 
                                    className="w-3 h-3 rounded-full border border-white/20 shadow-xs shrink-0"
                                    style={{ backgroundColor: shade.hex }}
                                  />
                                  <span className="font-semibold text-slate-200 truncate">
                                    {shade.colorName}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    ({shade.hex})
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[11px] font-mono text-indigo-400">
                                    {shade.books.length} {shade.books.length === 1 ? 'title' : 'titles'} • {formatHours(shadeDuration)}
                                  </span>
                                  {isHueExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                  )}
                                </div>
                              </button>

                              {/* Level 3: Expanded Book Titles under this Hue/Shade */}
                              {isHueExpanded && (
                                <div className="px-3 pb-2.5 pt-1.5 border-t border-white/5 space-y-1.5 bg-[#0F1115]/80">
                                  <p className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                                    Audiobook Titles with this Shade (Click title to view details):
                                  </p>
                                  <div className="space-y-1">
                                    {shade.books.map((b) => (
                                      <div
                                        key={b.id}
                                        onClick={() => onSelectBook(b)}
                                        className="flex items-center justify-between p-2 bg-[#16191E] hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/30 rounded-lg cursor-pointer transition-all group"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="w-7 h-10 rounded overflow-hidden shrink-0 border border-white/10 bg-[#0F1115]">
                                            <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                          </div>
                                          <div className="min-w-0">
                                            <h5 className="font-semibold text-xs text-white group-hover:text-indigo-300 transition-colors truncate">
                                              {b.title}
                                            </h5>
                                            <p className="text-[10px] text-slate-400 truncate">
                                              {b.author} • {b.year}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[10px] font-mono text-slate-400">
                                            {formatHours(b.durationHours)}
                                          </span>
                                          <span className="text-[10px] text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-semibold">
                                            <span>Details</span>
                                            <ChevronRight className="w-3 h-3" />
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Genre vs Chromatic Mood Correlation Matrix */}
        <div className="bg-[#16191E] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white font-sans">
                Genre Color Palette Signatures
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Associated Palettes
            </span>
          </div>

          <div className="space-y-3">
            {stats.topGenres.slice(0, 6).map((g) => {
              // Find books in this genre
              const genreBooks = audiobooks.filter(b => b.genres.includes(g.genre));
              return (
                <div key={g.genre} className="p-3.5 bg-[#0F1115] border border-white/5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{g.genre}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {g.count} titles • {formatHours(g.totalHours)}
                    </span>
                  </div>

                  {/* Swatches strip of covers in this genre */}
                  <div className="flex h-4 rounded-full overflow-hidden border border-white/10">
                    {genreBooks.map((b) => (
                      <div
                        key={b.id}
                        className="h-full relative group cursor-pointer"
                        style={{
                          backgroundColor: b.dominantColor.hex,
                          flex: b.durationHours
                        }}
                        onClick={() => onSelectBook(b)}
                        title={`${b.title} (${b.dominantColor.colorName})`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Analytics Section 2: Chronological Publication Era Palette Ribbon */}
      <div className="bg-[#16191E] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white font-sans">
              Publication Era Chromatic Evolution Timeline
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            1890s to 2020s
          </span>
        </div>

        <p className="text-xs text-slate-400">
          How audiobook cover artwork hues shift across publishing eras—from vintage earth tones and parchment to modern high-saturation sci-fi and noir aesthetics.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sortedDecades.map(([decade, dBooks]) => (
            <div key={decade} className="p-3.5 bg-[#0F1115] border border-white/5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 font-mono">{decade}</span>
                <span className="text-[10px] text-slate-400">{dBooks.length} titles</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {dBooks.map(b => (
                  <div
                    key={b.id}
                    onClick={() => onSelectBook(b)}
                    className="w-7 h-10 rounded overflow-hidden shrink-0 border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                    title={`${b.title} (${b.year})`}
                  >
                    <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
