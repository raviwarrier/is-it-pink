/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Audiobook } from '../types';
import { classifyColor } from '../utils/colorUtils';
import { SAMPLE_AUDIOBOOKS_DATA } from '../data/sampleAudiobooks';

const AUTHORS = [
  "Frank Herbert", "Andy Weir", "Brandon Sanderson", "Neil Gaiman", "Ursula K. Le Guin",
  "Isaac Asimov", "Philip K. Dick", "Arthur C. Clarke", "Dan Simmons", "William Gibson",
  "Robert Jordan", "George R.R. Martin", "Robin Hobb", "Patrick Rothfuss", "Joe Abercrombie",
  "J.R.R. Tolkien", "Cixin Liu", "Ted Chiang", "Adrian Tchaikovsky", "Peter F. Hamilton",
  "James S.A. Corey", "Neal Stephenson", "Alastair Reynolds", "Iain M. Banks", "Martha Wells",
  "Ann Leckie", "John Scalzi", "Mary Shelley", "Bram Stoker", "H.P. Lovecraft",
  "Aldous Huxley", "George Orwell", "Ray Bradbury", "Stanislaw Lem", "Margaret Atwood",
  "Cormac McCarthy", "Haruki Murakami", "Gabriel García Márquez", "Jorge Luis Borges", "Italo Calvino",
  "Stephen King", "Clive Barker", "Shirley Jackson", "Thomas Ligotti", "Jeff VanderMeer",
  "Yuval Noah Harari", "Carl Sagan", "Richard Feynman", "David Graeber", "Oliver Sacks"
];

const GENRES_LIST = [
  ["Sci-Fi", "Space Opera"],
  ["Sci-Fi", "Hard Sci-Fi"],
  ["Sci-Fi", "Cyberpunk"],
  ["Sci-Fi", "Time Travel"],
  ["Fantasy", "Epic Fantasy"],
  ["Fantasy", "Dark Fantasy"],
  ["Fantasy", "Urban Fantasy"],
  ["Horror", "Cosmic Horror"],
  ["Horror", "Psychological Horror"],
  ["Mystery", "Thriller"],
  ["Non-Fiction", "Science & Philosophy"],
  ["Classic", "Literature"],
  ["Dystopian", "Speculative"]
];

const NARRATORS = [
  "Scott Brick", "Andy Serkis", "Ray Porter", "Simon Vance", "Steven Pacey",
  "Tim Gerard Reynolds", "Michael Kramer", "Kate Reading", "Jefferson Mays", "Neil Gaiman",
  "Ralph Lister", "George Guidall", "Grover Gardner", "Wil Wheaton", "Euan Morton"
];

const NOUNS = [
  "Chronicles", "Horizon", "Empire", "Singularity", "Shadows", "Sun", "Void",
  "Memory", "Echo", "Spectrum", "Tides", "Labyrinth", "Protocol", "Paradox",
  "Constellation", "Engine", "Archive", "Silence", "Dawn", "Requiem", "Odyssey",
  "Vortex", "Symphony", "Mirror", "Gateway", "Citadel", "Fracture", "Beacon",
  "Nebula", "Monolith", "Algorithm", "Threshold", "Fragment", "Sanctuary", "Genesis"
];

const ADJECTIVES = [
  "Infinite", "Crimson", "Obsidian", "Golden", "Emerald", "Silent", "Lost",
  "Fractured", "Starlit", "Quantum", "Eternal", "Celestial", "Abyssal", "Radiant",
  "Forgotten", "Holographic", "Sovereign", "Distant", "Synthetic", "Prismatic",
  "Luminescent", "Spectral", "Ancient", "Gilded", "Frozen", "Sublime", "Velvet"
];

// Curated RGB spectrum anchor nodes for rich realistic chromatic distributions
const COLOR_SPECTRUM_ANCHORS: [number, number, number, string][] = [
  // Violets & Purples
  [124, 58, 237, "Violet Nebula"],
  [147, 51, 234, "Imperial Purple"],
  [109, 40, 217, "Deep Amethyst"],
  [168, 85, 247, "Orchid Glow"],
  [76, 29, 149, "Midnight Violet"],
  
  // Indigos & Deep Blues
  [67, 56, 202, "Cosmic Indigo"],
  [79, 70, 229, "Electric Indigo"],
  [55, 48, 163, "Abyssal Indigo"],
  [30, 27, 75, "Obsidian Navy"],

  // Blues & Azures
  [2, 132, 199, "Cerulean Sky"],
  [37, 99, 235, "Royal Azure"],
  [14, 165, 233, "Glacier Cyan"],
  [30, 58, 138, "Deep Ocean Blue"],
  [12, 74, 110, "Submarine Abyss"],

  // Greens & Emeralds
  [22, 163, 74, "Verdant Forest"],
  [16, 185, 129, "Emerald Matrix"],
  [21, 128, 61, "Shire Meadow"],
  [5, 150, 105, "Jade Temple"],
  [6, 78, 59, "Deep Pine"],

  // Yellows & Golds
  [234, 179, 8, "Solar Flare Yellow"],
  [245, 158, 11, "Dune Gold"],
  [202, 138, 4, "Antique Brass"],
  [253, 224, 71, "Starlight Gold"],
  [161, 98, 7, "Desert Ochre"],

  // Oranges & Terracottas
  [234, 88, 12, "Tangerine Sunset"],
  [194, 65, 12, "Terracotta Rust"],
  [249, 115, 22, "Fiery Amber"],
  [154, 52, 18, "Spice Plateau"],

  // Reds & Crimsons
  [220, 38, 38, "Crimson Core"],
  [185, 28, 28, "Blood Moon Red"],
  [153, 27, 27, "Gothic Burgundy"],
  [239, 68, 68, "Scarlet Dawn"],
  [127, 29, 29, "Obsidian Garnet"],

  // Pinks & Magentas
  [219, 39, 119, "Cyberpunk Fuchsia"],
  [236, 72, 153, "Neon Rose Pink"],
  [190, 24, 93, "Velvet Magenta"],
  [244, 114, 182, "Pastel Flamingo"],
  [131, 24, 67, "Deep Raspberry"],

  // Browns & Earths
  [120, 53, 15, "Old Leather Brown"],
  [146, 64, 14, "Canyon Clay"],
  [69, 26, 3, "Espresso Wood"],
  [180, 83, 9, "Warm Amber Bark"],

  // Whites, Creams & Light Grays
  [248, 250, 252, "Pristine Snow"],
  [241, 245, 249, "Marble Ivory"],
  [226, 232, 240, "Pale Platinum"],
  [203, 213, 225, "Silver Frost"],

  // Blacks & Dark Neutrals
  [15, 23, 42, "Obsidian Space"],
  [24, 24, 27, "Charcoal Slate"],
  [9, 9, 11, "Void Black"],
  [39, 39, 42, "Titanium Dusk"]
];

/**
 * Fast procedural generator to synthesize a realistic library of 4,700+ audiobooks
 * with rich metadata and authentic chromatic distribution.
 */
export function generateLargeLibrary(targetCount: number = 4720): Audiobook[] {
  const result: Audiobook[] = [...SAMPLE_AUDIOBOOKS_DATA];
  let currentId = result.length + 1;

  while (result.length < targetCount) {
    const idx = currentId;
    const author = AUTHORS[idx % AUTHORS.length];
    const adj = ADJECTIVES[(idx * 7) % ADJECTIVES.length];
    const noun = NOUNS[(idx * 13) % NOUNS.length];
    const title = `${adj} ${noun}`;
    const year = 1950 + (idx % 76);
    const genres = GENRES_LIST[idx % GENRES_LIST.length];
    const narrator = NARRATORS[(idx * 3) % NARRATORS.length];

    // Pick color anchor with slight procedural variance
    const colorAnchor = COLOR_SPECTRUM_ANCHORS[idx % COLOR_SPECTRUM_ANCHORS.length];
    const rVar = ((idx * 17) % 19) - 9;
    const gVar = ((idx * 23) % 19) - 9;
    const bVar = ((idx * 29) % 19) - 9;

    const r = Math.max(0, Math.min(255, colorAnchor[0] + rVar));
    const g = Math.max(0, Math.min(255, colorAnchor[1] + gVar));
    const b = Math.max(0, Math.min(255, colorAnchor[2] + bVar));

    const dominantColor = classifyColor(r, g, b);

    // Procedural duration (5.5h to 48.0h)
    const durationHours = Math.round((6.0 + ((idx * 1.7) % 36.5)) * 10) / 10;
    const durationMinutes = Math.round(durationHours * 60);
    const fileSizeBytes = Math.round(durationHours * 28 * 1024 * 1024);

    result.push({
      id: `ab-mega-${currentId.toString().padStart(5, '0')}`,
      title: title,
      author: author,
      year: year,
      genres: genres,
      tags: [`#${genres[0].replace(/[\s-]/g, '')}`, `#${adj}`, `#CollectionItem`],
      durationHours: durationHours,
      durationMinutes: durationMinutes,
      fileSizeBytes: fileSizeBytes,
      folderPath: `/media/audiobooks/mega_collection/${author} - ${title} (${year})`,
      coverPath: `/media/audiobooks/mega_collection/${author} - ${title} (${year})/cover.jpg`,
      coverUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600"><rect width="400" height="600" fill="${dominantColor.hex}"/><circle cx="200" cy="220" r="80" fill="rgba(255,255,255,0.15)"/><text x="200" y="360" font-family="sans-serif" font-weight="bold" font-size="22" fill="#ffffff" text-anchor="middle">${title.length > 20 ? title.slice(0, 19) + '...' : title}</text><text x="200" y="400" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.85)" text-anchor="middle">${author}</text></svg>`
      )}`,
      hasCoverImage: true,
      dominantColor: dominantColor,
      palette: [
        { hex: dominantColor.hex, colorName: dominantColor.colorName, percentage: 55, rgb: dominantColor.rgb },
        { hex: '#18181B', colorName: 'Dark Contrast', percentage: 25, rgb: [24, 24, 27] },
        { hex: '#E4E4E7', colorName: 'Light Contrast', percentage: 20, rgb: [228, 228, 231] }
      ],
      description: `Epic audiobook masterwork exploring ${genres.join(' and ')}. Narrated by ${narrator}.`,
      narrator: narrator,
      rating: Math.round((4.2 + ((idx % 8) * 0.1)) * 100) / 100,
      audioFormat: (idx % 7 === 0) ? "mp3" : "m4b",
      bitrateKbps: 64,
      isFavorite: idx % 11 === 0
    });

    currentId++;
  }

  return result;
}
