/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Audiobook, 
  LibraryStats, 
  SocialPlatform, 
  SocialCardConfig,
  ReportOptions 
} from '../types';
import { formatHours, formatBytes, COLOR_FAMILY_PALETTES } from '../utils/colorUtils';
import { downloadMapDataAsJson } from '../utils/storageUtils';
import { 
  Share2, 
  Download, 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Printer, 
  Image as ImageIcon, 
  RefreshCw, 
  Sliders, 
  Palette, 
  Table,
  CheckCircle2,
  FileJson
} from 'lucide-react';

interface ExportStudioProps {
  audiobooks: Audiobook[];
  stats: LibraryStats;
  libraryPath: string;
}

export const ExportStudio: React.FC<ExportStudioProps> = ({
  audiobooks,
  stats,
  libraryPath
}) => {
  const [activeTab, setActiveTab] = useState<'social' | 'report'>('social');
  
  // Social Post State
  const [platform, setPlatform] = useState<SocialPlatform>('twitter');
  const [tone, setTone] = useState<string>('Witty, observant and aesthetic');
  const [postContent, setPostContent] = useState<string>('');
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [cardTemplate, setCardTemplate] = useState<'cinematic-dark' | 'clean-editorial' | 'cyberpunk-neon'>('cinematic-dark');
  const [cardAspect, setCardAspect] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Report State
  const [reportTitle, setReportTitle] = useState('Audiobook Library Chromatic & Curatorial Analysis Report');
  const [curatorName, setCuratorName] = useState('Library Curator');
  const [aiReportText, setAiReportText] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [includeFullCatalog, setIncludeFullCatalog] = useState(true);

  // Initial generation on tab load
  useEffect(() => {
    handleGenerateSocialPost();
  }, [platform]);

  // Render Social Share Card on Canvas
  useEffect(() => {
    renderCanvasCard();
  }, [cardTemplate, cardAspect, audiobooks, stats, platform]);

  const renderCanvasCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions based on aspect ratio
    let width = 1200;
    let height = 1200;
    if (cardAspect === '16:9') {
      height = 675;
    } else if (cardAspect === '9:16') {
      height = 2133;
    }

    canvas.width = width;
    canvas.height = height;

    // Background theme styling
    if (cardTemplate === 'cyberpunk-neon') {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);
      // Neon top gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(0.5, '#4f46e5');
      grad.addColorStop(1, '#ec4899');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 12);
    } else if (cardTemplate === 'clean-editorial') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);
    } else {
      // Cinematic Dark
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#18181b');
      bgGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    const textColor = cardTemplate === 'clean-editorial' ? '#0f172a' : '#f8fafc';
    const subTextColor = cardTemplate === 'clean-editorial' ? '#475569' : '#a1a1aa';
    const accentColor = cardTemplate === 'cyberpunk-neon' ? '#06b6d4' : '#f59e0b';

    // Header Branding
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 22px monospace';
    ctx.fillText('AUDIOBOOK CHROMATIC TREEMAP', 60, 80);

    // Title
    ctx.fillStyle = textColor;
    ctx.font = 'bold 52px serif';
    ctx.fillText('Audiobook Library Spectrum', 60, 150);

    // Subtitle
    ctx.fillStyle = subTextColor;
    ctx.font = '24px sans-serif';
    ctx.fillText(`${stats.totalBooks} Audiobooks • ${formatHours(stats.totalHours)} • ${stats.uniqueGenresCount} Genres`, 60, 195);

    // Draw Dominant Color Palette Strip
    const topFamilies = stats.topColorFamilies.slice(0, 6);
    let startX = 60;
    const barY = 240;
    const barWidth = width - 120;
    const barHeight = 44;

    // Outer frame
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(startX, barY, barWidth, barHeight);

    let curX = startX;
    topFamilies.forEach(fam => {
      const famW = (fam.percentage / 100) * barWidth;
      ctx.fillStyle = fam.hex || '#0284C7';
      ctx.fillRect(curX, barY, famW, barHeight);
      curX += famW;
    });

    // Draw Book Cover Grid Mosaic
    const mosaicStartY = 330;
    const booksToDraw = audiobooks.slice(0, 10);
    const coverW = (width - 120 - (5 * 16)) / 6;
    const coverH = coverW * 1.4;

    booksToDraw.forEach((b, idx) => {
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      const bx = 60 + col * (coverW + 18);
      const by = mosaicStartY + row * (coverH + 24);

      if (by + coverH < height - 120) {
        // Draw Book Cover Box
        ctx.fillStyle = b.dominantColor.hex;
        ctx.beginPath();
        ctx.roundRect(bx, by, coverW, coverH, 12);
        ctx.fill();

        // Inner title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(b.title.slice(0, 14), bx + 12, by + coverH - 36);

        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '12px sans-serif';
        ctx.fillText(b.author.slice(0, 16), bx + 12, by + coverH - 16);
      }
    });

    // Footer
    const footerY = height - 50;
    ctx.fillStyle = subTextColor;
    ctx.font = '18px monospace';
    ctx.fillText(`Mapped via Is it Pink? • What color is your audiobook shelf? • ${libraryPath.slice(0, 35)}`, 60, footerY);
  };

  // Generate Social Post
  const handleGenerateSocialPost = async () => {
    setIsGeneratingPost(true);
    try {
      const res = await fetch('/api/ai/generate-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          tone,
          librarySummary: { totalBooks: stats.totalBooks, totalHours: stats.totalHours },
          topColors: stats.topColorFamilies,
          topGenres: stats.topGenres,
          sampleBooks: audiobooks.slice(0, 4)
        })
      });
      const data = await res.json();
      setPostContent(data.post || '');
    } catch (e) {
      console.warn("Post gen fallback:", e);
    } finally {
      setIsGeneratingPost(false);
    }
  };

  // Generate Analytical Report
  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          librarySummary: { totalBooks: stats.totalBooks, totalHours: stats.totalHours },
          topColors: stats.topColorFamilies,
          topGenres: stats.topGenres,
          authorStats: stats.topAuthors,
          yearDistribution: stats.decadeDistribution
        })
      });
      const data = await res.json();
      setAiReportText(data.report || '');
    } catch (e) {
      console.warn("Report gen error:", e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Download Share Card PNG
  const handleDownloadCardPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `audiobook-chromatic-card-${platform}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Download CSV
  const handleDownloadCsv = () => {
    const headers = ["Title", "Author", "Year", "Genres", "Duration_Hours", "Dominant_Color_Name", "Dominant_Color_Hex", "Color_Family", "File_Size_MB", "Folder_Path"];
    const rows = audiobooks.map(b => [
      `"${b.title.replace(/"/g, '""')}"`,
      `"${b.author.replace(/"/g, '""')}"`,
      b.year,
      `"${b.genres.join('; ')}"`,
      b.durationHours,
      `"${b.dominantColor.colorName}"`,
      b.dominantColor.hex,
      b.dominantColor.colorFamily,
      (b.fileSizeBytes / (1024 * 1024)).toFixed(1),
      `"${b.folderPath.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audiobooks-library-chromatic-analysis.csv`;
    link.click();
  };

  // Download JSON Map Data Package
  const handleDownloadJson = () => {
    downloadMapDataAsJson(libraryPath, audiobooks);
  };

  const handleCopyPost = () => {
    navigator.clipboard.writeText(postContent);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 1800);
  };

  return (
    <div id="export-studio-root" className="space-y-6 animate-fadeIn">
      
      {/* Studio Mode Selector Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#16191E] border border-white/5 p-2 rounded-2xl gap-3 shadow-xl">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('social')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'social'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Social Media Post & Visual Card Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'report'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Downloadable Reports & CSV Export</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1F232B] hover:bg-white/10 text-slate-200 text-xs font-medium rounded-full border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1F232B] hover:bg-white/10 text-slate-200 text-xs font-medium rounded-full border border-white/10 transition-colors font-mono"
          >
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Social Media Post & Visual Share Card Studio */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Controls & Generated Post Copy */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-[#16191E] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>Platform & Post Configuration</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Automated Generator
                </span>
              </div>

              {/* Platform Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Social Platform:</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'twitter', name: 'X / Twitter' },
                    { id: 'instagram', name: 'Instagram' },
                    { id: 'linkedin', name: 'LinkedIn' },
                    { id: 'tiktok', name: 'TikTok / Script' },
                    { id: 'threads', name: 'Threads' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id as SocialPlatform)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-full transition-all text-center ${
                        platform === p.id
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'bg-[#1F232B] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Post Tone & Narrative Style:</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-[#1F232B] text-slate-200 text-xs px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Witty, observant and aesthetic">Witty, observant & aesthetic (High Engagement)</option>
                  <option value="Curatorial, thoughtful and analytical">Curatorial & analytical (Book Lover & Data)</option>
                  <option value="Casual BookTok conversational hook">Casual BookTok hook (Short, punchy)</option>
                  <option value="Deep-dive design & color psychology">Deep-dive color psychology & design</option>
                </select>
              </div>

              {/* Post Copy & Regenerate Action */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Post Copy & Hashtags:</label>
                  <button
                    onClick={handleGenerateSocialPost}
                    disabled={isGeneratingPost}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingPost ? 'animate-spin' : ''}`} />
                    <span>Regenerate with AI</span>
                  </button>
                </div>

                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={8}
                  className="w-full bg-[#1F232B] text-slate-200 text-xs p-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-y"
                  placeholder="Generating insightful social post..."
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {postContent.length} characters
                  </span>
                  <button
                    onClick={handleCopyPost}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-full transition-all shadow-md"
                  >
                    {copiedPost ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPost ? 'Copied to Clipboard!' : 'Copy Caption'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Visual Card Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-[#16191E] border border-white/5 rounded-2xl p-5 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>Visual Infographic Share Card</span>
                </h3>
                <button
                  onClick={handleDownloadCardPng}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-full transition-colors shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Card (PNG)</span>
                </button>
              </div>

              {/* Card Style Controls */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Theme:</span>
                  <button
                    onClick={() => setCardTemplate('cinematic-dark')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      cardTemplate === 'cinematic-dark' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white bg-[#1F232B]'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setCardTemplate('cyberpunk-neon')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      cardTemplate === 'cyberpunk-neon' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white bg-[#1F232B]'
                    }`}
                  >
                    Neon
                  </button>
                  <button
                    onClick={() => setCardTemplate('clean-editorial')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      cardTemplate === 'clean-editorial' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-400 hover:text-white bg-[#1F232B]'
                    }`}
                  >
                    Light
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Ratio:</span>
                  <button
                    onClick={() => setCardAspect('1:1')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      cardAspect === '1:1' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white bg-[#1F232B]'
                    }`}
                  >
                    1:1 Square
                  </button>
                  <button
                    onClick={() => setCardAspect('16:9')}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      cardAspect === '16:9' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white bg-[#1F232B]'
                    }`}
                  >
                    16:9
                  </button>
                </div>
              </div>

              {/* Canvas Card Renderer Display */}
              <div className="w-full bg-[#0F1115] rounded-xl border border-white/5 p-2 overflow-hidden shadow-2xl flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto rounded-lg shadow-md border border-white/5"
                  style={{ maxHeight: '420px' }}
                />
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Mode 2: Executive Download Reports */}
      {activeTab === 'report' && (
        <div className="bg-[#16191E] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-semibold text-white font-sans">
                Audiobook Library Chromatic & Curatorial Report
              </h3>
              <p className="text-xs text-slate-400">
                Print-ready executive summary, color analysis, and complete catalog index
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-full transition-all shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={handleGenerateAIReport}
                disabled={isGeneratingReport}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1F232B] hover:bg-white/10 text-slate-200 text-xs font-medium rounded-full border border-white/10 transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                <span>Generate Curatorial Insights</span>
              </button>
            </div>
          </div>

          {/* Printable Report Document Body */}
          <div id="printable-report-document" className="bg-[#0F1115] p-6 sm:p-8 rounded-2xl border border-white/5 space-y-6 text-slate-200">
            
            {/* Report Header */}
            <div className="border-b border-white/5 pb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">
                  Audiobook Chromatic Intelligence Report
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <h1 className="text-2xl font-semibold font-sans text-white">
                {reportTitle}
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Source Library Path: {libraryPath}
              </p>
            </div>

            {/* Key Metric Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#16191E] rounded-xl border border-white/5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Audiobooks</p>
                <p className="text-xl font-semibold text-white font-sans">{stats.totalBooks} Titles</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Duration</p>
                <p className="text-xl font-semibold text-indigo-400 font-sans">{formatHours(stats.totalHours)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leading Palette</p>
                <p className="text-xl font-semibold text-white font-sans">{stats.topColorFamilies[0]?.family}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Decade Span</p>
                <p className="text-xl font-semibold text-white font-sans">{stats.earliestYear} — {stats.latestYear}</p>
              </div>
            </div>

            {/* AI or Algorithmic Analytical Narrative */}
            {aiReportText && (
              <div className="space-y-3 p-4 bg-[#16191E]/70 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Curatorial & Chromatic Analysis
                </h4>
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2 whitespace-pre-line">
                  {aiReportText}
                </div>
              </div>
            )}

            {/* Color Palette Distribution Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Cover Dominant Color Distribution
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {stats.topColorFamilies.map(fam => (
                  <div key={fam.family} className="p-2.5 bg-[#16191E] rounded-xl border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: fam.hex }} />
                      <span className="font-medium text-slate-200">{fam.family}</span>
                    </div>
                    <span className="font-mono text-slate-400">{fam.percentage}% ({fam.count})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Complete Catalog List Table */}
            {includeFullCatalog && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Full Audiobook Catalog & Chromatic Index ({audiobooks.length} items)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#16191E] text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Title</th>
                        <th className="px-3 py-2.5">Author</th>
                        <th className="px-3 py-2.5">Year</th>
                        <th className="px-3 py-2.5">Primary Genre</th>
                        <th className="px-3 py-2.5">Duration</th>
                        <th className="px-3 py-2.5">Dominant Color</th>
                        <th className="px-3 py-2.5">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {audiobooks.map(b => (
                        <tr key={b.id} className="hover:bg-[#16191E]/60">
                          <td className="px-3 py-2 font-medium text-slate-200">{b.title}</td>
                          <td className="px-3 py-2 text-slate-300">{b.author}</td>
                          <td className="px-3 py-2 font-mono text-slate-400">{b.year}</td>
                          <td className="px-3 py-2 text-slate-300">{b.genres[0]}</td>
                          <td className="px-3 py-2 font-mono text-indigo-400">{formatHours(b.durationHours)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.dominantColor.hex }} />
                              <span>{b.dominantColor.hex}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-400">{formatBytes(b.fileSizeBytes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Generated by Is it Pink? — What color is your audiobook shelf?</span>
              <span>Personal & Curatorial Use</span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
