/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';
import { Audiobook, TreemapMetric, TreemapNode, TreemapViewType } from '../types';
import { getContrastTextColor, COLOR_FAMILY_PALETTES } from './colorUtils';

/**
 * Builds a hierarchical Treemap layout for D3 calculation
 */
export function buildTreemapHierarchy(
  books: Audiobook[],
  viewType: TreemapViewType,
  metric: TreemapMetric,
  width: number,
  height: number,
  padding: number = 3
): TreemapNode[] {
  if (!books || books.length === 0 || width <= 0 || height <= 0) {
    return [];
  }

  // Determine value accessor
  const getValue = (book: Audiobook): number => {
    if (metric === 'duration') return Math.max(0.5, book.durationHours);
    if (metric === 'fileSize') return Math.max(10, Math.round(book.fileSizeBytes / (1024 * 1024)));
    return 1; // 'count'
  };

  let rootData: any = { name: 'Root', id: 'root', children: [] };

  if (viewType === 'dominantColor') {
    // Group by broad dominant color family (VIBGYOR + Pink + Brown + Neutrals)
    const familyMap: Record<string, { family: string; books: Audiobook[]; totalVal: number }> = {};

    books.forEach(b => {
      const fam = b.dominantColor.colorFamily || (b.dominantColor.luminance > 0.5 ? 'White' : 'Black');
      if (!familyMap[fam]) {
        familyMap[fam] = { family: fam, books: [], totalVal: 0 };
      }
      familyMap[fam].books.push(b);
      familyMap[fam].totalVal += getValue(b);
    });

    // Sort families in chromatic order
    const sortedFamilies = Object.entries(familyMap).sort(([famA], [famB]) => {
      const orderA = COLOR_FAMILY_PALETTES[famA]?.order ?? 99;
      const orderB = COLOR_FAMILY_PALETTES[famB]?.order ?? 99;
      return orderA - orderB;
    });

    rootData.children = sortedFamilies.map(([fam, group]) => {
      const famPalette = COLOR_FAMILY_PALETTES[fam] || { bgHex: group.books[0]?.dominantColor.hex || '#334155', order: 99 };
      
      // Sort books within family by hue & lightness so similar hex shades stack side-by-side
      const sortedBooks = [...group.books].sort((a, b) => {
        const hslA = a.dominantColor.hsl;
        const hslB = b.dominantColor.hsl;
        if (hslA[0] !== hslB[0]) return hslA[0] - hslB[0];
        return hslA[2] - hslB[2];
      });

      return {
        name: fam,
        id: `family-${fam}`,
        category: 'Color Family',
        colorFamily: fam,
        color: famPalette.bgHex,
        children: sortedBooks.map(b => ({
          name: b.title,
          id: `book-${b.id}`,
          value: getValue(b),
          audiobook: b,
          color: b.dominantColor.hex,
          hex: b.dominantColor.hex,
          colorName: b.dominantColor.colorName,
          colorFamily: fam,
          textColor: getContrastTextColor(b.dominantColor.hex)
        }))
      };
    });
  } else if (viewType === 'genre') {
    // Group by Genre
    const genreMap: Record<string, Audiobook[]> = {};
    books.forEach(b => {
      const primaryGenre = b.genres[0] || 'General';
      if (!genreMap[primaryGenre]) genreMap[primaryGenre] = [];
      genreMap[primaryGenre].push(b);
    });

    const GENRE_COLORS: Record<string, string> = {
      'Sci-Fi': '#0284C7',
      'Fantasy': '#7E22CE',
      'Horror': '#991B1B',
      'Mystery': '#15803D',
      'Non-Fiction': '#D97706',
      'Classic': '#B91C1C',
      'Literary Fiction': '#4338CA',
      'General': '#475569'
    };

    rootData.children = Object.entries(genreMap).map(([genre, gBooks]) => {
      const gColor = GENRE_COLORS[genre] || gBooks[0]?.dominantColor.hex || '#6366F1';
      return {
        name: genre,
        id: `genre-${genre}`,
        category: 'Genre',
        color: gColor,
        children: gBooks.map(b => ({
          name: b.title,
          id: `book-${b.id}`,
          value: getValue(b),
          audiobook: b,
          color: b.dominantColor.hex,
          hex: b.dominantColor.hex,
          colorName: b.dominantColor.colorName,
          textColor: getContrastTextColor(b.dominantColor.hex)
        }))
      };
    });
  } else if (viewType === 'year') {
    // Group by Decades or Exact Years
    const decadeMap: Record<string, Audiobook[]> = {};
    books.forEach(b => {
      const decade = `${Math.floor(b.year / 10) * 10}s`;
      if (!decadeMap[decade]) decadeMap[decade] = [];
      decadeMap[decade].push(b);
    });

    const DECADE_COLORS: Record<string, string> = {
      '1890s': '#78350F',
      '1930s': '#9A3412',
      '1940s': '#B45309',
      '1950s': '#15803D',
      '1960s': '#C2410C',
      '1970s': '#BE185D',
      '1980s': '#6D28D9',
      '1990s': '#1D4ED8',
      '2000s': '#0D9488',
      '2010s': '#0284C7',
      '2020s': '#EAB308',
    };

    rootData.children = Object.entries(decadeMap)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([decade, dBooks]) => {
        const dColor = DECADE_COLORS[decade] || '#475569';
        return {
          name: decade,
          id: `decade-${decade}`,
          category: 'Decade',
          color: dColor,
          children: dBooks.map(b => ({
            name: `${b.title} (${b.year})`,
            id: `book-${b.id}`,
            value: getValue(b),
            audiobook: b,
            color: b.dominantColor.hex,
            hex: b.dominantColor.hex,
            textColor: getContrastTextColor(b.dominantColor.hex)
          }))
        };
      });
  } else if (viewType === 'author') {
    // Group by Author
    const authorMap: Record<string, Audiobook[]> = {};
    books.forEach(b => {
      if (!authorMap[b.author]) authorMap[b.author] = [];
      authorMap[b.author].push(b);
    });

    rootData.children = Object.entries(authorMap)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([author, aBooks]) => {
        const leadBook = aBooks[0];
        return {
          name: author,
          id: `author-${author}`,
          category: 'Author',
          color: leadBook.dominantColor.hex,
          children: aBooks.map(b => ({
            name: b.title,
            id: `book-${b.id}`,
            value: getValue(b),
            audiobook: b,
            color: b.dominantColor.hex,
            hex: b.dominantColor.hex,
            textColor: getContrastTextColor(b.dominantColor.hex)
          }))
        };
      });
  } else if (viewType === 'tags') {
    // Group by Tag
    const tagMap: Record<string, Audiobook[]> = {};
    books.forEach(b => {
      b.tags.forEach(t => {
        if (!tagMap[t]) tagMap[t] = [];
        tagMap[t].push(b);
      });
    });

    rootData.children = Object.entries(tagMap)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 16) // Top 16 tags
      .map(([tag, tBooks]) => {
        return {
          name: tag,
          id: `tag-${tag}`,
          category: 'Tag',
          color: tBooks[0]?.dominantColor.hex || '#6366F1',
          value: tBooks.reduce((sum, b) => sum + getValue(b), 0),
          audiobooks: tBooks,
          textColor: '#f8fafc',
          count: tBooks.length
        };
      });
  } else if (viewType === 'palette') {
    // Breakdown of all palette swatches across the library
    const swatches: any[] = [];
    books.forEach(b => {
      b.palette.forEach((swatch, idx) => {
        swatches.push({
          name: `${b.title} (${swatch.colorName})`,
          id: `swatch-${b.id}-${idx}`,
          value: Math.max(1, swatch.percentage),
          color: swatch.hex,
          hex: swatch.hex,
          colorName: swatch.colorName,
          audiobook: b,
          textColor: getContrastTextColor(swatch.hex)
        });
      });
    });
    rootData.children = swatches;
  }

  // Create D3 hierarchy
  const root = hierarchy(rootData)
    .sum(d => d.value || 0)
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  const treemapLayout = treemap<any>()
    .size([width, height])
    .paddingOuter(padding)
    .paddingTop(22)
    .paddingInner(padding)
    .round(true)
    .tile(treemapSquarify.ratio(1.3));

  treemapLayout(root);

  // Flatten nodes for rendering
  const leafNodes: TreemapNode[] = [];
  root.descendants().forEach((node: any) => {
    // If it is a leaf or tag node
    if (!node.children || viewType === 'tags') {
      const data = node.data;
      leafNodes.push({
        id: data.id || `node-${Math.random()}`,
        name: data.name,
        value: node.value || 1,
        color: data.color || '#3b82f6',
        hex: data.hex || data.color,
        colorName: data.colorName,
        colorFamily: data.colorFamily,
        textColor: data.textColor || getContrastTextColor(data.color || '#3b82f6'),
        audiobook: data.audiobook,
        audiobooks: data.audiobooks,
        category: data.category || node.parent?.data?.name,
        x0: node.x0,
        y0: node.y0,
        x1: node.x1,
        y1: node.y1,
      });
    }
  });

  return leafNodes;
}

/**
 * Calculates comprehensive statistical metadata for the audiobooks library
 */
export function calculateLibraryStats(books: Audiobook[]) {
  const totalBooks = books.length;
  const totalHours = Math.round(books.reduce((sum, b) => sum + b.durationHours, 0) * 10) / 10;
  const totalSizeBytes = books.reduce((sum, b) => sum + b.fileSizeBytes, 0);

  const authorsSet = new Set(books.map(b => b.author));
  const genresMap: Record<string, { count: number; hours: number }> = {};
  const tagsMap: Record<string, number> = {};
  const colorFamiliesMap: Record<string, { count: number; hex: string }> = {};
  const decadesMap: Record<string, number> = {};

  let minYear = 9999;
  let maxYear = 0;

  books.forEach(b => {
    if (b.year < minYear) minYear = b.year;
    if (b.year > maxYear) maxYear = b.year;

    // Genres
    b.genres.forEach(g => {
      if (!genresMap[g]) genresMap[g] = { count: 0, hours: 0 };
      genresMap[g].count++;
      genresMap[g].hours += b.durationHours;
    });

    // Tags
    b.tags.forEach(t => {
      tagsMap[t] = (tagsMap[t] || 0) + 1;
    });

    // Colors
    const fam = b.dominantColor.colorFamily || 'Neutrals';
    if (!colorFamiliesMap[fam]) {
      colorFamiliesMap[fam] = { count: 0, hex: b.dominantColor.hex };
    }
    colorFamiliesMap[fam].count++;

    // Decades
    const dec = `${Math.floor(b.year / 10) * 10}s`;
    decadesMap[dec] = (decadesMap[dec] || 0) + 1;
  });

  const topColorFamilies = Object.entries(colorFamiliesMap)
    .map(([fam, data]) => ({
      family: fam,
      count: data.count,
      percentage: Math.round((data.count / totalBooks) * 100),
      hex: data.hex
    }))
    .sort((a, b) => b.count - a.count);

  const topGenres = Object.entries(genresMap)
    .map(([genre, data]) => ({
      genre,
      count: data.count,
      totalHours: Math.round(data.hours * 10) / 10,
      percentage: Math.round((data.count / totalBooks) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  const authorCountMap: Record<string, { count: number; hours: number }> = {};
  books.forEach(b => {
    if (!authorCountMap[b.author]) authorCountMap[b.author] = { count: 0, hours: 0 };
    authorCountMap[b.author].count++;
    authorCountMap[b.author].hours += b.durationHours;
  });

  const topAuthors = Object.entries(authorCountMap)
    .map(([author, data]) => ({
      author,
      count: data.count,
      totalHours: Math.round(data.hours * 10) / 10
    }))
    .sort((a, b) => b.count - a.count);

  const topTags = Object.entries(tagsMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const decadeDistribution = Object.entries(decadesMap)
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));

  return {
    totalBooks,
    totalHours,
    totalSizeBytes,
    uniqueAuthorsCount: authorsSet.size,
    uniqueGenresCount: Object.keys(genresMap).length,
    uniqueTagsCount: Object.keys(tagsMap).length,
    earliestYear: minYear === 9999 ? 1900 : minYear,
    latestYear: maxYear === 0 ? 2024 : maxYear,
    topColorFamilies,
    topGenres,
    topAuthors,
    topTags,
    decadeDistribution
  };
}
