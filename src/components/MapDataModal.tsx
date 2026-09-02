/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  FileJson, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FileCode,
  HardDrive
} from 'lucide-react';
import { Audiobook, LibraryMode } from '../types';
import { 
  downloadMapDataAsJson, 
  createMapDataPackage, 
  parseAndValidateMapJson, 
  clearLocalStorageData,
  SavedMapPackage
} from '../utils/storageUtils';
import { formatHours } from '../utils/colorUtils';

interface MapDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBooks: Audiobook[];
  libraryPath: string;
  libraryMode: LibraryMode;
  lastSavedTimestamp?: string | null;
  onLoadMapData: (pkg: SavedMapPackage) => void;
  onResetToDefault: () => void;
}

export const MapDataModal: React.FC<MapDataModalProps> = ({
  isOpen,
  onClose,
  currentBooks,
  libraryPath,
  libraryMode,
  lastSavedTimestamp,
  onLoadMapData,
  onResetToDefault
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'cache'>('export');
  const [copiedJson, setCopiedJson] = useState(false);
  const [jsonPasteInput, setJsonPasteInput] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string; pkg?: SavedMapPackage } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentPkg = createMapDataPackage(libraryPath, currentBooks, libraryMode);
  const jsonString = JSON.stringify(currentPkg, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownload = () => {
    downloadMapDataAsJson(libraryPath, currentBooks, libraryMode);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      validateAndStageJson(content);
    };
    reader.onerror = () => {
      setImportStatus({ success: false, message: 'Failed to read the selected file.' });
    };
    reader.readAsText(file);
  };

  const validateAndStageJson = (text: string) => {
    const result = parseAndValidateMapJson(text);
    if (!result.valid || !result.data) {
      setImportStatus({
        success: false,
        message: result.error || 'Invalid JSON file format.'
      });
      return;
    }

    setImportStatus({
      success: true,
      message: `Valid map package detected with ${result.data.bookCount} audiobooks (${result.data.totalDurationHours} hrs).`,
      pkg: result.data
    });
  };

  const handleApplyImport = () => {
    if (importStatus?.pkg) {
      onLoadMapData(importStatus.pkg);
      onClose();
    }
  };

  return (
    <div 
      id="map-data-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-[#12151A] border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-300">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Save & Load Map Data</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  JSON Engine
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Backup, restore, and transfer your scanned audiobook color maps
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('export'); setImportStatus(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-200 bg-indigo-950/20 rounded-t-lg'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save / Export Map</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('import'); setImportStatus(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-indigo-500 text-indigo-200 bg-indigo-950/20 rounded-t-lg'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Load / Import Map</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('cache'); setImportStatus(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'cache'
                ? 'border-indigo-500 text-indigo-200 bg-indigo-950/20 rounded-t-lg'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local Cache</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-zinc-300 text-xs">
          
          {/* TAB 1: EXPORT / SAVE */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-white">Current Active Map</span>
                    <p className="text-[11px] text-zinc-400 font-mono truncate max-w-sm">
                      {libraryPath}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-indigo-300">{currentBooks.length}</span>
                    <span className="text-[10px] text-zinc-400 block">audiobooks</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block">Duration</span>
                    <span className="font-semibold text-zinc-200">{formatHours(currentPkg.totalDurationHours)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Mode</span>
                    <span className="font-semibold text-zinc-200">{libraryMode === 'readList' ? 'My Shelf' : 'Entire Library'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Format</span>
                    <span className="font-semibold text-emerald-400">JSON Package v1.0</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .JSON Map File</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-medium rounded-xl border border-zinc-700 transition-all cursor-pointer"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Raw JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Collapsible JSON Preview */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400">
                  JSON Raw Payload Preview
                </label>
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-[10px] text-zinc-400 max-h-36 overflow-y-auto leading-relaxed select-all">
                  <pre>{jsonString.slice(0, 1500) + (jsonString.length > 1500 ? '\n... (truncated for preview)' : '')}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT / LOAD */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2.5 transition-colors cursor-pointer text-center ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-950/20' 
                    : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/40'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept=".json,application/json" 
                  className="hidden" 
                />
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-white block text-sm">
                    Drop your saved map JSON file here
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    or click to browse from your computer
                  </span>
                </div>
              </div>

              {/* Paste JSON Option */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400">
                  Or paste raw JSON content below:
                </label>
                <textarea
                  value={jsonPasteInput}
                  onChange={e => {
                    setJsonPasteInput(e.target.value);
                    if (e.target.value.trim()) {
                      validateAndStageJson(e.target.value);
                    } else {
                      setImportStatus(null);
                    }
                  }}
                  placeholder="Paste map package JSON text here..."
                  className="w-full h-24 p-3 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Validation Feedback */}
              {importStatus && (
                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                  importStatus.success 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                    : 'bg-red-950/30 border-red-500/40 text-red-200'
                }`}>
                  {importStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 flex-1">
                    <p className="font-medium">{importStatus.message}</p>
                    {importStatus.pkg && (
                      <div className="text-[11px] opacity-90 font-mono">
                        Path/Name: {importStatus.pkg.nameOrPath} • {importStatus.pkg.bookCount} books
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Load Button */}
              {importStatus?.success && (
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Load and Render this Map</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: LOCAL CACHE & AUTO-SAVE */}
          {activeTab === 'cache' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <span>Browser Local Storage Persistence</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Your scanned libraries and Audiobookshelf shelves are <strong>automatically saved to your browser&apos;s local storage</strong>.
                  Refreshing the page or reopening the browser tab will retain your latest scanned colors and layout.
                </p>

                <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Last Auto-Save:</span>
                  <span className="font-mono text-zinc-200 font-medium">
                    {lastSavedTimestamp ? new Date(lastSavedTimestamp).toLocaleString() : 'Active session loaded'}
                  </span>
                </div>
              </div>

              <div className="p-4 border border-zinc-800 bg-zinc-900/40 rounded-xl space-y-3">
                <span className="font-semibold text-zinc-200 block">Reset & Cache Maintenance</span>
                <p className="text-[11px] text-zinc-400">
                  If you want to clear your saved cache and revert back to the default sample library:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearLocalStorageData();
                    onResetToDefault();
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Clear Saved Local Data & Reset</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Safe & Offline-friendly • No external cloud dependencies</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
