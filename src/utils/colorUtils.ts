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

export interface NamedColorShade {
  name: string;
  family: string;
  hex: string;
}

export const NAMED_COLOR_PALETTE: NamedColorShade[] = [
  // White & Light Gray
  { name: 'Pure White', family: 'White', hex: '#FFFFFF' },
  { name: 'Parchment White', family: 'White', hex: '#FBF8F3' },
  { name: 'Alabaster Ivory', family: 'White', hex: '#F4F4F0' },
  { name: 'Cream Ivory', family: 'White', hex: '#FFFDD0' },
  { name: 'Light Mist Gray', family: 'White', hex: '#E2E8F0' },
  { name: 'Silver Ash', family: 'White', hex: '#CBD5E1' },
  { name: 'Pale Bone', family: 'White', hex: '#EAE6DF' },

  // Black & Dark Gray
  { name: 'Obsidian Black', family: 'Black', hex: '#0A0A0A' },
  { name: 'Pitch Black', family: 'Black', hex: '#050505' },
  { name: 'Charcoal Black', family: 'Black', hex: '#1E1E24' },
  { name: 'Jet Black', family: 'Black', hex: '#121214' },
  { name: 'Dark Slate Gray', family: 'Black', hex: '#2F3E46' },
  { name: 'Gunmetal Gray', family: 'Black', hex: '#334155' },
  { name: 'Onyx Black', family: 'Black', hex: '#0F172A' },

  // Red
  { name: 'Crimson Red', family: 'Red', hex: '#DC143C' },
  { name: 'Deep Crimson', family: 'Red', hex: '#990000' },
  { name: 'Ruby Red', family: 'Red', hex: '#E0115F' },
  { name: 'Scarlet Red', family: 'Red', hex: '#FF2400' },
  { name: 'Cherry Red', family: 'Red', hex: '#D2042D' },
  { name: 'Burgundy Wine', family: 'Red', hex: '#800020' },
  { name: 'Maroon', family: 'Red', hex: '#800000' },
  { name: 'Bordeaux', family: 'Red', hex: '#5C061C' },
  { name: 'Brick Red', family: 'Red', hex: '#CB4154' },
  { name: 'Cardinal Red', family: 'Red', hex: '#C41E3A' },
  { name: 'Blood Red', family: 'Red', hex: '#CC1100' },
  { name: 'Terracotta Rust', family: 'Red', hex: '#C84B31' },
  { name: 'Vermilion', family: 'Red', hex: '#E34234' },
  { name: 'Coral Rose', family: 'Red', hex: '#F88379' },
  { name: 'Dark Mahogany', family: 'Red', hex: '#4A0E17' },

  // Orange & Brown
  { name: 'Amber Orange', family: 'Orange', hex: '#FFBF00' },
  { name: 'Tangerine', family: 'Orange', hex: '#F28500' },
  { name: 'Burnt Orange', family: 'Orange', hex: '#CC5500' },
  { name: 'Apricot', family: 'Orange', hex: '#FBCEB1' },
  { name: 'Peach', family: 'Orange', hex: '#FFDAB9' },
  { name: 'Rust Orange', family: 'Orange', hex: '#B7410E' },
  { name: 'Terracotta', family: 'Orange', hex: '#E2725B' },
  { name: 'Coral Orange', family: 'Orange', hex: '#FF7F50' },
  { name: 'Ochre Brown', family: 'Orange', hex: '#CC7722' },
  { name: 'Saddle Brown', family: 'Orange', hex: '#8B4513' },
  { name: 'Espresso Brown', family: 'Orange', hex: '#362218' },
  { name: 'Chocolate Brown', family: 'Orange', hex: '#5D2E14' },
  { name: 'Caramel Brown', family: 'Orange', hex: '#AF6E4D' },
  { name: 'Cinnamon', family: 'Orange', hex: '#D2691E' },
  { name: 'Sienna', family: 'Orange', hex: '#A0522D' },
  { name: 'Umber Brown', family: 'Orange', hex: '#635147' },

  // Yellow
  { name: 'Canary Yellow', family: 'Yellow', hex: '#FFEF00' },
  { name: 'Lemon Yellow', family: 'Yellow', hex: '#FFF44F' },
  { name: 'Golden Yellow', family: 'Yellow', hex: '#FFD700' },
  { name: 'Marigold Gold', family: 'Yellow', hex: '#EAA221' },
  { name: 'Saffron Gold', family: 'Yellow', hex: '#F4C430' },
  { name: 'Mustard Yellow', family: 'Yellow', hex: '#FFDB58' },
  { name: 'Buttercream', family: 'Yellow', hex: '#FFFDD0' },
  { name: 'Sunburst Yellow', family: 'Yellow', hex: '#FDB813' },
  { name: 'Antique Ochre', family: 'Yellow', hex: '#CFB53B' },
  { name: 'Cornsilk', family: 'Yellow', hex: '#FFF8DC' },

  // Green
  { name: 'Emerald Green', family: 'Green', hex: '#50C878' },
  { name: 'Forest Green', family: 'Green', hex: '#228B22' },
  { name: 'Pine Green', family: 'Green', hex: '#01796F' },
  { name: 'Dark Cypress Green', family: 'Green', hex: '#0A3D2A' },
  { name: 'Olive Green', family: 'Green', hex: '#808000' },
  { name: 'Dark Olive', family: 'Green', hex: '#556B2F' },
  { name: 'Moss Green', family: 'Green', hex: '#8A9A5B' },
  { name: 'Sage Celadon', family: 'Green', hex: '#9CAF88' },
  { name: 'Seafoam Mint', family: 'Green', hex: '#9FE2BF' },
  { name: 'Mint Green', family: 'Green', hex: '#98FF98' },
  { name: 'Lime Green', family: 'Green', hex: '#32CD32' },
  { name: 'Chartreuse Lime', family: 'Green', hex: '#7FFF00' },
  { name: 'Jade Green', family: 'Green', hex: '#00A86B' },
  { name: 'Hunter Green', family: 'Green', hex: '#355E3B' },
  { name: 'Viridian Moss', family: 'Green', hex: '#40826D' },
  { name: 'Jungle Green', family: 'Green', hex: '#29AB87' },

  // Blue
  { name: 'Glacial Ice Blue', family: 'Blue', hex: '#D6EAF8' },
  { name: 'Cyberpunk Cyan', family: 'Blue', hex: '#00E5FF' },
  { name: 'Aqua Turquoise', family: 'Blue', hex: '#40E0D0' },
  { name: 'Cyan Teal', family: 'Blue', hex: '#00A896' },
  { name: 'Deep Teal', family: 'Blue', hex: '#005F73' },
  { name: 'Dark Teal Abyss', family: 'Blue', hex: '#003844' },
  { name: 'Sky Cerulean', family: 'Blue', hex: '#56CCF2' },
  { name: 'Cerulean Blue', family: 'Blue', hex: '#007BA7' },
  { name: 'Dodger Blue', family: 'Blue', hex: '#1E90FF' },
  { name: 'Cornflower Blue', family: 'Blue', hex: '#6495ED' },
  { name: 'Steel Sapphire Blue', family: 'Blue', hex: '#4682B4' },
  { name: 'Cobalt Royal Blue', family: 'Blue', hex: '#0047AB' },
  { name: 'Royal Blue', family: 'Blue', hex: '#4169E1' },
  { name: 'Electric Azure Blue', family: 'Blue', hex: '#0066FF' },
  { name: 'Deep Ocean Blue', family: 'Blue', hex: '#0B3C5D' },
  { name: 'Denim Blue', family: 'Blue', hex: '#1560BD' },
  { name: 'Midnight Navy', family: 'Blue', hex: '#001F3F' },
  { name: 'Deep Abyss Navy', family: 'Blue', hex: '#0A192F' },
  { name: 'Prussian Blue', family: 'Blue', hex: '#003153' },
  { name: 'Periwinkle Blue', family: 'Blue', hex: '#8DA4C4' },
  { name: 'Powder Blue', family: 'Blue', hex: '#B0E0E6' },
  { name: 'Slate Blue', family: 'Blue', hex: '#475569' },

  // Indigo
  { name: 'Electric Indigo', family: 'Indigo', hex: '#4B0082' },
  { name: 'Deep Night Indigo', family: 'Indigo', hex: '#1A1147' },
  { name: 'Dark Indigo', family: 'Indigo', hex: '#2E1A47' },
  { name: 'Twilight Slate Indigo', family: 'Indigo', hex: '#3F2B96' },
  { name: 'Persian Indigo', family: 'Indigo', hex: '#32127A' },
  { name: 'Lavender Indigo', family: 'Indigo', hex: '#9482C9' },
  { name: 'Denim Indigo', family: 'Indigo', hex: '#2B3A67' },

  // Violet
  { name: 'Royal Amethyst', family: 'Violet', hex: '#7C3AED' },
  { name: 'Deep Astral Violet', family: 'Violet', hex: '#4B0076' },
  { name: 'Lavender Mist', family: 'Violet', hex: '#E6E6FA' },
  { name: 'Lilac Violet', family: 'Violet', hex: '#C8A2C8' },
  { name: 'Orchid Violet', family: 'Violet', hex: '#DA70D6' },
  { name: 'Deep Aubergine', family: 'Violet', hex: '#3D0734' },
  { name: 'Grape Violet', family: 'Violet', hex: '#6F2DA8' },
  { name: 'Muted Heather Violet', family: 'Violet', hex: '#B7A8B8' },

  // Pink
  { name: 'Blush Rose', family: 'Pink', hex: '#FFB6C1' },
  { name: 'Vibrant Magenta', family: 'Pink', hex: '#FF00FF' },
  { name: 'Hot Pink', family: 'Pink', hex: '#FF69B4' },
  { name: 'Deep Plum Wine', family: 'Pink', hex: '#581845' },
  { name: 'Mulberry Wine', family: 'Pink', hex: '#8B008B' },
  { name: 'Coral Pink', family: 'Pink', hex: '#F88379' },
  { name: 'Salmon Rose', family: 'Pink', hex: '#FF91A4' },
  { name: 'Dusty Rose', family: 'Pink', hex: '#DCAE96' },
  { name: 'Bubblegum Pink', family: 'Pink', hex: '#FE5DA8' },
  { name: 'Raspberry Pink', family: 'Pink', hex: '#E30B5C' },
];

/**
 * Finds the closest named color in the palette using CIELAB Delta-E distance
 */
export function getClosestNamedColor(hex: string, restrictToFamily?: string): NamedColorShade {
  const [L1, a1, b1] = hexToLab(hex);
  let bestShade = NAMED_COLOR_PALETTE[0];
  let minDistance = Infinity;

  const candidates = restrictToFamily 
    ? NAMED_COLOR_PALETTE.filter(p => p.family === restrictToFamily)
    : NAMED_COLOR_PALETTE;

  const searchList = candidates.length > 0 ? candidates : NAMED_COLOR_PALETTE;

  for (const item of searchList) {
    const [L2, a2, b2] = hexToLab(item.hex);
    const dL = L1 - L2;
    const da = a1 - a2;
    const db = b1 - b2;
    const dist = Math.sqrt(dL * dL + da * da + db * db);

    if (dist < minDistance) {
      minDistance = dist;
      bestShade = item;
    }
  }

  return bestShade;
}

export function classifyColor(r: number, g: number, b: number): DominantColorInfo {
  const hex = rgbToHex(r, g, b);
  const [h, s, l] = rgbToHsl(r, g, b);
  const lum = getLuminance(r, g, b);

  let colorFamily = 'Black';

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

  // Use CIELAB Delta-E to match the exact, accurate sub-color shade within this family
  const closest = getClosestNamedColor(hex, colorFamily);
  const colorName = closest.name;

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
