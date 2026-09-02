/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DominantColorInfo {
  hex: string;
  rgb: [number, number, number];
  hsl: [number, number, number];
  colorName: string;
  colorFamily: string; // e.g. "Red", "Orange", "Yellow", "Green", "Cyan", "Blue", "Purple", "Magenta", "Black", "White", "Gray"
  luminance: number; // 0 to 1
}

export interface PaletteSwatch {
  hex: string;
  colorName: string;
  percentage: number;
  rgb: [number, number, number];
}

export interface Audiobook {
  id: string;
  title: string;
  author: string;
  year: number;
  genres: string[];
  tags: string[];
  durationHours: number; // e.g. 14.5
  durationMinutes?: number;
  fileSizeBytes: number; // e.g. 450 * 1024 * 1024
  folderPath: string;
  coverPath?: string;
  coverUrl: string;
  hasCoverImage: boolean;
  dominantColor: DominantColorInfo;
  palette: PaletteSwatch[];
  description: string;
  narrator: string;
  series?: string;
  seriesNumber?: number;
  rating: number; // 1-5
  audioFormat: string; // "m4b", "mp3", "flac"
  bitrateKbps: number;
  isFavorite?: boolean;
}

export interface TreemapNode {
  name: string;
  id: string;
  value: number; // computed size
  count?: number;
  percentage?: number;
  durationHours?: number;
  fileSizeBytes?: number;
  color: string;
  textColor?: string;
  hex?: string;
  colorName?: string;
  colorFamily?: string;
  category?: string;
  audiobook?: Audiobook;
  audiobooks?: Audiobook[];
  children?: TreemapNode[];
  // D3 computed coordinates
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
}

export type TreemapMetric = 'count' | 'duration' | 'fileSize';

export type TreemapViewType = 'dominantColor' | 'genre' | 'year' | 'tags' | 'author' | 'palette';

export type LibraryMode = 'entireLibrary' | 'readList';

export interface AudiobookshelfConfig {
  serverUrl: string;
  apiToken: string;
  username?: string;
  connectedAt?: string;
  readCount?: number;
}

export interface ActiveFilters {
  colorFamily?: string;
  colorHex?: string;
  genre?: string;
  year?: number;
  decade?: string;
  author?: string;
  tag?: string;
  searchQuery?: string;
}

export interface LibraryStats {
  totalBooks: number;
  totalHours: number;
  totalSizeBytes: number;
  uniqueAuthorsCount: number;
  uniqueGenresCount: number;
  uniqueTagsCount: number;
  earliestYear: number;
  latestYear: number;
  topColorFamilies: { family: string; count: number; percentage: number; hex: string }[];
  topGenres: { genre: string; count: number; totalHours: number; percentage: number }[];
  topAuthors: { author: string; count: number; totalHours: number }[];
  topTags: { tag: string; count: number }[];
  decadeDistribution: { decade: string; count: number }[];
}

export type SocialPlatform = 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'threads';

export interface SocialCardConfig {
  template: 'cinematic-dark' | 'clean-editorial' | 'cyberpunk-neon' | 'literary-parchment' | 'chromatic-grid';
  aspectRatio: '1:1' | '16:9' | '9:16' | '1.91:1';
  headline: string;
  subheadline: string;
  includeStats: boolean;
  includeCoverMosaic: boolean;
  includeColorPaletteBar: boolean;
  includeTreemapSnapshot: boolean;
  accentColor: string;
}

export interface ReportOptions {
  title: string;
  curatorName: string;
  includeExecutiveSummary: boolean;
  includeColorTreemap: boolean;
  includeMultiTreemaps: boolean;
  includeColorPsychology: boolean;
  includeGenreMatrix: boolean;
  includeCatalogList: boolean;
  includeYearTimeline: boolean;
  theme: 'dark' | 'light' | 'print';
}
