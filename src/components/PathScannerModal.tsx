/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Folder, 
  FolderSearch, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  HardDrive, 
  Sparkles, 
  X,
  Play,
  Square,
  Zap,
  Gauge,
  FileJson
} from 'lucide-react';
import { Audiobook } from '../types';
import { extractDominantColorFromImage, classifyColor } from '../utils/colorUtils';
import { buildTreemapHierarchy } from '../utils/treemapUtils';
import { generateLargeLibrary } from '../utils/megaLibraryGenerator';
import { parseAndValidateMapJson } from '../utils/storageUtils';

interface PathScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onScanComplete: (newPath: string, newBooks: Audiobook[]) => void;
}

export const PathScannerModal: React.FC<PathScannerModalProps> = ({
  isOpen,
  onClose,
  currentPath,
  onScanComplete
}) => {
  const [inputPath, setInputPath] = useState(currentPath);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Progressive real-time stream state
  const [streamedBooks, setStreamedBooks] = useState<Audiobook[]>([]);
  const [currentScanningBook, setCurrentScanningBook] = useState<Audiobook | null>(null);
  const [scanSpeed, setScanSpeed] = useState<'normal' | 'fast' | 'hyper'>('fast');
  const [totalToScan, setTotalToScan] = useState<number>(0);
  
  const scanCancelRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const res = parseAndValidateMapJson(content);
      if (!res.valid || !res.data) {
        setScanError(res.error || 'Failed to parse JSON map package.');
        return;
      }
      setInputPath(res.data.nameOrPath);
      runProgressiveScan(res.data.audiobooks, res.data.nameOrPath);
    };
    reader.onerror = () => {
      setScanError('Failed to read the JSON file.');
    };
    reader.readAsText(file);
  };

  // Progressive Treemap calculation for the modal canvas (width: 580, height: 190)
  const progressiveNodes = React.useMemo(() => {
    if (streamedBooks.length === 0) return [];
    return buildTreemapHierarchy(
      streamedBooks,
      'dominantColor',
      'count',
      580,
      190,
      streamedBooks.length > 300 ? 1 : 2
    );
  }, [streamedBooks]);

  useEffect(() => {
    return () => {
      scanCancelRef.current = true;
    };
  }, []);

  if (!isOpen) return null;

  // Progressive Stream Runner: animates block creation and growth one book at a time
  const runProgressiveScan = async (books: Audiobook[], targetPath: string) => {
    setIsScanning(true);
    setScanError(null);
    setStreamedBooks([]);
    setCurrentScanningBook(null);
    setTotalToScan(books.length);
    scanCancelRef.current = false;

    const delayMs = scanSpeed === 'normal' ? 70 : (scanSpeed === 'fast' ? 18 : 2);
    const chunkSize = scanSpeed === 'hyper' ? 25 : 1;

    let accumulated: Audiobook[] = [];

    for (let i = 0; i < books.length; i += chunkSize) {
      if (scanCancelRef.current) {
        break;
      }

      const chunk = books.slice(i, i + chunkSize);
      accumulated = accumulated.concat(chunk);
      setStreamedBooks([...accumulated]);
      setCurrentScanningBook(chunk[chunk.length - 1]);
      setScanStatus(`Ingesting book ${accumulated.length} / ${books.length}: ${chunk[chunk.length - 1].title}`);

      // Yield frame for visual block growth animation
      if (delayMs > 0 && i < 150) {
        await new Promise(r => setTimeout(r, delayMs));
      } else if (i % 10 === 0) {
        await new Promise(r => setTimeout(r, Math.min(delayMs, 10)));
      }
    }

    setIsScanning(false);
    if (!scanCancelRef.current) {
      setTimeout(() => {
        onScanComplete(targetPath, books);
        onClose();
      }, 500);
    }
  };

  // Handle Server Path Scan
  const handleServerPathScan = async () => {
    if (!inputPath.trim()) {
      setScanError("Please enter a valid directory path.");
      return;
    }

    setScanError(null);
    setIsScanning(true);
    setScanStatus(`Querying directory metadata: ${inputPath}...`);

    try {
      const res = await fetch('/api/scan-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryPath: inputPath.trim() })
      });

      const data = await res.json();
      let booksToStream: Audiobook[] = [];

      if (data.items && data.items.length > 0) {
        booksToStream = data.items;
      } else {
        throw new Error(`No audiobooks found at "${inputPath}". Please check folder permissions or try picking a Local Folder.`);
      }

      await runProgressiveScan(booksToStream, inputPath);
    } catch (err: any) {
      setIsScanning(false);
      setScanError(err.message || "Failed to scan library directory.");
    }
  };

  // Handle Browser Folder Upload (webkitdirectory)
  const handleBrowserFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    setScanError(null);
    setScanStatus(`Reading ${files.length} files from local folder...`);

    try {
      const folderGroups: Record<string, { audioFiles: File[]; coverFile: File | null }> = {};
      let rootFolderName = "My_Audiobooks_Folder";

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const relativePath = file.webkitRelativePath || file.name;
        const parts = relativePath.split('/');
        
        if (parts.length > 1) {
          rootFolderName = parts[0];
          const subFolderName = parts.length > 2 ? parts[1] : parts[0];
          
          if (!folderGroups[subFolderName]) {
            folderGroups[subFolderName] = { audioFiles: [], coverFile: null };
          }

          if (/\.(jpg|jpeg|png|webp|avif)$/i.test(file.name)) {
            if (!folderGroups[subFolderName].coverFile || file.name.toLowerCase().includes('cover') || file.name.toLowerCase().includes('folder')) {
              folderGroups[subFolderName].coverFile = file;
            }
          } else if (/\.(mp3|m4b|m4a|flac|aac|wav|ogg)$/i.test(file.name)) {
            folderGroups[subFolderName].audioFiles.push(file);
          }
        }
      }

      const extractedBooks: Audiobook[] = [];
      const entries = Object.entries(folderGroups);

      if (entries.length === 0) {
        setScanError("No audiobooks or subfolders detected in selected folder.");
        setIsScanning(false);
        return;
      }

      for (let idx = 0; idx < entries.length; idx++) {
        const [folderName, group] = entries[idx];
        let title = folderName;
        let author = "Unknown Author";
        let year = 2020 + (idx % 5);

        const yearMatch = folderName.match(/\((\d{4})\)|\[(\d{4})\]/);
        if (yearMatch) {
          year = parseInt(yearMatch[1] || yearMatch[2], 10);
        }

        const cleanName = folderName.replace(/\(\d{4}\)|\[\d{4}\]/, '').trim();
        if (cleanName.includes(' - ')) {
          const parts = cleanName.split(' - ');
          author = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        }

        let coverUrl = '';
        let dominantColor = classifyColor(
          (idx * 47) % 255,
          (idx * 89) % 255,
          (idx * 131) % 255
        );
        let palette = [
          { hex: dominantColor.hex, colorName: dominantColor.colorName, percentage: 50, rgb: dominantColor.rgb }
        ];

        if (group.coverFile) {
          coverUrl = URL.createObjectURL(group.coverFile);
          try {
            const colorResult = await extractDominantColorFromImage(coverUrl);
            dominantColor = colorResult.dominant;
            palette = colorResult.palette;
          } catch (e) {
            // fallback
          }
        } else {
          coverUrl = `data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600"><rect width="400" height="600" fill="${dominantColor.hex}"/><text x="200" y="280" font-family="sans-serif" font-size="24" fill="#ffffff" text-anchor="middle">${title.slice(0, 18)}</text><text x="200" y="320" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.8)" text-anchor="middle">${author}</text></svg>`
          )}`;
        }

        const totalBytes = group.audioFiles.reduce((acc, f) => acc + f.size, 0) || (350 * 1024 * 1024);
        const durationHours = Math.round((totalBytes / (1024 * 1024 * 32)) * 10) / 10;

        extractedBooks.push({
          id: `local-${idx}-${Date.now()}`,
          title: title || folderName,
          author: author,
          year: year,
          genres: ["Audiobook", idx % 2 === 0 ? "Sci-Fi" : "Fiction"],
          tags: ["#LocalImport", "#AudiobookFolder"],
          durationHours: Math.max(1, durationHours),
          fileSizeBytes: totalBytes,
          folderPath: `/${rootFolderName}/${folderName}`,
          coverPath: group.coverFile ? `/${rootFolderName}/${folderName}/${group.coverFile.name}` : undefined,
          coverUrl: coverUrl,
          hasCoverImage: !!group.coverFile,
          dominantColor: dominantColor,
          palette: palette,
          description: `Audiobook scanned from local path: ${folderName}`,
          narrator: "Narrated Audio",
          rating: 4.8,
          audioFormat: group.audioFiles[0]?.name.split('.').pop() || "m4b",
          bitrateKbps: 64
        });
      }

      await runProgressiveScan(extractedBooks, `/${rootFolderName}`);
    } catch (err: any) {
      setIsScanning(false);
      setScanError(err.message || "Failed to process folder");
    }
  };

  return (
    <div id="path-scanner-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="path-scanner-modal-card" 
        className="w-full max-w-2xl bg-[#12151A] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#12151A]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-700">
              <FolderSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Audiobook Library Scanner
              </h2>
              <p className="text-xs text-zinc-400">
                Scan your collection to build an interactive chromatic cover palette treemap
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              scanCancelRef.current = true;
              onClose();
            }}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Live Dynamic Block Growth Treemap Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-200/90" />
                <span>Live Block Growth Scanner ({streamedBooks.length.toLocaleString()} books processed)</span>
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span>Speed:</span>
                <button
                  onClick={() => setScanSpeed('normal')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${scanSpeed === 'normal' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  1x
                </button>
                <button
                  onClick={() => setScanSpeed('fast')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${scanSpeed === 'fast' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  5x
                </button>
                <button
                  onClick={() => setScanSpeed('hyper')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${scanSpeed === 'hyper' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Turbo
                </button>
              </div>
            </div>

            {/* SVG Live Growth Canvas */}
            <div className="w-full h-44 bg-[#090B0E] border border-zinc-800 rounded-xl overflow-hidden relative flex flex-col items-center justify-center">
              {streamedBooks.length === 0 ? (
                <div className="text-center p-4 space-y-1 text-zinc-500">
                  <Gauge className="w-8 h-8 mx-auto text-zinc-600 mb-1" />
                  <p className="text-xs font-medium text-zinc-400">Ready to scan your library</p>
                  <p className="text-[11px]">Blocks will appear and grow in real-time as colors are classified</p>
                </div>
              ) : (
                <svg width="580" height="190" className="w-full h-full block">
                  {progressiveNodes.map((node) => {
                    const x = node.x0 || 0;
                    const y = node.y0 || 0;
                    const w = Math.max(0, (node.x1 || 0) - x);
                    const h = Math.max(0, (node.y1 || 0) - y);
                    if (w <= 0.5 || h <= 0.5) return null;

                    return (
                      <g key={node.id} transform={`translate(${x}, ${y})`}>
                        <rect
                          width={w}
                          height={h}
                          fill={node.color}
                          stroke="#090B0E"
                          strokeWidth={1}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Ticker Overlay of Current Ingested Book */}
              {currentScanningBook && (
                <div className="absolute bottom-2 left-2 right-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs text-zinc-200 shadow-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-3 h-3 rounded-full border border-white/20 shrink-0 shadow-xs" 
                      style={{ backgroundColor: currentScanningBook.dominantColor.hex }}
                    />
                    <span className="font-semibold text-white truncate text-[11px]">
                      {currentScanningBook.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 hidden sm:inline truncate">
                      by {currentScanningBook.author}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-200/90 shrink-0 font-semibold">
                    {currentScanningBook.dominantColor.colorFamily} ({currentScanningBook.dominantColor.hex})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Option 1: Scan Server Path */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-white">
                Option 1: Scan Server Path
              </label>
              <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                Server / NAS / Docker Mount
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              <strong>Server Path:</strong> Scans a directory directly on your host machine, container, or network NAS (e.g., <code className="text-zinc-300 font-mono">/media/audiobooks</code> or <code className="text-zinc-300 font-mono">D:\Audiobooks</code>).
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Folder className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="library-path-input-field"
                  type="text"
                  value={inputPath}
                  onChange={(e) => setInputPath(e.target.value)}
                  placeholder="/media/audiobooks or D:\Audiobooks"
                  className="w-full bg-zinc-850 font-mono text-xs pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-amber-200/40 text-zinc-200"
                />
              </div>
              <button
                id="btn-scan-path"
                onClick={handleServerPathScan}
                disabled={isScanning}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all border border-zinc-700 shadow-md disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isScanning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-200/90" />
                )}
                <span>Scan Path</span>
              </button>
            </div>
          </div>

          {/* Option 2: Browser Local Computer Folder & Load Map File */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Action 1: Select Browser Folder */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Upload className="w-3.5 h-3.5 text-zinc-300" />
                  <span className="text-xs font-semibold text-white">Option 2: Local Folder</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  <strong>Local Folder:</strong> Select an audiobook folder directly from your local computer in your browser. Analyzes cover images in real-time without needing a server path.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleBrowserFolderSelect}
                // @ts-ignore
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
              />

              <button
                id="btn-pick-browser-folder"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5 text-zinc-300" />
                <span>Browse Local Computer</span>
              </button>
            </div>

            {/* Action 2: Load Saved Map JSON */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold text-white">Import Map File</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  <strong>Map File:</strong> Import an exported <code className="font-mono text-indigo-300 text-[10px]">.json</code> map package created from a previous scan or shared by another user.
                </p>
              </div>

              <input
                type="file"
                ref={jsonFileInputRef}
                onChange={handleJsonMapUpload}
                accept=".json,application/json"
                className="hidden"
              />

              <button
                onClick={() => jsonFileInputRef.current?.click()}
                disabled={isScanning}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 text-indigo-400" />
                <span>Select .json Map</span>
              </button>
            </div>
          </div>

          {/* Error display if any */}
          {scanError && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0A0C0F] border-t border-zinc-800 flex items-center justify-between text-xs">
          {streamedBooks.length > 0 && isScanning ? (
            <button
              onClick={() => {
                scanCancelRef.current = true;
                setIsScanning(false);
                onScanComplete(inputPath, streamedBooks);
                onClose();
              }}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-full font-medium transition-colors cursor-pointer"
            >
              Apply Current ({streamedBooks.length.toLocaleString()} books)
            </button>
          ) : (
            <span className="text-zinc-500 text-[11px]">
              Choose a scan option to build your color map
            </span>
          )}

          <button
            onClick={() => {
              scanCancelRef.current = true;
              onClose();
            }}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-full transition-colors border border-zinc-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
