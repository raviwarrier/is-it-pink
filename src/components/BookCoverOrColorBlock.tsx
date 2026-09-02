/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Audiobook } from '../types';
import { getContrastTextColor } from '../utils/colorUtils';
import { BookOpen, Sparkles, Play } from 'lucide-react';

interface BookCoverOrColorBlockProps {
  book: Audiobook;
  variant?: 'list-thumbnail' | 'grid-card' | 'detail-hero';
  className?: string;
  showPlayOverlay?: boolean;
}

export const BookCoverOrColorBlock: React.FC<BookCoverOrColorBlockProps> = ({
  book,
  variant = 'grid-card',
  className = '',
  showPlayOverlay = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Reset image error state if coverUrl changes
  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [book.id, book.coverUrl]);

  const hex = book.dominantColor?.hex || '#3b82f6';
  const colorName = book.dominantColor?.colorName || 'Color Shade';
  const textColor = getContrastTextColor(hex);
  const hasCoverUrl = Boolean(book.coverUrl && book.coverUrl.trim().length > 0);
  const showCoverImage = hasCoverUrl && !imgError;

  // Initials / Monogram for solid block fallback
  const getInitials = (title: string) => {
    if (!title) return 'AB';
    const words = title.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return title.slice(0, 2).toUpperCase();
  };

  // 1. Table / List Thumbnail Variant (e.g. 40px x 56px)
  if (variant === 'list-thumbnail') {
    return (
      <div 
        className={`w-10 h-14 rounded-md overflow-hidden border border-zinc-700/80 shrink-0 shadow-xs relative flex items-center justify-center select-none ${className}`}
        style={{ backgroundColor: hex }}
      >
        {showCoverImage ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImgError(true)}
            onLoad={() => setImgLoaded(true)}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}

        {/* Solid Block Fallback Display */}
        {(!showCoverImage || !imgLoaded) && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center"
            style={{ backgroundColor: hex, color: textColor }}
          >
            <span className="text-[11px] font-black tracking-tight font-mono leading-none">
              {getInitials(book.title)}
            </span>
            <div 
              className="w-2.5 h-1 rounded-full mt-1 opacity-75 border border-white/20"
              style={{ backgroundColor: textColor }}
            />
          </div>
        )}
      </div>
    );
  }

  // 2. Detail Modal Hero Cover Variant
  if (variant === 'detail-hero') {
    return (
      <div 
        className={`w-full aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative flex items-center justify-center select-none group ${className}`}
        style={{ backgroundColor: hex }}
      >
        {showCoverImage ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImgError(true)}
            onLoad={() => setImgLoaded(true)}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : null}

        {/* Solid Block Fallback Display */}
        {(!showCoverImage || !imgLoaded) && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
            style={{ backgroundColor: hex, color: textColor }}
          >
            <div className="w-16 h-16 rounded-2xl border-2 border-current/20 flex items-center justify-center mb-3 shadow-lg">
              <BookOpen className="w-8 h-8 opacity-90" />
            </div>
            <h3 className="text-base font-bold line-clamp-2 mb-1 px-2 font-sans">
              {book.title}
            </h3>
            <p className="text-xs opacity-80 line-clamp-1 mb-3 font-sans">
              {book.author}
            </p>
            <div 
              className="px-3 py-1 rounded-full text-[11px] font-mono font-bold border border-current/30 backdrop-blur-xs"
              style={{ backgroundColor: `${textColor}20` }}
            >
              {colorName} • {hex}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Grid Card Variant (Standard 4:5 ratio card)
  return (
    <div 
      className={`relative w-full aspect-[4/5] rounded-xl overflow-hidden cursor-pointer border border-zinc-800 shadow-md group/cover flex items-center justify-center select-none ${className}`}
      style={{ backgroundColor: hex }}
    >
      {showCoverImage ? (
        <img
          src={book.coverUrl}
          alt={book.title}
          onError={() => setImgError(true)}
          onLoad={() => setImgLoaded(true)}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover group-hover/cover:scale-105 transition-all duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : null}

      {/* Solid Block Fallback Display */}
      {(!showCoverImage || !imgLoaded) && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-between p-3.5 text-center transition-transform group-hover/cover:scale-102"
          style={{ backgroundColor: hex, color: textColor }}
        >
          {/* Top subtle badge */}
          <div className="w-full flex justify-end">
            <span 
              className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border border-white/20 shadow-xs"
              style={{ backgroundColor: `${textColor}20` }}
            >
              Solid Swatch
            </span>
          </div>

          {/* Centered book monogram & title snippet */}
          <div className="my-auto space-y-1.5 px-1">
            <div className="w-12 h-12 rounded-xl border border-current/25 mx-auto flex items-center justify-center shadow-md">
              <span className="text-sm font-black font-mono">
                {getInitials(book.title)}
              </span>
            </div>
            <p className="text-xs font-bold line-clamp-2 px-1 leading-snug">
              {book.title}
            </p>
            <p className="text-[10px] opacity-80 line-clamp-1 font-sans">
              {book.author}
            </p>
          </div>

          {/* Bottom color hex label */}
          <div 
            className="w-full py-0.5 rounded-full text-[10px] font-mono font-bold truncate border border-current/20"
            style={{ backgroundColor: `${textColor}15` }}
          >
            {colorName}
          </div>
        </div>
      )}

      {/* Quick Play Overlay */}
      {showPlayOverlay && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs z-10">
          <div className="w-11 h-11 rounded-full bg-zinc-800 text-white border border-zinc-700 flex items-center justify-center shadow-xl transform scale-90 group-hover/cover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5 text-amber-200/90" />
          </div>
        </div>
      )}
    </div>
  );
};
