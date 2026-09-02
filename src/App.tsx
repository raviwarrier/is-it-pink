/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Audiobook, TreemapMetric, ActiveFilters, LibraryMode, AudiobookshelfConfig } from './types';
import { SAMPLE_LIBRARIES, DEFAULT_SAMPLE_AUDIOBOOKS } from './data/sampleAudiobooks';
import { calculateLibraryStats } from './utils/treemapUtils';
import { 
  loadLibraryFromLocalStorage, 
  loadShelfFromLocalStorage, 
  saveLibraryToLocalStorage, 
  saveShelfToLocalStorage, 
  clearLocalStorageData,
  SavedMapPackage 
} from './utils/storageUtils';
import { Header } from './components/Header';
import { DominantColorTreemap } from './components/DominantColorTreemap';
import { MultiTreemapView } from './components/MultiTreemapView';
import { ChromaticAnalytics } from './components/ChromaticAnalytics';
import { ExportStudio } from './components/ExportStudio';
import { PathScannerModal } from './components/PathScannerModal';
import { AudiobookDetailModal } from './components/AudiobookDetailModal';
import { AudiobookshelfModal } from './components/AudiobookshelfModal';
import { MapDataModal } from './components/MapDataModal';

export function App() {
  // Load saved state from localStorage if present
  const savedLibrary = useMemo(() => loadLibraryFromLocalStorage(), []);
  const savedShelf = useMemo(() => loadShelfFromLocalStorage(), []);

  // Entire Library Books state
  const [entireLibraryBooks, setEntireLibraryBooks] = useState<Audiobook[]>(() => {
    return savedLibrary?.books && savedLibrary.books.length > 0
      ? savedLibrary.books
      : DEFAULT_SAMPLE_AUDIOBOOKS;
  });
  
  const [libraryPath, setLibraryPath] = useState<string>(() => {
    return savedLibrary?.path || '/media/audiobooks/curated_speculative_fiction';
  });
  
  // Library Mode Toggle (Option 1: Entire Library vs Option 2: My Reading Analysis)
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('entireLibrary');
  const [readListBooks, setReadListBooks] = useState<Audiobook[]>(() => {
    return savedShelf?.books || [];
  });
  const [absConfig, setAbsConfig] = useState<AudiobookshelfConfig | null>(() => {
    return savedShelf?.config || null;
  });
  const [isAbsModalOpen, setIsAbsModalOpen] = useState<boolean>(false);
  const [isMapDataModalOpen, setIsMapDataModalOpen] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => {
    return savedLibrary?.timestamp || savedShelf?.timestamp || null;
  });

  // Active collection based on toggle mode
  const currentAudiobooks = useMemo(() => {
    if (libraryMode === 'readList') {
      return readListBooks.length > 0 ? readListBooks : entireLibraryBooks.slice(0, 16);
    }
    return entireLibraryBooks;
  }, [libraryMode, readListBooks, entireLibraryBooks]);

  const [currentTab, setCurrentTab] = useState<'dominantColor' | 'multiTreemap' | 'analytics' | 'export'>('dominantColor');
  const [metric, setMetric] = useState<TreemapMetric>('duration');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [selectedBookForModal, setSelectedBookForModal] = useState<Audiobook | null>(null);
  const [isPathScannerOpen, setIsPathScannerOpen] = useState<boolean>(false);

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
    setActiveFilters({
      colorFamily: colorFamily || book.dominantColor.colorFamily,
      colorHex: book.dominantColor.hex
    });
    // Navigate immediately to the Multi-Treemap Explorer page as requested!
    setCurrentTab('multiTreemap');
  };

  // Reset filters
  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
  };

  // Audiobookshelf Connect Success Handler
  const handleAbsConnectSuccess = (config: AudiobookshelfConfig, books: Audiobook[]) => {
    setAbsConfig(config);
    setReadListBooks(books);
    setLibraryMode('readList');
    saveShelfToLocalStorage(config, books);
    setLastSavedTime(new Date().toISOString());
    handleClearFilters();
  };

  // Audiobookshelf Disconnect Handler (Zero persistence / memory purge)
  const handleAbsDisconnect = () => {
    setAbsConfig(null);
    setReadListBooks([]);
    setLibraryMode('entireLibrary');
    saveShelfToLocalStorage(null, []);
    handleClearFilters();
  };

  // Handle Loading Map Package from JSON File/Paste
  const handleLoadMapData = (pkg: SavedMapPackage) => {
    if (pkg.mode === 'readList') {
      setReadListBooks(pkg.audiobooks);
      setLibraryMode('readList');
      saveShelfToLocalStorage(absConfig, pkg.audiobooks);
    } else {
      setEntireLibraryBooks(pkg.audiobooks);
      setLibraryPath(pkg.nameOrPath || '/media/audiobooks/imported');
      setLibraryMode('entireLibrary');
      saveLibraryToLocalStorage(pkg.nameOrPath || '/media/audiobooks/imported', pkg.audiobooks);
    }
    setLastSavedTime(new Date().toISOString());
    handleClearFilters();
  };

  // Reset to Default Sample Library
  const handleResetToDefault = () => {
    clearLocalStorageData();
    setEntireLibraryBooks(DEFAULT_SAMPLE_AUDIOBOOKS);
    setLibraryPath('/media/audiobooks/curated_speculative_fiction');
    setReadListBooks([]);
    setAbsConfig(null);
    setLibraryMode('entireLibrary');
    setLastSavedTime(null);
    handleClearFilters();
  };

  return (
    <div id="audiobook-app-root" className="min-h-screen bg-[#0F1115] text-slate-300 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Header with Navigation, Option 1/2 Toggle, Metrics, Search & Path Control */}
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
        libraryMode={libraryMode}
        onLibraryModeChange={(mode) => {
          setLibraryMode(mode);
          handleClearFilters();
        }}
        onOpenAbsModal={() => setIsAbsModalOpen(true)}
        absConfig={absConfig}
        readCount={readListBooks.length > 0 ? readListBooks.length : 16}
        onOpenMapDataModal={() => setIsMapDataModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
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
            libraryPath={libraryMode === 'readList' ? (absConfig?.serverUrl || 'Audiobookshelf Read List') : libraryPath}
          />
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
          setLibraryMode('entireLibrary');
          saveLibraryToLocalStorage(newPath, newBooks);
          setLastSavedTime(new Date().toISOString());
          handleClearFilters();
        }}
        sampleLibraries={SAMPLE_LIBRARIES}
      />

      {/* Map Data (Save / Load JSON & Cache) Modal */}
      <MapDataModal
        isOpen={isMapDataModalOpen}
        onClose={() => setIsMapDataModalOpen(false)}
        currentBooks={currentAudiobooks}
        libraryPath={libraryPath}
        libraryMode={libraryMode}
        lastSavedTimestamp={lastSavedTime}
        onLoadMapData={handleLoadMapData}
        onResetToDefault={handleResetToDefault}
      />

      {/* Audiobookshelf "My Reading Analysis" Modal */}
      <AudiobookshelfModal
        isOpen={isAbsModalOpen}
        onClose={() => setIsAbsModalOpen(false)}
        config={absConfig}
        onConnectSuccess={handleAbsConnectSuccess}
        onDisconnect={handleAbsDisconnect}
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
            <span className={`w-1.5 h-1.5 rounded-full ${libraryMode === 'readList' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`}></span>
            <span>
              Is it Pink? • {libraryMode === 'readList' ? `My Shelf (${absConfig?.username || 'Active Read List'})` : 'Library Mode'}
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-600">D3 Treemap Engine • Zero-Trace Privacy Architecture</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
