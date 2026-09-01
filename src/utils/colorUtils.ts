/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DominantColorInfo, PaletteSwatch } from '../types';

export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return '#' + [r, g, b].map(x => clamp(x).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h = h * 60;
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastTextColor(hexColor: string): string {
  const [r, g, b] = hexToRgb(hexColor);
  const lum = getLuminance(r, g, b);
  return lum > 0.38 ? '#0f172a' : '#f8fafc'; // Crisp dark slate vs clean light off-white
}

export function classifyColor(r: number, g: number, b: number): DominantColorInfo {
  const hex = rgbToHex(r, g, b);
  const [h, s, l] = rgbToHsl(r, g, b);
  const lum = getLuminance(r, g, b);

  let colorFamily = 'Black';
  let colorName = 'Obsidian Black';

  // Neutrals / Achromatic & Extreme Luminance Bounds:
  // - Pure whites, creams, ivories, and pale pastels (l >= 84, or l >= 72 with s < 55)
  // - Light grays and silvers (s < 28 with l > 50)
  // - Pure blacks and deep dark shades (l <= 14, or l <= 22 with s < 55)
  // - Dark grays and charcoals (s < 28 with l <= 50)
  const isWhiteOrLightGray = (l >= 84) || (l >= 72 && s < 55) || (s < 28 && l > 50);
  const isBlackOrDarkGray = (l <= 14) || (l <= 22 && s < 55) || (s < 28 && l <= 50);

  if (isWhiteOrLightGray) {
    colorFamily = 'White';
    if (l >= 90) {
      colorName = 'Parchment White';
    } else if (l >= 78) {
      colorName = 'Alabaster Ivory';
    } else {
      colorName = 'Light Mist Gray';
    }
  } else if (isBlackOrDarkGray) {
    colorFamily = 'Black';
    if (l < 15) {
      colorName = 'Obsidian Black';
    } else if (l < 30) {
      colorName = 'Charcoal Black';
    } else {
      colorName = 'Dark Slate Gray';
    }
  } else {
    // Chromatics:
    // Earthy Browns / Warm Ochres into ORANGE set
    if ((h >= 15 && h < 45 && l < 42 && s < 75) || (h >= 15 && h < 40 && l < 32)) {
      colorFamily = 'Orange'; // Browns in Orange set!
      colorName = l < 22 ? 'Deep Espresso Brown' : l < 34 ? 'Warm Saddle Brown' : 'Umber Clay Brown';
    }
    // Red (R in VIBGYOR)
    else if (h >= 348 || h < 15) {
      colorFamily = 'Red';
      colorName = l < 35 ? 'Deep Crimson' : l > 65 ? 'Coral Rose' : 'Ruby Vermilion';
    }
    // Orange (O in VIBGYOR & Terracotta)
    else if (h >= 15 && h < 45) {
      colorFamily = 'Orange';
      colorName = l < 40 ? 'Terracotta Sienna' : l > 65 ? 'Apricot Sunset' : 'Burnt Amber';
    }
    // Yellow (Y in VIBGYOR)
    else if (h >= 45 && h < 70) {
      if (l < 32 && s < 60) {
        // Dark desaturated ochre -> Orange & Brown set
        colorFamily = 'Orange';
        colorName = 'Ochre Wood Brown';
      } else {
        colorFamily = 'Yellow';
        colorName = l < 40 ? 'Antique Ochre' : 'Saffron Gold';
      }
    }
    // Green (G in VIBGYOR)
    else if (h >= 70 && h < 165) {
      colorFamily = 'Green';
      colorName = l < 35 ? 'Forest Emerald' : l > 65 ? 'Sage Celadon' : 'Viridian Moss';
    }
    // Blue (B in VIBGYOR)
    else if (h >= 165 && h < 225) {
      colorFamily = 'Blue';
      colorName = l < 30 ? 'Midnight Navy' : l > 65 ? 'Glacial Ice' : 'Cobalt Royal Blue';
    }
    // Indigo (I in VIBGYOR)
    else if (h >= 225 && h < 260) {
      colorFamily = 'Indigo';
      colorName = l < 30 ? 'Deep Night Indigo' : 'Electric Indigo';
    }
    // Violet (V in VIBGYOR)
    else if (h >= 260 && h < 295) {
      colorFamily = 'Violet';
      colorName = l < 35 ? 'Deep Astral Violet' : l > 65 ? 'Lavender Mist' : 'Royal Amethyst';
    }
    // Pinks / Magentas
    else {
      colorFamily = 'Pink';
      colorName = l < 40 ? 'Mulberry Wine' : l > 70 ? 'Blush Rose' : 'Vibrant Pink';
    }
  }

  return {
    hex,
    rgb: [r, g, b],
    hsl: [h, s, l],
    colorName,
    colorFamily,
    luminance: Number(lum.toFixed(3)),
  };
}

export const COLOR_FAMILY_PALETTES: Record<string, { label: string; bgHex: string; textHex: string; order: number }> = {
  'Red': { label: 'Red (VIBGYOR)', bgHex: '#B91C1C', textHex: '#FEF2F2', order: 1 },
  'Orange': { label: 'Orange & Brown', bgHex: '#C2410C', textHex: '#FFF7ED', order: 2 },
  'Yellow': { label: 'Yellow (VIBGYOR)', bgHex: '#D97706', textHex: '#FEFCE8', order: 3 },
  'Green': { label: 'Green (VIBGYOR)', bgHex: '#15803D', textHex: '#F0FDF4', order: 4 },
  'Blue': { label: 'Blue (VIBGYOR)', bgHex: '#1D4ED8', textHex: '#EFF6FF', order: 5 },
  'Indigo': { label: 'Indigo (VIBGYOR)', bgHex: '#4338CA', textHex: '#EEF2FF', order: 6 },
  'Violet': { label: 'Violet (VIBGYOR)', bgHex: '#7C3AED', textHex: '#FAF5FF', order: 7 },
  'Pink': { label: 'Pink & Rose', bgHex: '#DB2777', textHex: '#FDF2F8', order: 8 },
  'Black': { label: 'Black & Dark Gray', bgHex: '#18181B', textHex: '#FAFAFA', order: 9 },
  'White': { label: 'White & Light Gray', bgHex: '#E2E8F0', textHex: '#0F172A', order: 10 },
};

/**
 * Extract dominant colors from an Image element using canvas sampling and color quantization
 */
export async function extractDominantColorFromImage(imgUrl: string): Promise<{ dominant: DominantColorInfo; palette: PaletteSwatch[] }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const size = 64; // downsample for performance and color cluster grouping
        canvas.width = size;
        canvas.height = size;

        if (!ctx) {
          throw new Error('Canvas 2D context not available');
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;

        // Simple color bucket quantization
        const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
        const step = 4; // step pixels

        for (let i = 0; i < imgData.length; i += step * 4) {
          const a = imgData[i + 3];
          if (a < 128) continue; // skip transparent

          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          // Quantize to 32 steps per channel
          const qR = Math.round(r / 24) * 24;
          const qG = Math.round(g / 24) * 24;
          const qB = Math.round(b / 24) * 24;
          const key = `${qR},${qG},${qB}`;

          if (!colorBuckets[key]) {
            colorBuckets[key] = { r: qR, g: qG, b: qB, count: 0 };
          }
          colorBuckets[key].count++;
        }

        const sortedBuckets = Object.values(colorBuckets).sort((a, b) => b.count - a.count);
        const totalSampled = sortedBuckets.reduce((sum, b) => sum + b.count, 0) || 1;

        if (sortedBuckets.length === 0) {
          const fallback = classifyColor(30, 30, 40);
          return resolve({
            dominant: fallback,
            palette: [{ hex: fallback.hex, colorName: fallback.colorName, percentage: 100, rgb: fallback.rgb }]
          });
        }

        const topBucket = sortedBuckets[0];
        const dominant = classifyColor(topBucket.r, topBucket.g, topBucket.b);

        const palette: PaletteSwatch[] = sortedBuckets.slice(0, 5).map(b => {
          const swatchColor = classifyColor(b.r, b.g, b.b);
          return {
            hex: swatchColor.hex,
            colorName: swatchColor.colorName,
            percentage: Math.round((b.count / totalSampled) * 100),
            rgb: swatchColor.rgb
          };
        });

        resolve({ dominant, palette });
      } catch (err) {
        const fallback = classifyColor(45, 55, 72);
        resolve({
          dominant: fallback,
          palette: [{ hex: fallback.hex, colorName: fallback.colorName, percentage: 100, rgb: fallback.rgb }]
        });
      }
    };

    img.onerror = () => {
      const fallback = classifyColor(40, 40, 50);
      resolve({
        dominant: fallback,
        palette: [{ hex: fallback.hex, colorName: fallback.colorName, percentage: 100, rgb: fallback.rgb }]
      });
    };

    img.src = imgUrl;
  });
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
