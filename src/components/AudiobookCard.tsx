/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Audiobook } from '../types';
import { formatHours } from '../utils/colorUtils';
import { BookCoverOrColorBlock } from './BookCoverOrColorBlock';
import { Check } from 'lucide-react';

interface AudiobookCardProps {
  audiobook: Audiobook;
  onOpenDetail: () => void;
  onFilterGenre?: (genre: string) => void;
  onFilterAuthor?: (author: string) => void;
  onFilterTag?: (tag: string) => void;
}

export const AudiobookCard: React.FC<AudiobookCardProps> = ({
  audiobook,
  onOpenDetail,
  onFilterGenre,
  onFilterAuthor,
  onFilterTag
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyHex = (hex: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1400);
  };

  const hex = audiobook?.dominantColor?.hex || '#3b82f6';
  const colorName = audiobook?.dominantColor?.colorName || 'Color Shade';
  const palette = Array.isArray(audiobook?.palette) && audiobook.palette.length > 0 
    ? audiobook.palette 
    : [{ hex, colorName, percentage: 100 }];
  const genres = Array.isArray(audiobook?.genres) ? audiobook.genres : ['Audiobook'];
  const tags = Array.isArray(audiobook?.tags) ? audiobook.tags : [];
  const durationHours = typeof audiobook?.durationHours === 'number' ? audiobook.durationHours : 10;
  const year = audiobook?.year || 2022;

  return (
    <div 
      id={`audiobook-card-${audiobook?.id || Math.random()}`}
      className="bg-[#13161C] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3.5 shadow-lg hover:shadow-2xl transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5"
    >
      <div className="space-y-3">
        
        {/* Cover Art Thumbnail OR Solid Block Header */}
        <div onClick={onOpenDetail} className="relative">
          <BookCoverOrColorBlock
            book={audiobook}
            variant="grid-card"
            showPlayOverlay={true}
          />

          {/* Dominant Color Pill */}
          <div 
            className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-md backdrop-blur-md flex items-center gap-1.5 border border-white/20 z-10 pointer-events-none"
            style={{ backgroundColor: `${hex}ee` }}
          >
            <span className="w-2 h-2 rounded-full bg-white shadow-xs shrink-0" />
            <span className="truncate max-w-[110px]">{colorName}</span>
          </div>

          {/* Duration Badge */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#0A0C0F]/90 backdrop-blur-md text-[10px] font-mono text-zinc-300 border border-zinc-800 z-10 pointer-events-none">
            {formatHours(durationHours)}
          </div>
        </div>

        {/* Title, Author & Metadata */}
        <div className="space-y-1">
          <h4 
            onClick={onOpenDetail}
            className="text-sm font-semibold text-white hover:text-amber-200/90 cursor-pointer line-clamp-1 leading-snug transition-colors font-sans"
            title={audiobook?.title}
          >
            {audiobook?.title || 'Untitled Audiobook'}
          </h4>

          <div className="flex items-center justify-between text-xs text-zinc-400">
            <button
              onClick={() => onFilterAuthor?.(audiobook?.author)}
              className="hover:text-zinc-200 truncate max-w-[160px] text-left transition-colors font-medium cursor-pointer"
              title={audiobook?.author}
            >
              {audiobook?.author || 'Unknown Author'}
            </button>
            <span className="text-[11px] font-mono text-zinc-500 shrink-0">
              {year}
            </span>
          </div>
        </div>

        {/* Extracted Color Palette Swatches Strip */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
            <span>Cover Palette:</span>
            {copiedHex && (
              <span className="text-zinc-300 flex items-center gap-0.5 font-mono">
                <Check className="w-2.5 h-2.5" /> Copied {copiedHex}
              </span>
            )}
          </div>
          <div className="flex h-4 rounded-full overflow-hidden border border-zinc-750 shadow-inner">
            {palette.map((swatch, idx) => (
              <div
                key={idx}
                onClick={(e) => handleCopyHex(swatch.hex || hex, e)}
                className="h-full relative group/swatch cursor-pointer hover:scale-y-110 transition-transform"
                style={{
                  backgroundColor: swatch.hex || hex,
                  width: `${swatch.percentage || Math.round(100 / palette.length)}%`
                }}
                title={`Click to copy: ${swatch.colorName || colorName} (${swatch.hex || hex})`}
              />
            ))}
          </div>
        </div>

        {/* Genre Badges & Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {genres.slice(0, 2).map((genre) => (
            <button
              key={genre}
              onClick={() => onFilterGenre?.(genre)}
              className="px-2.5 py-0.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-[10px] font-medium rounded-full transition-colors border border-zinc-800 cursor-pointer"
            >
              {genre}
            </button>
          ))}
          {tags.slice(0, 1).map((tag) => (
            <button
              key={tag}
              onClick={() => onFilterTag?.(tag)}
              className="px-2 py-0.5 bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono rounded-full border border-zinc-800 transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

      </div>

      {/* Card Footer Button */}
      <button
        onClick={onOpenDetail}
        className="w-full mt-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 text-xs font-medium rounded-full border border-zinc-750 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>Inspect & Palette</span>
      </button>

    </div>
  );
};

