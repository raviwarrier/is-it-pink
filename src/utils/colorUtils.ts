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

/**
 * Converts RGB to CIELAB color space (via XYZ standard illuminant D65)
 */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // Convert sRGB to linear RGB
  let [rL, gL, bL] = [r / 255, g / 255, b / 255].map(v => 
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  );
  rL *= 100;
  gL *= 100;
  bL *= 100;

  // D65 Standard Illuminant reference XYZ
  const x = rL * 0.4124564 + gL * 0.3575761 + bL * 0.1804375;
  const y = rL * 0.2126729 + gL * 0.7151522 + bL * 0.0721750;
  const z = rL * 0.0193339 + gL * 0.1191920 + bL * 0.9503041;

  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  const [xR, yR, zR] = [x / refX, y / refY, z / refZ].map(v => 
    v > 0.008856 ? Math.cbrt(v) : (7.787 * v) + (16 / 116)
  );

  const L = (116 * yR) - 16;
  const a = 500 * (xR - yR);
  const b_lab = 200 * (yR - zR);

  return [L, a, b_lab];
}

export function hexToLab(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return rgbToLab(r, g, b);
}

/**
 * Calculates CIE76 perceptual color difference (Delta E) between two hex colors.
 * Values < 10-14 are perceived as the same general shade; > 14 are distinct shades.
 */
export function calculateColorDistance(hex1: string, hex2: string): number {
  if (hex1.toUpperCase() === hex2.toUpperCase()) return 0;
  const [L1, a1, b1] = hexToLab(hex1);
  const [L2, a2, b2] = hexToLab(hex2);
  const dL = L1 - L2;
  const da = a1 - a2;
  const db = b1 - b2;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Detailed shade naming for fine-grained color classification
 */
export function getGranularShadeName(h: number, s: number, l: number): string {
  // Achromatics
  if (l >= 90) return 'Parchment White';
  if (l >= 78 && s < 40) return 'Alabaster Ivory';
  if (s < 18 && l > 50) return 'Light Mist Gray';
  if (l <= 14) return 'Obsidian Black';
  if (l <= 25 && s < 30) return 'Charcoal Black';
  if (s < 25 && l <= 50) return 'Dark Slate Gray';

  // Earthy Browns in low-lightness warm hues
  if (h >= 15 && h < 45 && l < 40 && s < 70) {
    if (l < 22) return 'Deep Espresso Brown';
    if (l < 32) return 'Warm Saddle Brown';
    return 'Umber Clay Brown';
  }

  // Red Spectrum
  if (h >= 348 || h < 15) {
    if (l < 22) return 'Deep Maroon';
    if (l < 35 && s >= 60) return 'Deep Crimson';
    if (l < 35 && s < 60) return 'Burgundy Wine';
    if (l > 65) return 'Coral Rose';
    if (s < 55) return 'Terracotta Rust';
    return 'Ruby Vermilion';
  }

  // Orange Spectrum
  if (h >= 15 && h < 45) {
    if (l < 38) return 'Terracotta Sienna';
    if (l > 65) return 'Apricot Sunset';
    if (h >= 32) return 'Warm Amber';
    return 'Burnt Tangerine';
  }

  // Yellow Spectrum
  if (h >= 45 && h < 70) {
    if (l < 35) return 'Antique Ochre';
    if (l > 68) return 'Canary Lemon';
    if (h < 55) return 'Marigold Gold';
    return 'Saffron Gold';
  }

  // Green Spectrum
  if (h >= 70 && h < 165) {
    if (l < 24) return 'Dark Forest Pine';
    if (l < 38 && s >= 50) return 'Forest Emerald';
    if (l < 38 && s < 50) return 'Deep Olive';
    if (l > 65) return 'Sage Celadon';
    if (h < 105) return 'Chartreuse Lime';
    if (h >= 140) return 'Seafoam Mint';
    return 'Viridian Moss';
  }

  // Blue Spectrum (Fine-grained to distinguish Cyan, Sky, Cerulean, Cobalt, Royal, Navy)
  if (h >= 165 && h < 225) {
    if (l < 20) return 'Midnight Navy';
    if (h < 185) {
      if (l > 60) return 'Glacial Cyan';
      if (l < 35) return 'Dark Teal Abyss';
      return 'Cyberpunk Cyan';
    }
    if (h >= 185 && h < 205) {
      if (l > 55) return 'Sky Cerulean';
      if (l < 32) return 'Deep Ocean Blue';
      return 'Cerulean Blue';
    }
    // h >= 205 to 225
    if (l > 60) return 'Periwinkle Blue';
    if (l < 32) return 'Deep Highstorm Cobalt';
    if (s > 70) return 'Cobalt Royal Blue';
    return 'Steel Sapphire Blue';
  }

  // Indigo Spectrum
  if (h >= 225 && h < 260) {
    if (l < 22) return 'Deep Night Indigo';
    if (l > 60) return 'Lavender Indigo';
    if (s < 50) return 'Twilight Slate Indigo';
    return 'Electric Indigo';
  }

  // Violet Spectrum
  if (h >= 260 && h < 295) {
    if (l < 24) return 'Deep Astral Violet';
    if (l > 65) return 'Lavender Mist';
    if (s < 50) return 'Muted Heather Violet';
    return 'Royal Amethyst';
  }

  // Pink Spectrum
  if (l < 28) return 'Deep Plum';
  if (l < 46) return 'Mulberry Wine';
  if (l > 70) return 'Blush Rose';
  if (s > 70) return 'Vibrant Magenta';
  return 'Coral Pink';
}

export function classifyColor(r: number, g: number, b: number): DominantColorInfo {
  const hex = rgbToHex(r, g, b);
  const [h, s, l] = rgbToHsl(r, g, b);
  const lum = getLuminance(r, g, b);

  let colorFamily = 'Black';
  let colorName = getGranularShadeName(h, s, l);

  // Neutrals / Achromatic & Extreme Luminance Bounds:
  const isWhiteOrLightGray = (l >= 84) || (l >= 72 && s < 55) || (s < 28 && l > 50);
  const isBlackOrDarkGray = (l <= 14) || (l <= 22 && s < 55) || (s < 28 && l <= 50);

  if (isWhiteOrLightGray) {
    colorFamily = 'White';
  } else if (isBlackOrDarkGray) {
    colorFamily = 'Black';
  } else {
    // Chromatics:
    if ((h >= 15 && h < 45 && l < 42 && s < 75) || (h >= 15 && h < 40 && l < 32)) {
      colorFamily = 'Orange'; // Browns in Orange set
    } else if (h >= 348 || h < 15) {
      colorFamily = 'Red';
    } else if (h >= 15 && h < 45) {
      colorFamily = 'Orange';
    } else if (h >= 45 && h < 70) {
      if (l < 32 && s < 60) {
        colorFamily = 'Orange';
      } else {
        colorFamily = 'Yellow';
      }
    } else if (h >= 70 && h < 165) {
      colorFamily = 'Green';
    } else if (h >= 165 && h < 225) {
      colorFamily = 'Blue';
    } else if (h >= 225 && h < 260) {
      colorFamily = 'Indigo';
    } else if (h >= 260 && h < 295) {
      colorFamily = 'Violet';
    } else {
      colorFamily = 'Pink';
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
