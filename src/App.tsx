/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Audiobook, TreemapMetric, ActiveFilters } from './types';
import { DEFAULT_SAMPLE_AUDIOBOOKS } from './data/sampleAudiobooks';
import { calculateLibraryStats } from './utils/treemapUtils';
import { 
  loadLibraryFromLocalStorage, 
  saveLibraryToLocalStorage, 
  clearLocalStorageData,
  SavedMapPackage,
  fetchSavedMapsListFromServer,
  loadSavedMapFromServer,
  saveMapToServer
} from './utils/storageUtils';
import { Header } from './components/Header';
import { DominantColorTreemap } from './components/DominantColorTreemap';
import { MultiTreemapView } from './components/MultiTreemapView';
import { ChromaticAnalytics } from './components/ChromaticAnalytics';
import { ExportStudio } from './components/ExportStudio';
import { PathScannerModal } from './components/PathScannerModal';
import { AudiobookDetailModal } from './components/AudiobookDetailModal';
import { MapDataModal } from './components/MapDataModal';
import { FolderSearch, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  // Load saved state from localStorage if present
  const savedLibrary = useMemo(() => loadLibraryFromLocalStorage(), []);

  const [hasUserLoadedData, setHasUserLoadedData] = useState<boolean>(() => {
    return !!(savedLibrary?.books?.length);
  });

  // Entire Library Books state
  const [entireLibraryBooks, setEntireLibraryBooks] = useState<Audiobook[]>(() => {
    return savedLibrary?.books && savedLibrary.books.length > 0
      ? savedLibrary.books
      : DEFAULT_SAMPLE_AUDIOBOOKS;
  });
  
  const [libraryPath, setLibraryPath] = useState<string>(() => {
    return savedLibrary?.path || '/media/audiobooks/curated_speculative_fiction';
  });
  
  const [isMapDataModalOpen, setIsMapDataModalOpen] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    return savedLibrary?.timestamp || null;
  });

  // Feedback Notification Banner
  const [toastNotification, setToastNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4000);
  }, []);

  // Active collection
  const currentAudiobooks = entireLibraryBooks;

  const [currentTab, setCurrentTab] = useState<'dominantColor' | 'multiTreemap' | 'analytics' | 'export'>('dominantColor');
  const [metric, setMetric] = useState<TreemapMetric>('duration');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [selectedBookForModal, setSelectedBookForModal] = useState<Audiobook | null>(null);
  const [isPathScannerOpen, setIsPathScannerOpen] = useState<boolean>(false);

  // APP LOAD BEHAVIOR:
  // "load the last saved file. if no such file exists, open the library scanner modal automatically at app start."
  useEffect(() => {
    let isMounted = true;

    async function initializeStartupState() {
      try {
        const savedFiles = await fetchSavedMapsListFromServer();
        if (!isMounted) return;

        if (savedFiles && savedFiles.length > 0) {
          // Auto-load the last saved file (sorted with newest first)
          const latestFile = savedFiles[0];
          const pkg = await loadSavedMapFromServer(latestFile.filename);
          if (pkg && pkg.audiobooks && pkg.audiobooks.length > 0) {
            setEntireLibraryBooks(pkg.audiobooks);
            setLibraryPath(pkg.nameOrPath || '/media/audiobooks/curated_speculative_fiction');
            setHasUserLoadedData(true);
            setLastSavedTime(pkg.exportDate || new Date().toISOString());
            showToast(`Auto-loaded saved map: ${latestFile.nameOrPath} (${pkg.bookCount} books)`, 'success');
            return;
          }
        }

        // If no saved file exists on server, check if user has data in localStorage
        if (!savedLibrary?.books?.length) {
          setHasUserLoadedData(false);
          // Automatically open the library scanner modal at app start
          setIsPathScannerOpen(true);
        }
      } catch (err) {
        console.warn('Startup saved files check error:', err);
        if (!savedLibrary?.books?.length) {
          setHasUserLoadedData(false);
          setIsPathScannerOpen(true);
        }
      }
    }

    initializeStartupState();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live library statistics for current active collection
  const stats = useMemo(() => calculateLibraryStats(currentAudiobooks), [currentAudiobooks]);

  // Handle Search Filtering
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return currentAudiobooks;
    const q = searchQuery.toLowerCase();
    return currentAudiobooks.filter(b => 
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.genres.some(g => g.toLowerCase().includes(q)) ||
      b.tags.some(t => t.toLowerCase().includes(q)) ||
      b.dominantColor.colorName.toLowerCase().includes(q) ||
      b.dominantColor.colorFamily?.toLowerCase().includes(q)
    );
  }, [currentAudiobooks, searchQuery]);

  // Click on a Dominant Color Treemap box -> drill down into the Multi-Treemap page!
  const handleSelectColorBox = (book: Audiobook, colorFamily?: string) => {
    if (!hasUserLoadedData) return;
    setActiveFilters({
      colorFamily: colorFamily || book.dominantColor.colorFamily,
      colorHex: book.dominantColor.hex
    });
    setCurrentTab('multiTreemap');
  };

  // Reset filters
  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
  };

  // Quick Auto-Save to App Folder
  const handleQuickSave = async () => {
    setIsSaving(true);
    const result = await saveMapToServer({
      nameOrPath: libraryPath,
      serverUrl: null,
      username: null,
      mode: 'entireLibrary',
      audiobooks: currentAudiobooks,
      totalDurationHours: stats.totalHours
    });
    setIsSaving(false);

    if (result.success && result.filename) {
      showToast(`Saved automatically to app folder as ${result.filename}`, 'success');
      setLastSavedTime(new Date().toISOString());
    } else {
      showToast(result.error || 'Failed to save to app folder', 'error');
    }
  };

  // Smart Load Button Logic:
  // "when load is clicked, if there's only one save file, load it automatically, else show list for user to select."
  const handleSmartLoad = async () => {
    try {
      const files = await fetchSavedMapsListFromServer();
      if (!files || files.length === 0) {
        showToast('No saved maps found in local app folder. Open scanner to create one.', 'info');
        setIsMapDataModalOpen(true);
        return;
      }

      if (files.length === 1) {
        const file = files[0];
        const pkg = await loadSavedMapFromServer(file.filename);
        if (pkg && pkg.audiobooks && pkg.audiobooks.length > 0) {
          handleLoadMapData(pkg);
          showToast(`Loaded map: ${file.nameOrPath} (${pkg.bookCount} books)`, 'success');
        } else {
          setIsMapDataModalOpen(true);
        }
      } else {
        setIsMapDataModalOpen(true);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading saved maps', 'error');
      setIsMapDataModalOpen(true);
    }
  };

  // Handle Loading Map Package from JSON File/Paste
  const handleLoadMapData = (pkg: SavedMapPackage) => {
    setHasUserLoadedData(true);
    setEntireLibraryBooks(pkg.audiobooks);
    setLibraryPath(pkg.nameOrPath || '/media/audiobooks/imported');
    saveLibraryToLocalStorage(pkg.nameOrPath || '/media/audiobooks/imported', pkg.audiobooks);
    setLastSavedTime(new Date().toISOString());
    handleClearFilters();
  };

  // Reset to Default Sample Library
  const handleResetToDefault = () => {
    clearLocalStorageData();
    setEntireLibraryBooks(DEFAULT_SAMPLE_AUDIOBOOKS);
    setLibraryPath('/media/audiobooks/curated_speculative_fiction');
    setLastSavedTime(null);
    setHasUserLoadedData(false);
    handleClearFilters();
  };

  return (
    <div id="audiobook-app-root" className="min-h-screen bg-[#0F1115] text-slate-300 flex flex-col font-sans selection:bg-zinc-700 selection:text-white relative">
      
      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="fixed top-20 right-6 z-50 animate-fadeIn transition-all max-w-md">
          <div className={`p-3.5 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs ${
            toastNotification.type === 'success'
              ? 'bg-zinc-900 border-zinc-700 text-white'
              : toastNotification.type === 'error'
              ? 'bg-red-950/90 border-red-800 text-red-200'
              : 'bg-zinc-900 border-zinc-700 text-zinc-300'
          }`}>
            {toastNotification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastNotification.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {toastNotification.type === 'info' && <Sparkles className="w-4 h-4 text-amber-200/90 shrink-0" />}
            <span className="font-medium">{toastNotification.message}</span>
          </div>
        </div>
      )}

      {/* Header with Navigation, Metrics, Search & Path Control */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        libraryPath={libraryPath}
        onOpenPathScanner={() => setIsPathScannerOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        metric={metric}
        onMetricChange={setMetric}
        stats={stats}
        filteredCount={filteredBySearch.length}
        onOpenMapDataModal={() => setIsMapDataModalOpen(true)}
        onQuickSave={handleQuickSave}
        onSmartLoad={handleSmartLoad}
        isSaving={isSaving}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        
        {/* If dummy data / no user data loaded: Blur background and disable interaction */}
        <div className={`relative transition-all duration-300 ${!hasUserLoadedData ? 'filter blur-sm opacity-35 pointer-events-none select-none' : ''}`}>
          
          {/* Tab 1: Flagship Dominant Color Treemap (Level 1: No book titles, pure colors stacked by similarity) */}
          {currentTab === 'dominantColor' && (
            <DominantColorTreemap
              audiobooks={filteredBySearch}
              metric={metric}
              onSelectColorBox={handleSelectColorBox}
              onOpenBookDetail={(b) => setSelectedBookForModal(b)}
              activeFilters={activeFilters}
              onFilterColorFamily={(fam) => setActiveFilters(prev => ({ ...prev, colorFamily: fam }))}
            />
          )}

          {/* Tab 2: Multi-Treemap Explorer (Genres, Years, Tags, Authors, Palettes) */}
          {currentTab === 'multiTreemap' && (
            <MultiTreemapView
              allBooks={filteredBySearch}
              metric={metric}
              activeFilters={activeFilters}
              onUpdateFilters={setActiveFilters}
              onClearFilters={handleClearFilters}
              onOpenBookDetail={(b) => setSelectedBookForModal(b)}
              onBackToDominantColor={() => setCurrentTab('dominantColor')}
            />
          )}

          {/* Tab 3: Chromatic Analytics & Insights */}
          {currentTab === 'analytics' && (
            <ChromaticAnalytics
              audiobooks={filteredBySearch}
              stats={stats}
              onSelectBook={(b) => setSelectedBookForModal(b)}
            />
          )}

          {/* Tab 4: Download Reports & Social Post Studio */}
          {currentTab === 'export' && (
            <ExportStudio
              audiobooks={currentAudiobooks}
              stats={stats}
              libraryPath={libraryPath}
            />
          )}

        </div>

        {/* Dummy Data Overlay Notice & Action Banner */}
        {!hasUserLoadedData && (
          <div className="absolute inset-0 flex items-center justify-center p-4 z-20 pointer-events-auto">
            <div className="bg-[#12151A]/95 border border-zinc-700/90 rounded-2xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl backdrop-blur-md space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-850 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-200">
                <FolderSearch className="w-6 h-6 text-amber-200/90" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white">
                  Welcome to Is it Pink?
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Scan your local audiobook folder to analyze cover palettes, genres, and listening stats.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsPathScannerOpen(true)}
                  className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 text-white font-semibold text-xs rounded-full border border-zinc-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FolderSearch className="w-4 h-4 text-amber-200/90" />
                  <span>Scan Audiobook Library</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Path Scanner Modal */}
      <PathScannerModal
        isOpen={isPathScannerOpen}
        onClose={() => setIsPathScannerOpen(false)}
        currentPath={libraryPath}
        onScanComplete={(newPath, newBooks) => {
          setLibraryPath(newPath);
          setEntireLibraryBooks(newBooks);
          setHasUserLoadedData(true);
          saveLibraryToLocalStorage(newPath, newBooks);
          setLastSavedTime(new Date().toISOString());
          handleClearFilters();

          // Auto-save to server app folder as [server-url]-data.json
          saveMapToServer({
            nameOrPath: newPath,
            mode: 'entireLibrary',
            audiobooks: newBooks,
            totalDurationHours: newBooks.reduce((acc, b) => acc + (b.durationHours || 0), 0)
          }).catch(console.warn);

          showToast(`Scanned and mapped ${newBooks.length} audiobooks`, 'success');
        }}
      />

      {/* Map Data (Save / Load JSON & Cache) Modal */}
      <MapDataModal
        isOpen={isMapDataModalOpen}
        onClose={() => setIsMapDataModalOpen(false)}
        currentBooks={currentAudiobooks}
        libraryPath={libraryPath}
        libraryMode="entireLibrary"
        lastSavedTimestamp={lastSavedTime}
        onLoadMapData={handleLoadMapData}
        onResetToDefault={handleResetToDefault}
      />

      {/* Audiobook Inspector / Detail Modal */}
      <AudiobookDetailModal
        audiobook={selectedBookForModal}
        onClose={() => setSelectedBookForModal(null)}
        onFilterAuthor={(author) => {
          setActiveFilters(prev => ({ ...prev, author }));
          setCurrentTab('multiTreemap');
        }}
        onFilterGenre={(genre) => {
          setActiveFilters(prev => ({ ...prev, genre }));
          setCurrentTab('multiTreemap');
        }}
        onFilterColorFamily={(fam) => {
          setActiveFilters(prev => ({ ...prev, colorFamily: fam }));
          setCurrentTab('multiTreemap');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0A0C0F] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            <span>
              Is it Pink? • Audiobook Library Mode
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-600">D3 Treemap Engine • Persistent App Storage</span>
        </div>
      </footer>

    </div>
  );
}

export default App;

