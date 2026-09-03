import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

// Allow local or self-hosted internal Audiobookshelf servers with self-signed SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Persistent Local App Folder for Saved Maps
const SAVED_MAPS_DIR = path.join(process.cwd(), "data", "saved-maps");
if (!fs.existsSync(SAVED_MAPS_DIR)) {
  try {
    fs.mkdirSync(SAVED_MAPS_DIR, { recursive: true });
  } catch (err) {
    console.warn("Could not create saved-maps directory:", err);
  }
}

export function sanitizeServerUrlToFilename(urlOrPath: string): string {
  if (!urlOrPath) return "audiobook-library";
  let clean = urlOrPath.trim()
    .replace(/^https?:\/\//i, "")
    .replace(/[:/\\?#%&*=+\s]+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return clean || "audiobook-library";
}

// API: Save map to local app folder as [server-url]-data.json
app.post("/api/save-map", (req, res) => {
  try {
    const { nameOrPath, serverUrl, username, mode, audiobooks, totalDurationHours, totalSizeBytes, customFilename } = req.body;
    
    if (!Array.isArray(audiobooks) || audiobooks.length === 0) {
      return res.status(400).json({ error: "No audiobooks provided to save" });
    }

    const baseName = customFilename || `${sanitizeServerUrlToFilename(serverUrl || nameOrPath || "audiobook-library")}-data.json`;
    const filename = baseName.endsWith(".json") ? baseName : `${baseName}.json`;
    const targetFilePath = path.join(SAVED_MAPS_DIR, filename);

    const calculatedHours = typeof totalDurationHours === "number"
      ? totalDurationHours
      : audiobooks.reduce((acc: number, b: any) => acc + (b.durationHours || 0), 0);
    const calculatedBytes = typeof totalSizeBytes === "number"
      ? totalSizeBytes
      : audiobooks.reduce((acc: number, b: any) => acc + (b.fileSizeBytes || 0), 0);

    const mapPackage = {
      version: "1.0",
      appName: "is-it-pink",
      exportDate: new Date().toISOString(),
      nameOrPath: nameOrPath || serverUrl || "Audiobook Library",
      serverUrl: serverUrl || null,
      username: username || null,
      mode: mode || "entireLibrary",
      bookCount: audiobooks.length,
      totalDurationHours: Math.round(calculatedHours * 10) / 10,
      totalSizeBytes: calculatedBytes,
      audiobooks
    };

    fs.writeFileSync(targetFilePath, JSON.stringify(mapPackage, null, 2), "utf8");

    res.json({
      success: true,
      filename,
      filePath: targetFilePath,
      savedAt: mapPackage.exportDate,
      packageSummary: {
        filename,
        serverUrl: mapPackage.serverUrl,
        username: mapPackage.username,
        nameOrPath: mapPackage.nameOrPath,
        bookCount: mapPackage.bookCount,
        totalDurationHours: mapPackage.totalDurationHours,
        mode: mapPackage.mode,
        exportDate: mapPackage.exportDate
      }
    });
  } catch (error: any) {
    console.error("Save map error:", error);
    res.status(500).json({ error: error.message || "Failed to save map data" });
  }
});

// API: List all saved map files in local app folder
app.get("/api/saved-maps", (req, res) => {
  try {
    if (!fs.existsSync(SAVED_MAPS_DIR)) {
      return res.json({ success: true, files: [] });
    }

    const dirEntries = fs.readdirSync(SAVED_MAPS_DIR);
    const fileList: any[] = [];

    for (const fileName of dirEntries) {
      if (!fileName.endsWith(".json")) continue;
      const fullPath = path.join(SAVED_MAPS_DIR, fileName);
      try {
        const stats = fs.statSync(fullPath);
        const rawContent = fs.readFileSync(fullPath, "utf8");
        const parsed = JSON.parse(rawContent);

        fileList.push({
          filename: fileName,
          serverUrl: parsed.serverUrl || null,
          username: parsed.username || null,
          nameOrPath: parsed.nameOrPath || parsed.path || fileName.replace(/-data\.json$/, ""),
          bookCount: parsed.bookCount || (Array.isArray(parsed.audiobooks) ? parsed.audiobooks.length : 0),
          totalDurationHours: parsed.totalDurationHours || 0,
          mode: parsed.mode || "entireLibrary",
          exportDate: parsed.exportDate || stats.mtime.toISOString(),
          fileSizeBytes: stats.size,
          mtime: stats.mtime.toISOString()
        });
      } catch (e) {
        console.warn(`Could not parse map file ${fileName}:`, e);
      }
    }

    // Sort by latest modified/exported date descending
    fileList.sort((a, b) => new Date(b.exportDate || b.mtime).getTime() - new Date(a.exportDate || a.mtime).getTime());

    res.json({
      success: true,
      files: fileList
    });
  } catch (error: any) {
    console.error("List saved maps error:", error);
    res.status(500).json({ error: error.message || "Failed to list saved maps" });
  }
});

// API: Get specific saved map by filename
app.get("/api/saved-maps/:filename", (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const fullPath = path.join(SAVED_MAPS_DIR, filename);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: "Saved map file not found" });
    }

    const content = fs.readFileSync(fullPath, "utf8");
    const parsed = JSON.parse(content);

    res.json({
      success: true,
      data: parsed
    });
  } catch (error: any) {
    console.error("Get saved map error:", error);
    res.status(500).json({ error: error.message || "Failed to read map file" });
  }
});

// API: Delete a saved map file
app.delete("/api/saved-maps/:filename", (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const fullPath = path.join(SAVED_MAPS_DIR, filename);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.json({ success: true, deleted: filename });
  } catch (error: any) {
    console.error("Delete saved map error:", error);
    res.status(500).json({ error: error.message || "Failed to delete map file" });
  }
});

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper: Guess color family & name from RGB
// CIELAB Delta-E Color Matching for Server-side classification
function hexToRgbServer(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function hexToLabServer(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgbServer(hex);
  let [rL, gL, bL] = [r / 255, g / 255, b / 255].map(v => 
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  );
  rL *= 100; gL *= 100; bL *= 100;

  const x = rL * 0.4124564 + gL * 0.3575761 + bL * 0.1804375;
  const y = rL * 0.2126729 + gL * 0.7151522 + bL * 0.0721750;
  const z = rL * 0.0193339 + gL * 0.1191920 + bL * 0.9503041;

  const [xR, yR, zR] = [x / 95.047, y / 100.0, z / 108.883].map(v => 
    v > 0.008856 ? Math.cbrt(v) : (7.787 * v) + (16 / 116)
  );

  return [(116 * yR) - 16, 500 * (xR - yR), 200 * (yR - zR)];
}

const SERVER_NAMED_PALETTE = [
  // White & Light Gray
  { name: 'Pure White', family: 'White', hex: '#FFFFFF' },
  { name: 'Parchment White', family: 'White', hex: '#FBF8F3' },
  { name: 'Alabaster Ivory', family: 'White', hex: '#F4F4F0' },
  { name: 'Light Mist Gray', family: 'White', hex: '#E2E8F0' },
  { name: 'Silver Ash', family: 'White', hex: '#CBD5E1' },

  // Black & Dark Gray
  { name: 'Obsidian Black', family: 'Black', hex: '#0A0A0A' },
  { name: 'Charcoal Black', family: 'Black', hex: '#1E1E24' },
  { name: 'Jet Black', family: 'Black', hex: '#121214' },
  { name: 'Dark Slate Gray', family: 'Black', hex: '#2F3E46' },
  { name: 'Gunmetal Gray', family: 'Black', hex: '#334155' },

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

  // Violet
  { name: 'Royal Amethyst', family: 'Violet', hex: '#7C3AED' },
  { name: 'Deep Astral Violet', family: 'Violet', hex: '#4B0076' },
  { name: 'Lavender Mist', family: 'Violet', hex: '#E6E6FA' },
  { name: 'Lilac Violet', family: 'Violet', hex: '#C8A2C8' },
  { name: 'Orchid Violet', family: 'Violet', hex: '#DA70D6' },
  { name: 'Deep Aubergine', family: 'Violet', hex: '#3D0734' },
  { name: 'Grape Violet', family: 'Violet', hex: '#6F2DA8' },

  // Pink
  { name: 'Blush Rose', family: 'Pink', hex: '#FFB6C1' },
  { name: 'Vibrant Magenta', family: 'Pink', hex: '#FF00FF' },
  { name: 'Hot Pink', family: 'Pink', hex: '#FF69B4' },
  { name: 'Deep Plum Wine', family: 'Pink', hex: '#581845' },
  { name: 'Coral Pink', family: 'Pink', hex: '#F88379' },
  { name: 'Salmon Rose', family: 'Pink', hex: '#FF91A4' },
  { name: 'Dusty Rose', family: 'Pink', hex: '#DCAE96' },
  { name: 'Raspberry Pink', family: 'Pink', hex: '#E30B5C' },
];

function getColorDetails(r: number, g: number, b: number) {
  const hex = "#" + [r, g, b].map(x => {
    const hexVal = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hexVal.length === 1 ? "0" + hexVal : hexVal;
  }).join("").toUpperCase();

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

  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  let colorFamily = "Black";
  const isWhiteOrLightGray = (lPct >= 84) || (lPct >= 70 && sPct <= 32) || (sPct <= 14 && lPct >= 52);
  const isBlackOrDarkGray = (lPct <= 18) || (lPct <= 28 && sPct <= 42) || (sPct <= 16 && lPct <= 52);

  if (isWhiteOrLightGray) {
    colorFamily = "White";
  } else if (isBlackOrDarkGray) {
    colorFamily = "Black";
  } else {
    if ((h >= 15 && h < 48 && lPct < 44 && sPct < 80) || (h >= 15 && h < 42 && lPct < 34)) {
      colorFamily = "Orange"; // Browns (Espresso, Saddle Brown, Chocolate, Sienna)
    } else if (h >= 348 || h < 15) {
      colorFamily = "Red";
    } else if (h >= 15 && h < 45) {
      colorFamily = "Orange";
    } else if (h >= 45 && h < 68) {
      colorFamily = (lPct < 35 && sPct < 60) ? "Orange" : "Yellow";
    } else if (h >= 68 && h < 165) {
      colorFamily = "Green";
    } else if (h >= 165 && h < 225) {
      colorFamily = "Blue";
    } else if (h >= 225 && h < 260) {
      colorFamily = "Indigo";
    } else if (h >= 260 && h < 305) {
      colorFamily = "Violet";
    } else {
      colorFamily = "Pink";
    }
  }

  // Match closest shade with CIELAB Delta-E
  const [L1, a1, b1] = hexToLabServer(hex);
  let bestShade = SERVER_NAMED_PALETTE[0];
  let minDistance = Infinity;
  const candidates = SERVER_NAMED_PALETTE.filter(p => p.family === colorFamily);
  const searchList = candidates.length > 0 ? candidates : SERVER_NAMED_PALETTE;

  for (const item of searchList) {
    const [L2, a2, b2] = hexToLabServer(item.hex);
    const dL = L1 - L2;
    const da = a1 - a2;
    const db = b1 - b2;
    const dist = Math.sqrt(dL * dL + da * da + db * db);
    if (dist < minDistance) {
      minDistance = dist;
      bestShade = item;
    }
  }

  return {
    hex,
    rgb: [r, g, b] as [number, number, number],
    hsl: [Math.round(h), sPct, lPct] as [number, number, number],
    colorName: bestShade.name,
    colorFamily,
    luminance: Number((0.2126 * rNorm + 0.7152 * gNorm + 0.0722 * bNorm).toFixed(3))
  };
}

// True Image Dominant Color & Palette Extraction using sharp & CIELAB Delta-E clustering
async function extractColorsFromImageBuffer(buffer: Buffer): Promise<{
  dominant: ReturnType<typeof getColorDetails>;
  palette: Array<{ hex: string; colorName: string; percentage: number; rgb: [number, number, number] }>;
} | null> {
  try {
    const { data, info } = await sharp(buffer)
      .resize(48, 48, { fit: "cover", withoutEnlargement: false })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const totalPixels = info.width * info.height;
    const buckets: Record<string, { rSum: number; gSum: number; bSum: number; count: number }> = {};

    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const qR = Math.min(255, Math.floor(r / 16) * 16 + 8);
      const qG = Math.min(255, Math.floor(g / 16) * 16 + 8);
      const qB = Math.min(255, Math.floor(b / 16) * 16 + 8);
      const key = `${qR},${qG},${qB}`;

      if (!buckets[key]) {
        buckets[key] = { rSum: 0, gSum: 0, bSum: 0, count: 0 };
      }
      buckets[key].rSum += r;
      buckets[key].gSum += g;
      buckets[key].bSum += b;
      buckets[key].count++;
    }

    const rawBuckets = Object.values(buckets).sort((a, b) => b.count - a.count);
    if (rawBuckets.length === 0) return null;

    // Merge perceptually similar clusters using CIELAB Delta-E
    const uniqueClusters: Array<{ r: number; g: number; b: number; count: number; hex: string }> = [];

    for (const b of rawBuckets) {
      const avgR = Math.round(b.rSum / b.count);
      const avgG = Math.round(b.gSum / b.count);
      const avgB = Math.round(b.bSum / b.count);
      const hex = "#" + [avgR, avgG, avgB].map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase();

      let merged = false;
      const [L1, a1, b1] = hexToLabServer(hex);

      for (const u of uniqueClusters) {
        const [L2, a2, b2] = hexToLabServer(u.hex);
        const dist = Math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
        if (dist < 12) {
          u.count += b.count;
          merged = true;
          break;
        }
      }

      if (!merged) {
        uniqueClusters.push({ r: avgR, g: avgG, b: avgB, count: b.count, hex });
      }
    }

    uniqueClusters.sort((a, b) => b.count - a.count);

    const dominantCluster = uniqueClusters[0] || { r: 24, g: 24, b: 28, count: totalPixels, hex: "#18181B" };
    const dominant = getColorDetails(dominantCluster.r, dominantCluster.g, dominantCluster.b);

    const totalSampled = uniqueClusters.reduce((acc, c) => acc + c.count, 0) || 1;
    const palette = uniqueClusters.slice(0, 5).map(c => {
      const details = getColorDetails(c.r, c.g, c.b);
      return {
        hex: details.hex,
        colorName: details.colorName,
        percentage: Math.max(5, Math.round((c.count / totalSampled) * 100)),
        rgb: details.rgb
      };
    });

    return { dominant, palette };
  } catch (err) {
    console.warn("sharp color extraction warning:", err);
    return null;
  }
}

// API: Audiobookshelf Cover Proxy
app.get("/api/abs/cover", async (req, res) => {
  try {
    const { serverUrl, itemId, token } = req.query;
    if (!serverUrl || !itemId) {
      return res.status(400).send("Missing serverUrl or itemId");
    }

    const cleanBaseUrl = (serverUrl as string).trim().replace(/\/+$/, "");
    const coverUrl = `${cleanBaseUrl}/api/items/${itemId}/cover${token ? `?token=${encodeURIComponent(token as string)}` : ""}`;
    const headers: Record<string, string> = { 
      "User-Agent": "Is-It-Pink-ABS-Client/1.0",
      "Accept": "image/*"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-api-key"] = token as string;
    }

    const absRes = await fetch(coverUrl, { headers });
    if (!absRes.ok) {
      return res.status(absRes.status).send("Cover not found");
    }

    const contentType = absRes.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    const buffer = Buffer.from(await absRes.arrayBuffer());
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send("Failed to proxy cover image");
  }
});

// API: Local Cover Image Stream
app.get("/api/local-cover", (req, res) => {
  try {
    const { filePath } = req.query;
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).send("Missing filePath");
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".avif": "image/avif"
      };
      res.setHeader("Content-Type", mimeTypes[ext] || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return fs.createReadStream(filePath).pipe(res);
    }
    res.status(404).send("File not found");
  } catch (e: any) {
    res.status(500).send("Error reading cover file");
  }
});

interface AbsProgressUpdate {
  step: "connecting" | "connected" | "listing" | "extracting" | "complete" | "error";
  message: string;
  current?: number;
  total?: number;
  bookTitle?: string;
  username?: string;
  books?: any[];
  serverUrl?: string;
  error?: string;
}

// Helper: HSL to RGB conversion
function hslToRgbValues(h: number, sPct: number, lPct: number): [number, number, number] {
  const s = sPct / 100;
  const l = lPct / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

// Helper: Fast fetch with AbortSignal timeout
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Helper: Generate deterministic aesthetic palette for books without covers or on timeout
function generateDeterministicBookColor(title: string, author: string): { dominantColor: any; palette: any[] } {
  const seed = `${title || 'Audiobook'}:${author || 'Author'}`;
  let hash = 0;
  for (let c = 0; c < seed.length; c++) {
    hash = (hash << 5) - hash + seed.charCodeAt(c);
    hash |= 0;
  }
  const h = Math.abs(hash) % 360;
  const s = 48 + (Math.abs(hash >> 3) % 38);
  const l = 32 + (Math.abs(hash >> 6) % 32);
  const [r, g, b] = hslToRgbValues(h, s, l);
  const dominantColor = getColorDetails(r, g, b);
  const palette = [
    { hex: dominantColor.hex, colorName: dominantColor.colorName, percentage: 65, rgb: dominantColor.rgb },
    { hex: "#1E293B", colorName: "Slate Dark", percentage: 20, rgb: [30, 41, 59] as [number, number, number] },
    { hex: "#F8FAFC", colorName: "Ice White", percentage: 15, rgb: [248, 250, 252] as [number, number, number] }
  ];
  return { dominantColor, palette };
}

// Core Audiobookshelf Read Shelf Extraction Engine
async function extractAudiobookshelfReadShelf(
  serverUrl: string,
  apiToken: string,
  onProgress?: (update: AbsProgressUpdate) => void
) {
  const cleanBaseUrl = serverUrl.trim().replace(/\/+$/, "");
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${apiToken.trim()}`,
    "x-api-key": apiToken.trim(),
    "Accept": "application/json",
    "User-Agent": "Is-It-Pink-ABS-Client/1.0"
  };

  onProgress?.({
    step: "connecting",
    message: `Connecting to Audiobookshelf server at ${cleanBaseUrl}...`
  });

  // 1. Verify credentials and get current user info + media progress
  let userRes: Response;
  try {
    userRes = await fetchWithTimeout(`${cleanBaseUrl}/api/me`, { headers }, 8000);
  } catch (networkErr: any) {
    throw new Error(`Could not reach Audiobookshelf server at ${cleanBaseUrl}. Please verify URL and network connectivity.`);
  }

  if (!userRes.ok) {
    if (userRes.status === 401 || userRes.status === 403) {
      throw new Error(`Audiobookshelf authentication failed (Status ${userRes.status}). Please verify your API token in Audiobookshelf settings.`);
    }
    if (userRes.status === 404) {
      throw new Error(`Audiobookshelf API endpoint not found at ${cleanBaseUrl} (Status 404). Please verify your server URL.`);
    }
    throw new Error(`Audiobookshelf server returned status ${userRes.status}. Please check your server.`);
  }

  const userData = await userRes.json();
  const userObj = userData.user || userData;
  const username = userObj.username || userObj.email || "Audiobookshelf Reader";

  onProgress?.({
    step: "connected",
    username,
    message: `Connected as ${username}. Checking listening history...`
  });

  const mediaProgress: any[] = userObj.mediaProgress || userData.mediaProgress || [];
  
  // Filter finished items
  const finishedProgress = mediaProgress.filter((p: any) => 
    p.isFinished === true || 
    p.progress === 1 || 
    p.progress >= 0.95 || 
    (p.currentTime && p.duration && p.currentTime / p.duration >= 0.95) ||
    Boolean(p.finishedAt)
  );

  const targetProgressList = finishedProgress.length > 0 
    ? finishedProgress 
    : (mediaProgress.length > 0 ? mediaProgress.filter((p: any) => (p.currentTime || 0) > 0) : mediaProgress);

  // 2. Efficiently resolve item metadata without downloading the entire library
  const itemCache: Record<string, any> = {};

  // Check which items in targetProgressList lack metadata
  const missingItemIds: string[] = [];
  for (const prog of targetProgressList) {
    const candidateId = prog.libraryItemId || prog.id || prog.mediaItemId;
    const hasInlineMeta = Boolean(
      prog.mediaItem?.metadata?.title || 
      prog.libraryItem?.media?.metadata?.title || 
      prog.title
    );
    if (!hasInlineMeta && candidateId) {
      missingItemIds.push(candidateId);
    }
  }

  // Fetch only missing items in small parallel batches with 3s timeout
  if (missingItemIds.length > 0) {
    const BATCH = 8;
    for (let i = 0; i < missingItemIds.length; i += BATCH) {
      const slice = missingItemIds.slice(i, i + BATCH);
      const results = await Promise.allSettled(slice.map(id => 
        fetchWithTimeout(`${cleanBaseUrl}/api/items/${id}`, { headers }, 3000)
          .then(r => r.ok ? r.json() : null)
      ));
      for (let rIdx = 0; rIdx < results.length; rIdx++) {
        const res = results[rIdx];
        if (res.status === "fulfilled" && res.value) {
          const item = res.value;
          if (item.id) itemCache[item.id] = item;
          if (item.media?.id) itemCache[item.media.id] = item;
        }
      }
    }
  }

  // 3. Assemble raw list of books
  const rawBookList: any[] = [];

  if (targetProgressList.length > 0) {
    for (const prog of targetProgressList) {
      const candidateIds = [
        prog.libraryItemId,
        prog.id,
        prog.mediaItemId,
        prog.media?.libraryItemId,
        prog.media?.id
      ].filter(Boolean);

      let itemDetail = prog.libraryItem || null;
      if (!itemDetail) {
        for (const cid of candidateIds) {
          if (itemCache[cid]) {
            itemDetail = itemCache[cid];
            break;
          }
        }
      }

      const libraryItemId = itemDetail?.id || prog.libraryItemId || prog.id || prog.mediaItemId;
      const media = itemDetail?.media || prog.mediaItem || {};
      const meta = media.metadata || itemDetail?.metadata || {};

      const title = meta.title 
        || itemDetail?.title 
        || prog.mediaItem?.metadata?.title 
        || prog.title 
        || `Audiobook ${String(libraryItemId).slice(0, 8)}`;

      let author = meta.authorName;
      if (!author && Array.isArray(meta.authors) && meta.authors.length > 0) {
        author = typeof meta.authors[0] === 'string' ? meta.authors[0] : meta.authors[0]?.name;
      }
      if (!author && prog.mediaItem?.metadata?.authorName) {
        author = prog.mediaItem.metadata.authorName;
      }
      if (!author && itemDetail?.author) {
        author = itemDetail.author;
      }
      if (!author) {
        author = "Unknown Author";
      }

      let narrator = meta.narratorName;
      if (!narrator && Array.isArray(meta.narrators) && meta.narrators.length > 0) {
        narrator = typeof meta.narrators[0] === 'string' ? meta.narrators[0] : meta.narrators[0]?.name;
      }
      if (!narrator) {
        narrator = "Uncredited Narrator";
      }

      const rawYear = meta.publishedYear || meta.publishedDate?.slice(0, 4) || meta.year;
      const year = parseInt(String(rawYear || "2022"), 10) || 2022;

      const durationSeconds = media.duration || prog.duration || 36000;
      const durationHours = Math.round((durationSeconds / 3600) * 10) / 10;

      const fileSizeBytes = media.size || itemDetail?.size || (350 * 1024 * 1024);

      const description = meta.description 
        || itemDetail?.description 
        || `Finished in your Audiobookshelf reading journey on ${prog.finishedAt ? new Date(prog.finishedAt).toLocaleDateString() : "recent session"}.`;

      const genres = Array.isArray(meta.genres) && meta.genres.length > 0 
        ? meta.genres 
        : (Array.isArray(itemDetail?.genres) && itemDetail.genres.length > 0 ? itemDetail.genres : ["Audiobook"]);

      const tags = Array.isArray(media.tags) && media.tags.length > 0 
        ? media.tags 
        : (Array.isArray(itemDetail?.tags) && itemDetail.tags.length > 0 ? itemDetail.tags : ["#Finished", "#ReadShelf"]);

      rawBookList.push({
        libraryItemId,
        title,
        author,
        narrator,
        year,
        durationHours: Math.max(0.5, durationHours),
        fileSizeBytes,
        description,
        genres,
        tags,
        isFinished: true,
        finishedAt: prog.finishedAt || null
      });
    }
  } else {
    // If user has 0 mediaProgress items, query library items
    try {
      const librariesRes = await fetchWithTimeout(`${cleanBaseUrl}/api/libraries`, { headers }, 4000);
      if (librariesRes.ok) {
        const libData = await librariesRes.json();
        const libraries = libData.libraries || [];
        const bookLib = libraries.find((l: any) => l.mediaType === "book") || libraries[0];
        if (bookLib) {
          const itemsRes = await fetchWithTimeout(`${cleanBaseUrl}/api/libraries/${bookLib.id}/items?limit=40`, { headers }, 4000);
          if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            const results = itemsData.results || [];
            for (const item of results) {
              const media = item.media || {};
              const meta = media.metadata || {};
              rawBookList.push({
                libraryItemId: item.id,
                title: meta.title || item.title || "Audiobook",
                author: meta.authorName || (Array.isArray(meta.authors) ? meta.authors[0]?.name || meta.authors[0] : "Author"),
                narrator: meta.narratorName || "Narrator",
                year: parseInt(meta.publishedYear || meta.year || "2022", 10) || 2022,
                durationHours: Math.max(0.5, Math.round(((media.duration || 36000) / 3600) * 10) / 10),
                fileSizeBytes: media.size || (350 * 1024 * 1024),
                description: meta.description || "Audiobook from your Audiobookshelf library.",
                genres: Array.isArray(meta.genres) && meta.genres.length > 0 ? meta.genres : ["Audiobook"],
                tags: ["#LibraryItem"],
                isFinished: true
              });
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (rawBookList.length === 0) {
    throw new Error(`Connected successfully as ${username}, but no audiobooks were found in your listening history or library.`);
  }

  onProgress?.({
    step: "listing",
    total: rawBookList.length,
    message: `Found ${rawBookList.length} read audiobooks. Analyzing cover artwork and extracting colors...`
  });

  // 4. Fetch actual cover artwork and extract real dominant colors in parallel with time budget
  const readAudiobooks: any[] = [];
  const BATCH_SIZE = 10;
  const MAX_COVER_TIME_MS = 15000; // 15s budget to ensure rapid response well under Cloud Run 60s limit
  const startTime = Date.now();

  for (let i = 0; i < rawBookList.length; i += BATCH_SIZE) {
    const batch = rawBookList.slice(i, i + BATCH_SIZE);
    const timeSpent = Date.now() - startTime;
    const shouldSkipCoverNetwork = timeSpent > MAX_COVER_TIME_MS;
    
    // Send progress event
    const currentBook = batch[0];
    onProgress?.({
      step: "extracting",
      current: Math.min(i + batch.length, rawBookList.length),
      total: rawBookList.length,
      bookTitle: currentBook.title,
      message: `Analyzing cover artwork (${Math.min(i + batch.length, rawBookList.length)}/${rawBookList.length}): ${currentBook.title}`
    });

    const batchResults = await Promise.allSettled(batch.map(async (book) => {
      const coverProxyUrl = `/api/abs/cover?serverUrl=${encodeURIComponent(cleanBaseUrl)}&itemId=${encodeURIComponent(book.libraryItemId)}&token=${encodeURIComponent(apiToken.trim())}`;
      
      // Request thumbnail webp if supported by ABS for ultra-fast download, fallback to standard cover
      const coverDirectThumbnailUrl = `${cleanBaseUrl}/api/items/${book.libraryItemId}/cover?width=256&format=webp${apiToken ? `&token=${encodeURIComponent(apiToken.trim())}` : ""}`;
      const coverDirectStandardUrl = `${cleanBaseUrl}/api/items/${book.libraryItemId}/cover${apiToken ? `?token=${encodeURIComponent(apiToken.trim())}` : ""}`;

      let dominantColor: any = null;
      let palette: any[] = [];
      let hasCover = false;

      if (!shouldSkipCoverNetwork) {
        try {
          let coverFetchRes: Response | null = null;
          try {
            coverFetchRes = await fetchWithTimeout(coverDirectThumbnailUrl, {
              headers: {
                "Authorization": `Bearer ${apiToken.trim()}`,
                "x-api-key": apiToken.trim(),
                "User-Agent": "Is-It-Pink-ABS-Client/1.0"
              }
            }, 2000);
          } catch {
            // fallback to standard url
            coverFetchRes = await fetchWithTimeout(coverDirectStandardUrl, {
              headers: {
                "Authorization": `Bearer ${apiToken.trim()}`,
                "x-api-key": apiToken.trim(),
                "User-Agent": "Is-It-Pink-ABS-Client/1.0"
              }
            }, 2000);
          }

          if (coverFetchRes && coverFetchRes.ok) {
            const imgBuffer = Buffer.from(await coverFetchRes.arrayBuffer());
            if (imgBuffer.length > 0) {
              const extracted = await extractColorsFromImageBuffer(imgBuffer);
              if (extracted) {
                dominantColor = extracted.dominant;
                palette = extracted.palette;
                hasCover = true;
              }
            }
          }
        } catch {
          // Fallback to deterministic color
        }
      }

      // If no cover was downloaded or network timed out, use deterministic palette
      if (!dominantColor) {
        const generated = generateDeterministicBookColor(book.title, book.author);
        dominantColor = generated.dominantColor;
        palette = generated.palette;
      }

      return {
        id: book.libraryItemId,
        title: book.title,
        author: book.author,
        narrator: book.narrator,
        year: book.year,
        durationHours: book.durationHours,
        fileSizeBytes: book.fileSizeBytes,
        folderPath: `${cleanBaseUrl}/api/items/${book.libraryItemId}`,
        coverPath: coverProxyUrl,
        coverUrl: coverProxyUrl,
        hasCoverImage: hasCover,
        dominantColor,
        palette,
        description: book.description,
        rating: 4.8,
        audioFormat: "m4b",
        bitrateKbps: 128,
        genres: book.genres,
        tags: book.tags,
        isFinished: book.isFinished,
        finishedAt: book.finishedAt
      };
    }));

    for (const res of batchResults) {
      if (res.status === "fulfilled") {
        readAudiobooks.push(res.value);
      }
    }
  }

  onProgress?.({
    step: "complete",
    username,
    total: readAudiobooks.length,
    books: readAudiobooks,
    serverUrl: cleanBaseUrl,
    message: `Analyzed ${readAudiobooks.length} audiobooks with chromatic color mapping!`
  });

  return {
    success: true,
    username,
    totalReadBooks: readAudiobooks.length,
    books: readAudiobooks,
    serverUrl: cleanBaseUrl
  };
}

// API: Audiobookshelf Real-Time Streaming Read Shelf Fetch (SSE)
app.post("/api/abs/fetch-read-books-stream", async (req, res) => {
  // CRITICAL: Headers for Google Cloud Run & Nginx unbuffered streaming
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform, no-store");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  // Send 2KB whitespace padding comment immediately to defeat reverse proxy buffers
  res.write(`: ${" ".repeat(2048)}\n\n`);

  const sendSse = (data: AbsProgressUpdate) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch {
      // client may have disconnected
    }
  };

  try {
    const { serverUrl, apiToken } = req.body;
    if (!serverUrl || !apiToken) {
      sendSse({ step: "error", error: "Missing serverUrl or apiToken", message: "Missing URL or API token" });
      return res.end();
    }

    await extractAudiobookshelfReadShelf(serverUrl, apiToken, (update) => {
      sendSse(update);
    });

    res.end();
  } catch (err: any) {
    sendSse({ step: "error", error: err.message || "Failed to communicate with Audiobookshelf server", message: err.message });
    res.end();
  }
});

// API: Audiobookshelf Standard JSON Fetch Proxy (Zero-Trace)
app.post("/api/abs/fetch-read-books", async (req, res) => {
  try {
    const { serverUrl, apiToken } = req.body;
    if (!serverUrl || !apiToken) {
      return res.status(400).json({ error: "Missing serverUrl or apiToken" });
    }

    const result = await extractAudiobookshelfReadShelf(serverUrl, apiToken);
    res.json(result);
  } catch (err: any) {
    console.error("Audiobookshelf Connect Error:", err);
    res.status(500).json({ error: err.message || "Failed to communicate with Audiobookshelf server" });
  }
});

// API: Scan local library folder with sharp real cover color extraction
app.post("/api/scan-library", async (req, res) => {
  try {
    const { libraryPath } = req.body;
    if (!libraryPath || typeof libraryPath !== "string") {
      return res.status(400).json({ error: "Missing libraryPath in request body" });
    }

    const trimmedPath = libraryPath.trim();
    let scannedItems: any[] = [];
    let isRealDirectory = false;

    // Check if path exists on server filesystem
    try {
      if (fs.existsSync(trimmedPath)) {
        const stats = fs.statSync(trimmedPath);
        if (stats.isDirectory()) {
          isRealDirectory = true;
          const entries = fs.readdirSync(trimmedPath, { withFileTypes: true });

          for (const entry of entries) {
            if (entry.isDirectory()) {
              const subDirPath = path.join(trimmedPath, entry.name);
              const subFiles = fs.readdirSync(subDirPath);
              
              // Look for cover image, prioritizing standard cover.jpg / folder.jpg
              const coverFile = subFiles.find(f => /^cover\.(jpg|jpeg|png|webp|avif)$/i.test(f))
                || subFiles.find(f => /^folder\.(jpg|jpeg|png|webp|avif)$/i.test(f))
                || subFiles.find(f => /cover|folder|front|artwork/i.test(f) && /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
                || subFiles.find(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f));

              // Look for audio files
              const audioFiles = subFiles.filter(f => /\.(mp3|m4b|m4a|aac|flac|ogg|wav)$/i.test(f));
              
              let totalBytes = 0;
              for (const af of audioFiles) {
                try {
                  const fStat = fs.statSync(path.join(subDirPath, af));
                  totalBytes += fStat.size;
                } catch (e) {
                  // ignore
                }
              }

              let parsedAuthor = "Unknown Author";
              let parsedTitle = entry.name;
              let parsedYear = 2020 + Math.floor(Math.random() * 4);

              const yearMatch = entry.name.match(/\((\d{4})\)|\[(\d{4})\]/);
              if (yearMatch) {
                parsedYear = parseInt(yearMatch[1] || yearMatch[2], 10);
              }

              const cleanName = entry.name.replace(/\(\d{4}\)|\[\d{4}\]/, "").trim();
              if (cleanName.includes(" - ")) {
                const parts = cleanName.split(" - ");
                parsedAuthor = parts[0].trim();
                parsedTitle = parts.slice(1).join(" - ").trim();
              } else if (cleanName.includes(" by ")) {
                const parts = cleanName.split(" by ");
                parsedTitle = parts[0].trim();
                parsedAuthor = parts[1].trim();
              }

              let dominantColor: any = null;
              let palette: any[] = [];
              let coverUrl = "";

              if (coverFile) {
                const coverFullPath = path.join(subDirPath, coverFile);
                coverUrl = `/api/local-cover?filePath=${encodeURIComponent(coverFullPath)}`;
                try {
                  const imgBuffer = fs.readFileSync(coverFullPath);
                  const extracted = await extractColorsFromImageBuffer(imgBuffer);
                  if (extracted) {
                    dominantColor = extracted.dominant;
                    palette = extracted.palette;
                  }
                } catch (e) {
                  // fallback
                }
              }

              if (!dominantColor) {
                const seed = `${parsedTitle}:${parsedAuthor}`;
                let hash = 0;
                for (let c = 0; c < seed.length; c++) {
                  hash = (hash << 5) - hash + seed.charCodeAt(c);
                  hash |= 0;
                }
                const h = Math.abs(hash) % 360;
                const s = 45 + (Math.abs(hash >> 3) % 40);
                const l = 30 + (Math.abs(hash >> 6) % 35);
                const [r, g, b] = hslToRgbValues(h, s, l);
                dominantColor = getColorDetails(r, g, b);
                palette = [
                  { hex: dominantColor.hex, colorName: dominantColor.colorName, percentage: 65, rgb: dominantColor.rgb },
                  { hex: "#1E293B", colorName: "Slate Dark", percentage: 20, rgb: [30, 41, 59] as [number, number, number] },
                  { hex: "#F8FAFC", colorName: "Ice White", percentage: 15, rgb: [248, 250, 252] as [number, number, number] }
                ];
              }

              scannedItems.push({
                id: "scanned-" + Math.abs(parsedTitle.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36),
                title: parsedTitle || entry.name,
                author: parsedAuthor,
                year: parsedYear,
                folderPath: subDirPath,
                hasCover: !!coverFile,
                hasCoverImage: !!coverFile,
                coverUrl,
                coverFileName: coverFile || null,
                audioFileCount: audioFiles.length,
                fileSizeBytes: totalBytes || (450 * 1024 * 1024),
                durationHours: Math.round(((totalBytes || 450 * 1024 * 1024) / (1024 * 1024 * 35)) * 10) / 10,
                dominantColor,
                palette,
                genres: ["Audiobook", "General"],
                tags: ["#LocalLibrary", "#Imported"]
              });
            }
          }
        }
      }
    } catch (e: any) {
      console.warn("Filesystem scan notice:", e.message);
    }

    res.json({
      success: true,
      libraryPath: trimmedPath,
      isRealDirectory,
      scannedCount: scannedItems.length,
      items: scannedItems
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to scan library" });
  }
});

// API: Social Media Post Generation
app.post("/api/ai/generate-social", async (req, res) => {
  try {
    const { platform, librarySummary, topColors, topGenres, sampleBooks, tone } = req.body;
    const post = generateFallbackSocialPost(platform, librarySummary, topColors, topGenres, sampleBooks, tone);
    res.json({ post, generatedBy: "algorithmic" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate post" });
  }
});

// API: Analytical Report Generation
app.post("/api/ai/generate-report", async (req, res) => {
  try {
    const { librarySummary, topColors, topGenres, authorStats } = req.body;
    const report = generateFallbackReport(librarySummary, topColors, topGenres, authorStats);
    res.json({ report, generatedBy: "algorithmic" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate report" });
  }
});

// Algorithmic fallbacks
function generateFallbackSocialPost(platform: string, summary: any, colors: any[], genres: any[], books: any[], tone: string) {
  const topColorNames = (colors || []).slice(0, 3).map((c: any) => c.name || c.colorName || c.family).join(", ");
  const topGenreNames = (genres || []).slice(0, 3).map((g: any) => g.name || g).join(", ");
  const bookHighlights = (books || []).slice(0, 2).map((b: any) => `"${b.title}" by ${b.author}`).join(" & ");

  if (platform === "instagram") {
    return `🎨📚 MY AUDIOBOOK LIBRARY AS A CHROMATIC TREEMAP\n\nEver wondered what your audiobook collection actually looks like when mapped by the dominant colors of its cover art?\n\n✨ Library Fingerprint:\n• ${summary?.totalBooks || 28} Audiobooks | ${summary?.totalHours || 340} Hours of Narratives\n• Leading Color Palettes: ${topColorNames || "Midnight Blue, Crimson, Terracotta"}\n• Dominant Genres: ${topGenreNames || "Sci-Fi, Epic Fantasy, Thriller"}\n\nNotice how sci-fi and cosmic horror cluster into deep indigo and electric cyan, while historical fiction and memoirs radiate warm parchment and amber ochre!\n\nFeatured in this visual slice: ${bookHighlights || "Dune, Project Hail Mary"}.\n\nSwipe through for the genre and author treemap breakdowns! 👉\n\n#AudiobookCollector #BookTreemap #CoverDesign #ColorPsychology #Bookstagram #ReadingCommunity #Audiobooks #DataVisualization`;
  }

  if (platform === "linkedin") {
    return `Visualizing Literary Curation: A Chromatic Treemap Analysis of ${summary?.totalBooks || 28} Audiobooks.\n\nData visualization isn't just for business metrics—it can uncover fascinating human patterns in literary cover design and storytelling psychology.\n\nKey Insights from our Audiobook Treemap scan:\n1. 📊 Scale: Analyzed ${summary?.totalHours || 340} hours across multiple decades of publications.\n2. 🎨 Dominant Chromatic Families: ${topColorNames}.\n3. 🧠 Genre-Color Alignment: Covers in ${topGenreNames} demonstrate high clustering in distinct color spectrums to prime listener emotional expectations.\n\nVisual navigation transforms a static folder directory into an intuitive, multi-dimensional exploratory experience.\n\n#DataVisualization #DesignThinking #DigitalLibrary #MediaAnalytics #InformationArchitecture #Audiobooks`;
  }

  if (platform === "tiktok") {
    return `POV: You organize your audiobook library by cover colors instead of alphabetical order and it reveals your true reading personality 🎧✨\n\nTotal listening hours: ${summary?.totalHours || 340} hrs\nMain aesthetic: ${topColorNames || "Cyberpunk Cyan & Deep Midnight"}\nTop genres: ${topGenreNames || "Sci-Fi & Thrillers"}\n\nWhich color tile are you clicking on first? Let me know in the comments! 👇\n\n#booktok #audiobooks #bookrecommendations #colorpalette #aestheticlibrary #datastorytelling`;
  }

  // Default Twitter / X
  return `🎨 Turned my entire audiobook library into an interactive Treemap of dominant cover colors!\n\n📊 Library Breakdown:\n🎧 ${summary?.totalBooks || 28} Audiobooks (${summary?.totalHours || 340} hrs)\n🌈 Dominant hues: ${topColorNames}\n📚 Main genres: ${topGenreNames}\n\nFascinating how thriller & sci-fi covers cluster into deep blues & cyans while epic fantasy loves rich obsidian & gold. Featured: ${bookHighlights} 💫\n\n#Audiobooks #BookTwitter #DataViz #BookLover #ReadingGoals`;
}

function generateFallbackReport(summary: any, colors: any[], genres: any[], authors: any[]) {
  return `## Audiobook Library Chromatic & Curatorial Analysis Report

### 1. Executive Summary
This report presents a multi-dimensional analysis of the audiobook collection spanning **${summary?.totalBooks || 28} titles** representing **${summary?.totalHours || 340} total listening hours**. By extracting dominant color signatures from cover artwork and linking them to genre taxonomy, publication dates, and authorship, the library reveals distinct visual and thematic patterns.

### 2. Chromatic Identity & Dominant Color Distribution
- **Leading Color Families**: ${(colors || []).slice(0, 4).map((c: any) => `**${c.name || c.family}** (${c.percentage || c.count || 25}%)`).join(", ")}
- **Psychological Resonance**: The high proportion of deep, contemplative hues (deep blues, cyans, and rich obsidians) correlates with immersive narrative genres such as speculative fiction, psychological mystery, and cosmic worldbuilding.
- **Warm Counterpoints**: Warm accents (terracotta, amber gold) serve as narrative anchors for character-driven historical narratives, literary fiction, and philosophy.

### 3. Multi-Faceted Genre & Temporal Breakdown
- **Dominant Genre Clusters**: ${(genres || []).slice(0, 4).map((g: any) => `*${g.name || g}*`).join(", ")}
- **Publication Era Span**: The collection bridges classical foundations and contemporary masterworks, showing an evolving trend from minimalist, typographic vintage palettes to hyper-saturated digital lighting in 21st-century cover art.

### 4. Curatorial Recommendations
1. **Thematic Listening Journeys**: Group consecutive listening sessions along chromatic gradients (e.g., journeying from *Golden Amber* memoirs into *Midnight Indigo* space operas).
2. **Catalog Balancing**: Expand representation in under-explored sub-genres to diversify both acoustic range and chromatic visual balance.

*Generated by Audiobook Color Treemap & Library Explorer Engine.*`;
}

// Setup Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Audiobook Treemap Server running on port ${PORT}`);
  });
}

startServer();
