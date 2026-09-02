/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Audiobook, LibraryMode, AudiobookshelfConfig } from '../types';

const STORAGE_KEYS = {
  ENTIRE_LIBRARY: 'is_it_pink_entire_library_v1',
  READ_LIST: 'is_it_pink_read_list_v1',
  ABS_CONFIG: 'is_it_pink_abs_config_v1',
  ACTIVE_MODE: 'is_it_pink_active_mode_v1',
  LAST_SAVED: 'is_it_pink_last_saved_timestamp',
};

export interface SavedMapPackage {
  version: string;
  appName: string;
  exportDate: string;
  nameOrPath: string;
  mode: LibraryMode;
  bookCount: number;
  totalDurationHours: number;
  totalSizeBytes?: number;
  audiobooks: Audiobook[];
}

/**
 * Strips huge base64 cover strings if needed to ensure localStorage quota (< 5MB) is never exceeded
 */
function sanitizeBooksForLocalStorage(books: Audiobook[]): Audiobook[] {
  return books.map(book => {
    // If coverUrl is a gigantic data URL (> 200KB), create a lightweight placeholder or preserve color palette
    if (book.coverUrl && book.coverUrl.startsWith('data:') && book.coverUrl.length > 200000) {
      return {
        ...book,
        coverUrl: '' // Keep color metadata intact while saving space
      };
    }
    return book;
  });
}

/**
 * Save Entire Library Scan to localStorage
 */
export function saveLibraryToLocalStorage(path: string, books: Audiobook[]): boolean {
  try {
    const payload = {
      path,
      books: sanitizeBooksForLocalStorage(books),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.ENTIRE_LIBRARY, JSON.stringify(payload));
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
    return true;
  } catch (err) {
    console.warn('[Storage] Failed to save library to localStorage:', err);
    // If quota exceeded, try stripping all data URLs
    try {
      const minimalBooks = books.map(b => ({
        ...b,
        coverUrl: b.coverUrl?.startsWith('data:') ? '' : b.coverUrl
      }));
      const payload = {
        path,
        books: minimalBooks,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.ENTIRE_LIBRARY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Load Entire Library from localStorage
 */
export function loadLibraryFromLocalStorage(): { path: string; books: Audiobook[]; timestamp?: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTIRE_LIBRARY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.books) && parsed.books.length > 0) {
      return {
        path: parsed.path || '/media/audiobooks',
        books: parsed.books,
        timestamp: parsed.timestamp
      };
    }
  } catch (err) {
    console.warn('[Storage] Failed to load library from localStorage:', err);
  }
  return null;
}

/**
 * Save Shelf / Read List to localStorage
 */
export function saveShelfToLocalStorage(config: AudiobookshelfConfig | null, books: Audiobook[]): boolean {
  try {
    const payload = {
      config,
      books: sanitizeBooksForLocalStorage(books),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.READ_LIST, JSON.stringify(payload));
    if (config) {
      // Avoid storing raw token in localStorage if user prefers security, or store safely
      localStorage.setItem(STORAGE_KEYS.ABS_CONFIG, JSON.stringify({
        serverUrl: config.serverUrl,
        username: config.username,
        connectedAt: config.connectedAt,
        readCount: config.readCount
      }));
    }
    return true;
  } catch (err) {
    console.warn('[Storage] Failed to save shelf to localStorage:', err);
    return false;
  }
}

/**
 * Load Shelf / Read List from localStorage
 */
export function loadShelfFromLocalStorage(): { config: AudiobookshelfConfig | null; books: Audiobook[]; timestamp?: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.READ_LIST);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.books) && parsed.books.length > 0) {
      return {
        config: parsed.config || null,
        books: parsed.books,
        timestamp: parsed.timestamp
      };
    }
  } catch (err) {
    console.warn('[Storage] Failed to load shelf from localStorage:', err);
  }
  return null;
}

/**
 * Clear Local Storage cache
 */
export function clearLocalStorageData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ENTIRE_LIBRARY);
    localStorage.removeItem(STORAGE_KEYS.READ_LIST);
    localStorage.removeItem(STORAGE_KEYS.ABS_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_MODE);
    localStorage.removeItem(STORAGE_KEYS.LAST_SAVED);
  } catch (err) {
    console.warn('[Storage] Failed to clear localStorage:', err);
  }
}

/**
 * Generate a downloadable JSON map package
 */
export function createMapDataPackage(
  nameOrPath: string,
  books: Audiobook[],
  mode: LibraryMode = 'entireLibrary'
): SavedMapPackage {
  const totalDurationHours = books.reduce((sum, b) => sum + (b.durationHours || 0), 0);
  const totalSizeBytes = books.reduce((sum, b) => sum + (b.fileSizeBytes || 0), 0);

  return {
    version: '1.0',
    appName: 'is-it-pink',
    exportDate: new Date().toISOString(),
    nameOrPath,
    mode,
    bookCount: books.length,
    totalDurationHours: Number(totalDurationHours.toFixed(1)),
    totalSizeBytes,
    audiobooks: books
  };
}

/**
 * Download map data package as a .json file
 */
export function downloadMapDataAsJson(
  nameOrPath: string,
  books: Audiobook[],
  mode: LibraryMode = 'entireLibrary'
): void {
  const pkg = createMapDataPackage(nameOrPath, books, mode);
  const jsonStr = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Clean filename slug
  const sanitizedName = (nameOrPath || 'audiobook-map')
    .replace(/^.*[\\/]/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `is-it-pink-map-${sanitizedName}-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate imported JSON map data
 */
export function parseAndValidateMapJson(jsonString: string): { 
  valid: boolean; 
  data?: SavedMapPackage; 
  error?: string 
} {
  try {
    const parsed = JSON.parse(jsonString);

    // Support both direct SavedMapPackage schema and simple array of audiobooks
    let books: Audiobook[] = [];
    let nameOrPath = '/imported-audiobook-library';
    let mode: LibraryMode = 'entireLibrary';

    if (Array.isArray(parsed)) {
      books = parsed;
    } else if (parsed && Array.isArray(parsed.audiobooks)) {
      books = parsed.audiobooks;
      nameOrPath = parsed.nameOrPath || parsed.libraryPath || nameOrPath;
      mode = parsed.mode || mode;
    } else if (parsed && Array.isArray(parsed.books)) {
      books = parsed.books;
      nameOrPath = parsed.path || parsed.nameOrPath || nameOrPath;
      mode = parsed.mode || mode;
    } else {
      return { 
        valid: false, 
        error: 'JSON file does not contain a valid audiobook array or is-it-pink map structure.' 
      };
    }

    if (books.length === 0) {
      return { 
        valid: false, 
        error: 'No audiobooks found in the provided JSON file.' 
      };
    }

    // Verify minimum required fields for first item
    const first = books[0];
    if (!first.id || !first.title || !first.dominantColor || !first.dominantColor.hex) {
      return { 
        valid: false, 
        error: 'Audiobook records are missing required metadata fields (id, title, dominantColor.hex).' 
      };
    }

    const pkg = createMapDataPackage(nameOrPath, books, mode);
    return { valid: true, data: pkg };
  } catch (err: any) {
    return { 
      valid: false, 
      error: `Invalid JSON format: ${err.message || 'Syntax error'}` 
    };
  }
}
