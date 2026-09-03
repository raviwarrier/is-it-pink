/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Audiobook } from '../types';
import { formatHours, formatBytes } from '../utils/colorUtils';
import { normalizeAudiobook } from '../utils/treemapUtils';
import { BookCoverOrColorBlock } from './BookCoverOrColorBlock';
import { 
  X, 
  Copy, 
  Check, 
  Folder, 
  Clock, 
  User, 
  HardDrive, 
  Star, 
  Sparkles, 
  Layers, 
  FileText, 
  Mic,
  Calendar,
  CheckCircle2,
  Image as ImageIcon 
} from 'lucide-react';

interface AudiobookDetailModalProps {
  audiobook: Audiobook | null;
  onClose: () => void;
  onFilterGenre?: (genre: string) => void;
  onFilterAuthor?: (author: string) => void;
  onFilterColorFamily?: (family: string) => void;
}

export const AudiobookDetailModal: React.FC<AudiobookDetailModalProps> = ({
  audiobook: rawAudiobook,
  onClose,
  onFilterGenre,
  onFilterAuthor,
  onFilterColorFamily
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const audiobook = useMemo(() => {
    return rawAudiobook ? normalizeAudiobook(rawAudiobook) : null;
  }, [rawAudiobook]);

  if (!audiobook) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHex(text);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const hex = audiobook.dominantColor?.hex || '#3b82f6';
  const colorName = audiobook.dominantColor?.colorName || 'Shade';
  const colorFamily = audiobook.dominantColor?.colorFamily || 'Color';
  const rgb = audiobook.dominantColor?.rgb || [59, 130, 246];
  const palette = audiobook.palette || [{ hex, colorName, percentage: 100, rgb }];

  return (
    <div id="audiobook-detail-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="audiobook-detail-modal" 
        className="w-full max-w-3xl bg-[#16191E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0F1115]">
          <div className="flex items-center gap-2.5">
            <span 
              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm shrink-0"
              style={{ backgroundColor: hex }}
            />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              {colorName} ({hex}) • {colorFamily} Palette
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: High-Res Cover Visual from Filesystem or Solid Color Block */}
            <div className="w-full md:w-64 shrink-0 space-y-3">
              <div className="w-full rounded-2xl overflow-hidden bg-[#0F1115] border border-white/10 shadow-2xl relative">
                <BookCoverOrColorBlock 
                  book={audiobook} 
                  variant="detail-hero"
                />
              </div>

              {/* Cover File Location on Filesystem */}
              <div className="p-3 bg-[#0F1115] rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-slate-300">Cover Artwork Source:</span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 break-all leading-tight">
                  {audiobook.coverPath || audiobook.coverUrl || (audiobook.folderPath ? `${audiobook.folderPath}/cover.jpg` : 'Local audio file artwork')}
                </p>
              </div>

              {/* Dominant Color Swatch Summary */}
              <div 
                className="p-3.5 rounded-xl border border-white/5 space-y-2"
                style={{ backgroundColor: `${hex}15` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">Dominant Cover Color:</span>
                  <button
                    onClick={() => handleCopy(hex)}
                    className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                  >
                    {copiedHex === hex ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Copied
                      </span>
                    ) : (
                      <>
                        <span>{hex}</span>
                        <Copy className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-7 h-7 rounded-lg shadow-md border border-white/20 shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                  <div className="text-[11px] text-slate-300 min-w-0">
                    <p className="font-bold truncate">{colorName}</p>
                    <p className="text-[10px] font-mono text-slate-400">
                      RGB({rgb.join(', ')})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Book Details */}
            <div className="flex-1 space-y-4 min-w-0">
              
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold font-sans text-white leading-tight">
                  {audiobook.title}
                </h2>
                <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                  <span className="text-slate-400">by</span>
                  <button
                    onClick={() => {
                      onFilterAuthor?.(audiobook.author);
                      onClose();
                    }}
                    className="font-bold text-indigo-400 hover:underline cursor-pointer"
                  >
                    {audiobook.author}
                  </button>
                  <span>•</span>
                  <span className="font-mono text-slate-400">{audiobook.year}</span>
                </p>
              </div>

              {/* Audiobook Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-[#1F232B] border border-white/5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Mic className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Narrator</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {audiobook.narrator}
                  </p>
                </div>

                <div className="p-3 bg-[#1F232B] border border-white/5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Duration</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 font-mono">
                    {formatHours(audiobook.durationHours)}
                  </p>
                </div>

                <div className="p-3 bg-[#1F232B] border border-white/5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Year Published</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 font-mono">
                    {audiobook.year}
                  </p>
                </div>

                <div className="p-3 bg-[#1F232B] border border-white/5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>File Size</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 font-mono">
                    {formatBytes(audiobook.fileSizeBytes)}
                  </p>
                </div>

                <div className="p-3 bg-[#1F232B] border border-white/5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Audio Format</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 font-mono uppercase">
                    {audiobook.audioFormat} ({audiobook.bitrateKbps} kbps)
                  </p>
                </div>

                <div className="p-3 bg-[#1F232B] border border-white/5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Shelf Status</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-300">
                    Finished Read
                  </p>
                </div>
              </div>

              {/* Book Blurb Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Synopsis
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#1F232B]/60 p-3.5 rounded-xl border border-white/5">
                  {audiobook.description}
                </p>
              </div>

              {/* Full Extracted 5-Color Palette Spectrum */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Cover Palette Breakdown</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click any hex to copy</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {palette.map((swatch, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleCopy(swatch.hex)}
                      className="p-2.5 bg-[#1F232B] border border-white/5 hover:border-white/15 rounded-xl cursor-pointer transition-all space-y-1 group"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-md shadow-xs border border-white/20 shrink-0 group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span className="text-[11px] font-mono font-bold text-slate-300 group-hover:text-indigo-400 truncate">
                          {swatch.hex}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {swatch.colorName} ({swatch.percentage}%)
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Audiobook Specs & Folder Path */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#0F1115] px-3.5 py-2.5 rounded-xl border border-white/5 truncate">
                  <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-500">Audiobook Source:</span>
                  <span className="truncate text-slate-300">{audiobook.folderPath}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400 pt-1">
                  {audiobook.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-0.5 bg-[#1F232B] rounded-full font-mono text-zinc-400 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0F1115] border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {audiobook.genres.map(g => (
              <button 
                key={g} 
                onClick={() => {
                  onFilterGenre?.(g);
                  onClose();
                }}
                className="px-2.5 py-0.5 bg-[#1F232B] hover:bg-white/10 text-slate-300 text-[10px] rounded-full border border-white/5 cursor-pointer transition-colors"
              >
                {g}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors font-medium text-xs shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
