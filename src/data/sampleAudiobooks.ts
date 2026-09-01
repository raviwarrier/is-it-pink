/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Audiobook } from '../types';
import { classifyColor } from '../utils/colorUtils';
import { generateLargeLibrary } from '../utils/megaLibraryGenerator';

/**
 * Creates high-fidelity SVG cover art with customized visual style, typography, and color palette
 */
function createCoverSvg(title: string, author: string, primaryColor: string, secondaryColor: string, iconType: string, subtitle?: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${secondaryColor}" />
    </linearGradient>
    <linearGradient id="spineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.6)" />
      <stop offset="15%" stop-color="rgba(255,255,255,0.15)" />
      <stop offset="30%" stop-color="rgba(0,0,0,0.2)" />
      <stop offset="100%" stop-color="transparent" />
    </linearGradient>
    <filter id="noise" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.08 0" />
      <feComposite in2="SourceGraphic" in="gl" operator="in" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="400" height="600" fill="url(#bgGrad)" />
  
  <!-- Subtle geometric motifs -->
  <circle cx="200" cy="280" r="140" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-dasharray="6,4" />
  <circle cx="200" cy="280" r="100" fill="rgba(0,0,0,0.2)" />
  <circle cx="200" cy="280" r="60" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />

  <!-- Center Artwork Icon Motif -->
  <g transform="translate(170, 250) scale(1.25)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    ${iconType === 'planet' ? '<circle cx="24" cy="24" r="18" fill="rgba(255,255,255,0.1)"/><ellipse cx="24" cy="24" rx="28" ry="8" stroke="rgba(255,255,255,0.7)"/>' : ''}
    ${iconType === 'sword' ? '<path d="M14.5 17.5L3 29V32H6L17.5 20.5M20 18L32 6L29 3L17 15M23 15L20 18M18 20L15 23" />' : ''}
    ${iconType === 'eye' ? '<path d="M2 24s7-14 22-14 22 14 22 14-7 14-22 14-22-14-22-14z"/><circle cx="24" cy="24" r="6" fill="#fff"/>' : ''}
    ${iconType === 'compass' ? '<circle cx="24" cy="24" r="20"/><polygon points="24 8 28 20 40 24 28 28 24 40 20 28 8 24 20 20" fill="rgba(255,255,255,0.4)"/>' : ''}
    ${iconType === 'brain' ? '<path d="M12 16a6 6 0 0 1 12 0 6 6 0 0 1 12 0c0 7-6 11-12 16-6-5-12-9-12-16z"/>' : ''}
    ${iconType === 'clock' ? '<circle cx="24" cy="24" r="18"/><polyline points="24 12 24 24 32 28"/>' : ''}
    ${iconType === 'mountain' ? '<polygon points="4 38 18 16 26 28 32 20 44 38" fill="rgba(255,255,255,0.15)"/>' : ''}
    ${iconType === 'sparkles' ? '<path d="M24 4L27 18L41 21L27 24L24 38L21 24L7 21L21 18Z" fill="rgba(255,255,255,0.3)"/>' : ''}
  </g>

  <!-- Frame border -->
  <rect x="20" y="20" width="360" height="560" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
  <rect x="26" y="26" width="348" height="548" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />

  <!-- Badge Header -->
  <rect x="130" y="44" width="140" height="24" rx="12" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.2)" />
  <text x="200" y="60" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="700" letter-spacing="3" fill="#ffffff" text-transform="uppercase">UNABRIDGED AUDIO</text>

  <!-- Title & Subtitle -->
  <text x="200" y="140" text-anchor="middle" font-family="'Playfair Display', serif" font-size="28" font-weight="700" fill="#ffffff" letter-spacing="1">
    ${title.length > 22 ? title.slice(0, 20) + '...' : title}
  </text>
  ${subtitle ? `<text x="200" y="170" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="500" fill="rgba(255,255,255,0.8)" letter-spacing="2">${subtitle}</text>` : ''}

  <!-- Author Name -->
  <line x1="120" y1="470" x2="280" y2="470" stroke="rgba(255,255,255,0.3)" stroke-width="1" />
  <text x="200" y="495" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="600" letter-spacing="4" fill="rgba(255,255,255,0.7)">WRITTEN BY</text>
  <text x="200" y="525" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="20" font-weight="700" fill="#ffffff" letter-spacing="1">${author}</text>

  <!-- Book Spine 3D Effect on Left -->
  <rect x="0" y="0" width="30" height="600" fill="url(#spineGrad)" />
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_AUDIOBOOKS_DATA: Audiobook[] = [
  {
    id: "ab-001",
    title: "Dune",
    author: "Frank Herbert",
    year: 1965,
    genres: ["Sci-Fi", "Space Opera", "Classic"],
    tags: ["#HugoWinner", "#DesertWorld", "#SpiceMelange", "#PoliticalIntrigue", "#Arrakis"],
    durationHours: 21.2,
    durationMinutes: 1272,
    fileSizeBytes: 642 * 1024 * 1024,
    folderPath: "/Audiobooks/Frank Herbert - Dune (1965)",
    coverPath: "/Audiobooks/Frank Herbert - Dune (1965)/cover.jpg",
    coverUrl: createCoverSvg("Dune", "Frank Herbert", "#C2410C", "#7C2D12", "planet", "THE ARRAKIS CHRONICLES"),
    hasCoverImage: true,
    dominantColor: classifyColor(194, 65, 12), // Terracotta Amber Rust #C2410C
    palette: [
      { hex: "#C2410C", colorName: "Terracotta Amber", percentage: 48, rgb: [194, 65, 12] },
      { hex: "#7C2D12", colorName: "Deep Rust Spice", percentage: 26, rgb: [124, 45, 18] },
      { hex: "#F59E0B", colorName: "Sun Gold Dune", percentage: 14, rgb: [245, 158, 11] },
      { hex: "#1C1917", colorName: "Night Sand", percentage: 12, rgb: [28, 25, 23] },
    ],
    description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.",
    narrator: "Scott Brick, Orlagh Cassidy, Euan Morton",
    series: "Dune Chronicles",
    seriesNumber: 1,
    rating: 4.9,
    audioFormat: "m4b",
    bitrateKbps: 64,
    isFavorite: true
  },
  {
    id: "ab-002",
    title: "Project Hail Mary",
    author: "Andy Weir",
    year: 2021,
    genres: ["Sci-Fi", "Hard Sci-Fi", "Survival"],
    tags: ["#AudieWinner", "#Rocky", "#FirstContact", "#SpaceScience", "#Astrophage"],
    durationHours: 16.1,
    durationMinutes: 966,
    fileSizeBytes: 480 * 1024 * 1024,
    folderPath: "/Audiobooks/Andy Weir - Project Hail Mary (2021)",
    coverPath: "/Audiobooks/Andy Weir - Project Hail Mary (2021)/cover.jpg",
    coverUrl: createCoverSvg("Project Hail Mary", "Andy Weir", "#0284C7", "#0F172A", "planet", "SOLITARY MISSION"),
    hasCoverImage: true,
    dominantColor: classifyColor(2, 132, 199), // Cyan Blue #0284C7
    palette: [
      { hex: "#0284C7", colorName: "Starlight Cyan", percentage: 42, rgb: [2, 132, 199] },
      { hex: "#0F172A", colorName: "Deep Cosmos Slate", percentage: 34, rgb: [15, 23, 42] },
      { hex: "#FACC15", colorName: "Astrophage Glow", percentage: 16, rgb: [250, 204, 21] },
      { hex: "#38BDF8", colorName: "Solar Ion Flare", percentage: 8, rgb: [56, 189, 248] },
    ],
    description: "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself are doomed.",
    narrator: "Ray Porter",
    rating: 4.95,
    audioFormat: "m4b",
    bitrateKbps: 128,
    isFavorite: true
  },
  {
    id: "ab-003",
    title: "The Way of Kings",
    author: "Brandon Sanderson",
    year: 2010,
    genres: ["Fantasy", "Epic Fantasy", "High Fantasy"],
    tags: ["#Cosmere", "#Stormlight", "#Kaladin", "#Spren", "#Shardblade"],
    durationHours: 45.5,
    durationMinutes: 2730,
    fileSizeBytes: 1350 * 1024 * 1024,
    folderPath: "/Audiobooks/Brandon Sanderson - The Way of Kings (2010)",
    coverPath: "/Audiobooks/Brandon Sanderson - The Way of Kings (2010)/folder.jpg",
    coverUrl: createCoverSvg("The Way of Kings", "Brandon Sanderson", "#1E3A8A", "#4C1D95", "sword", "STORMLIGHT ARCHIVE #1"),
    hasCoverImage: true,
    dominantColor: classifyColor(30, 58, 138), // Midnight Indigo Blue #1E3A8A
    palette: [
      { hex: "#1E3A8A", colorName: "Highstorm Cobalt", percentage: 46, rgb: [30, 58, 138] },
      { hex: "#4C1D95", colorName: "Voidbringer Indigo", percentage: 28, rgb: [76, 29, 149] },
      { hex: "#60A5FA", colorName: "Honorspren Cyan", percentage: 16, rgb: [96, 165, 250] },
      { hex: "#F59E0B", colorName: "Shardplate Amber", percentage: 10, rgb: [245, 158, 11] },
    ],
    description: "Roshar is a world of stone and storms. Uncanny tempests of incredible power sweep across the rocky terrain so frequently that they have shaped ecology and civilization alike.",
    narrator: "Michael Kramer, Kate Reading",
    series: "The Stormlight Archive",
    seriesNumber: 1,
    rating: 4.9,
    audioFormat: "m4b",
    bitrateKbps: 64,
    isFavorite: true
  },
  {
    id: "ab-004",
    title: "The Secret History",
    author: "Donna Tartt",
    year: 1992,
    genres: ["Mystery", "Dark Academia", "Literary Fiction"],
    tags: ["#GreekTragedy", "#CollegeCampus", "#Psychological", "#Classics", "#Atmospheric"],
    durationHours: 22.1,
    durationMinutes: 1326,
    fileSizeBytes: 620 * 1024 * 1024,
    folderPath: "/Audiobooks/Donna Tartt - The Secret History (1992)",
    coverPath: "/Audiobooks/Donna Tartt - The Secret History (1992)/cover.jpg",
    coverUrl: createCoverSvg("The Secret History", "Donna Tartt", "#15803D", "#1C1917", "eye", "DARK ACADEMIA MASTERPIECE"),
    hasCoverImage: true,
    dominantColor: classifyColor(21, 128, 61), // Forest Green #15803D
    palette: [
      { hex: "#15803D", colorName: "Ivy League Emerald", percentage: 50, rgb: [21, 128, 61] },
      { hex: "#1C1917", colorName: "Hampden Slate", percentage: 30, rgb: [28, 25, 23] },
      { hex: "#D97706", colorName: "Greek Gold", percentage: 12, rgb: [217, 119, 6] },
      { hex: "#DC2626", colorName: "Crimson Velvet", percentage: 8, rgb: [220, 38, 38] },
    ],
    description: "Under the influence of their charismatic classics professor, a group of clever, eccentric misfits at an elite New England college discover a way of thinking and living that is a world away from the humdrum existence of their contemporaries.",
    narrator: "Donna Tartt",
    rating: 4.85,
    audioFormat: "mp3",
    bitrateKbps: 96
  },
  {
    id: "ab-005",
    title: "The Three-Body Problem",
    author: "Cixin Liu",
    year: 2008,
    genres: ["Sci-Fi", "Hard Sci-Fi", "Cosmic Horror"],
    tags: ["#Trisolaris", "#HugoWinner", "#Physics", "#FermiParadox", "#FirstContact"],
    durationHours: 13.5,
    durationMinutes: 810,
    fileSizeBytes: 410 * 1024 * 1024,
    folderPath: "/Audiobooks/Cixin Liu - The Three-Body Problem (2008)",
    coverPath: "/Audiobooks/Cixin Liu - The Three-Body Problem (2008)/cover.jpg",
    coverUrl: createCoverSvg("The Three-Body Problem", "Cixin Liu", "#B91C1C", "#18181B", "planet", "REMEMBRANCE OF EARTH'S PAST"),
    hasCoverImage: true,
    dominantColor: classifyColor(185, 28, 28), // Crimson Red #B91C1C
    palette: [
      { hex: "#B91C1C", colorName: "Solar Flare Crimson", percentage: 45, rgb: [185, 28, 28] },
      { hex: "#18181B", colorName: "Deep Trisolaran Void", percentage: 35, rgb: [24, 24, 27] },
      { hex: "#F59E0B", colorName: "Chaotic Era Corona", percentage: 12, rgb: [245, 158, 11] },
      { hex: "#6366F1", colorName: "Sophon Indigo", percentage: 8, rgb: [99, 102, 241] },
    ],
    description: "Set against the backdrop of China's Cultural Revolution, a secret military project sends signals into space to establish contact with aliens.",
    narrator: "Luke Daniels",
    series: "Remembrance of Earth's Past",
    seriesNumber: 1,
    rating: 4.75,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-006",
    title: "Neuromancer",
    author: "William Gibson",
    year: 1984,
    genres: ["Sci-Fi", "Cyberpunk", "Classic"],
    tags: ["#Matrix", "#Cyberspace", "#AI", "#Sprawl", "#Noir"],
    durationHours: 10.4,
    durationMinutes: 624,
    fileSizeBytes: 310 * 1024 * 1024,
    folderPath: "/Audiobooks/William Gibson - Neuromancer (1984)",
    coverPath: "/Audiobooks/William Gibson - Neuromancer (1984)/cover.png",
    coverUrl: createCoverSvg("Neuromancer", "William Gibson", "#06B6D4", "#4A044E", "sparkles", "THE SPRAWL TRILOGY"),
    hasCoverImage: true,
    dominantColor: classifyColor(6, 182, 212), // Cyber Cyan #06B6D4
    palette: [
      { hex: "#06B6D4", colorName: "Cyberpunk Cyan", percentage: 44, rgb: [6, 182, 212] },
      { hex: "#4A044E", colorName: "Neon Magenta Noir", percentage: 32, rgb: [74, 4, 78] },
      { hex: "#1E1B4B", colorName: "Chiba City Night", percentage: 16, rgb: [30, 27, 75] },
      { hex: "#22C55E", colorName: "Terminal Phosphor", percentage: 8, rgb: [34, 197, 94] },
    ],
    description: "The sky above the port was the color of television, tuned to a dead channel. Case is a washed-up computer hacker hired by a mysterious new employer.",
    narrator: "Robertson Dean",
    series: "Sprawl",
    seriesNumber: 1,
    rating: 4.7,
    audioFormat: "mp3",
    bitrateKbps: 128
  },
  {
    id: "ab-007",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    year: 2014,
    genres: ["Non-Fiction", "History", "Anthropology", "Philosophy"],
    tags: ["#Evolution", "#CognitiveRevolution", "#GlobalBestseller", "#BigHistory"],
    durationHours: 15.3,
    durationMinutes: 918,
    fileSizeBytes: 440 * 1024 * 1024,
    folderPath: "/Audiobooks/Yuval Noah Harari - Sapiens (2014)",
    coverPath: "/Audiobooks/Yuval Noah Harari - Sapiens (2014)/cover.jpg",
    coverUrl: createCoverSvg("Sapiens", "Yuval Noah Harari", "#E2E8F0", "#334155", "brain", "BRIEF HISTORY OF HUMANKIND"),
    hasCoverImage: true,
    dominantColor: classifyColor(226, 232, 240), // Parchment White #E2E8F0
    palette: [
      { hex: "#E2E8F0", colorName: "Parchment Fossil", percentage: 55, rgb: [226, 232, 240] },
      { hex: "#334155", colorName: "Flint Stone Slate", percentage: 25, rgb: [51, 65, 85] },
      { hex: "#B45309", colorName: "Campfire Ochre", percentage: 12, rgb: [180, 83, 9] },
      { hex: "#DC2626", colorName: "Fingerprint Ochre", percentage: 8, rgb: [220, 38, 38] },
    ],
    description: "100,000 years ago, at least six human species inhabited the earth. Today there is just one. Us. Homo sapiens.",
    narrator: "Derek Perkins",
    rating: 4.8,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-008",
    title: "The Left Hand of Darkness",
    author: "Ursula K. Le Guin",
    year: 1969,
    genres: ["Sci-Fi", "Literary Fiction", "Classic"],
    tags: ["#HugoWinner", "#NebulaWinner", "#HainishCycle", "#GenderExploration", "#WinterPlanet"],
    durationHours: 9.6,
    durationMinutes: 576,
    fileSizeBytes: 290 * 1024 * 1024,
    folderPath: "/Audiobooks/Ursula K. Le Guin - The Left Hand of Darkness (1969)",
    coverPath: "/Audiobooks/Ursula K. Le Guin - The Left Hand of Darkness (1969)/folder.png",
    coverUrl: createCoverSvg("Left Hand of Darkness", "Ursula K. Le Guin", "#7E22CE", "#1E1B4B", "planet", "GETHEN CHRONICLES"),
    hasCoverImage: true,
    dominantColor: classifyColor(126, 34, 206), // Royal Purple #7E22CE
    palette: [
      { hex: "#7E22CE", colorName: "Royal Astral Purple", percentage: 46, rgb: [126, 34, 206] },
      { hex: "#1E1B4B", colorName: "Glacial Midnight", percentage: 32, rgb: [30, 27, 75] },
      { hex: "#E0E7FF", colorName: "Gethen Ice Mist", percentage: 14, rgb: [224, 231, 255] },
      { hex: "#F43F5E", colorName: "Kemmer Rose", percentage: 8, rgb: [244, 63, 94] },
    ],
    description: "A lone human envoy is sent to Gethen, a world whose inhabitants can choose and change their gender.",
    narrator: "George Guidall",
    series: "Hainish Cycle",
    rating: 4.8,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-009",
    title: "Stories of Your Life and Others",
    author: "Ted Chiang",
    year: 2002,
    genres: ["Sci-Fi", "Short Stories", "Philosophy"],
    tags: ["#Arrival", "#Linguistics", "#TimeNonlinear", "#NebulaWinner", "#MindBending"],
    durationHours: 11.2,
    durationMinutes: 672,
    fileSizeBytes: 330 * 1024 * 1024,
    folderPath: "/Audiobooks/Ted Chiang - Stories of Your Life (2002)",
    coverPath: "/Audiobooks/Ted Chiang - Stories of Your Life (2002)/cover.jpg",
    coverUrl: createCoverSvg("Stories of Your Life", "Ted Chiang", "#0D9488", "#111827", "clock", "PHILOSOPHICAL SPECULATION"),
    hasCoverImage: true,
    dominantColor: classifyColor(13, 148, 136), // Emerald Teal #0D9488
    palette: [
      { hex: "#0D9488", colorName: "Heptapod Teal", percentage: 48, rgb: [13, 148, 136] },
      { hex: "#111827", colorName: "Temporal Void", percentage: 30, rgb: [17, 24, 39] },
      { hex: "#99F6E4", colorName: "Linguistic Glyph", percentage: 14, rgb: [153, 246, 228] },
      { hex: "#F59E0B", colorName: "Tower of Babylon Ochre", percentage: 8, rgb: [245, 158, 11] },
    ],
    description: "Includes the story behind the movie Arrival. Eight brilliant and deeply touching stories examining what it means to be human.",
    narrator: "Abby Craden, Todd McLaren",
    rating: 4.9,
    audioFormat: "m4b",
    bitrateKbps: 64,
    isFavorite: true
  },
  {
    id: "ab-010",
    title: "Exhalation: Stories",
    author: "Ted Chiang",
    year: 2019,
    genres: ["Sci-Fi", "Short Stories", "Philosophy"],
    tags: ["#HugoWinner", "#Thermodynamics", "#FreeWill", "#AIEthics", "#TimeTravel"],
    durationHours: 10.8,
    durationMinutes: 648,
    fileSizeBytes: 320 * 1024 * 1024,
    folderPath: "/Audiobooks/Ted Chiang - Exhalation (2019)",
    coverPath: "/Audiobooks/Ted Chiang - Exhalation (2019)/cover.jpg",
    coverUrl: createCoverSvg("Exhalation", "Ted Chiang", "#BE185D", "#4C0519", "sparkles", "NINE GROUNDBREAKING TALES"),
    hasCoverImage: true,
    dominantColor: classifyColor(190, 24, 93), // Magenta Rose #BE185D
    palette: [
      { hex: "#BE185D", colorName: "Pneumatic Rose", percentage: 45, rgb: [190, 24, 93] },
      { hex: "#4C0519", colorName: "Deep Burgundy Lung", percentage: 32, rgb: [76, 5, 25] },
      { hex: "#FBCFE8", colorName: "Vapor Air Glow", percentage: 15, rgb: [251, 207, 232] },
      { hex: "#E11D48", colorName: "Entropy Vermilion", percentage: 8, rgb: [225, 29, 72] },
    ],
    description: "A visionary collection of nine profound, resonant stories grappling with the oldest questions on earth and the newest ones made by technology.",
    narrator: "Edoardo Ballerini, Dominic Hoffman, Amy Landon",
    rating: 4.88,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-011",
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    year: 2021,
    genres: ["Literary Fiction", "Sci-Fi", "Dystopian"],
    tags: ["#ArtificialFriend", "#SolarPower", "#NobelLaureate", "#Heartbreaking", "#FutureSociety"],
    durationHours: 10.2,
    durationMinutes: 612,
    fileSizeBytes: 298 * 1024 * 1024,
    folderPath: "/Audiobooks/Kazuo Ishiguro - Klara and the Sun (2021)",
    coverPath: "/Audiobooks/Kazuo Ishiguro - Klara and the Sun (2021)/cover.jpg",
    coverUrl: createCoverSvg("Klara and the Sun", "Kazuo Ishiguro", "#EAB308", "#CA8A04", "sparkles", "AN ARTIFICIAL FRIEND"),
    hasCoverImage: true,
    dominantColor: classifyColor(234, 179, 8), // Golden Sun Yellow #EAB308
    palette: [
      { hex: "#EAB308", colorName: "Solar Ray Gold", percentage: 52, rgb: [234, 179, 8] },
      { hex: "#CA8A04", colorName: "Warm Amber Glow", percentage: 28, rgb: [202, 138, 4] },
      { hex: "#FEF08A", colorName: "Morning Sunlight", percentage: 12, rgb: [254, 240, 138] },
      { hex: "#1E293B", colorName: "Storefront Shadow", percentage: 8, rgb: [30, 41, 59] },
    ],
    description: "From her place in the store, Klara, an Artificial Friend with outstanding observational qualities, watches carefully the behavior of those who come in to browse.",
    narrator: "Sura Siu",
    rating: 4.7,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-012",
    title: "Neverwhere",
    author: "Neil Gaiman",
    year: 1996,
    genres: ["Fantasy", "Urban Fantasy", "Dark Fantasy"],
    tags: ["#LondonBelow", "#FullCast", "#Doorways", "#Mythology", "#Subterranean"],
    durationHours: 12.4,
    durationMinutes: 744,
    fileSizeBytes: 360 * 1024 * 1024,
    folderPath: "/Audiobooks/Neil Gaiman - Neverwhere (1996)",
    coverPath: "/Audiobooks/Neil Gaiman - Neverwhere (1996)/cover.png",
    coverUrl: createCoverSvg("Neverwhere", "Neil Gaiman", "#18181B", "#3F3F46", "eye", "LONDON BELOW"),
    hasCoverImage: true,
    dominantColor: classifyColor(24, 24, 27), // Obsidian Black #18181B
    palette: [
      { hex: "#18181B", colorName: "London Below Noir", percentage: 54, rgb: [24, 24, 27] },
      { hex: "#3F3F46", colorName: "Tube Station Cobblestone", percentage: 26, rgb: [63, 63, 70] },
      { hex: "#E11D48", colorName: "Angel Islington Rose", percentage: 12, rgb: [225, 29, 72] },
      { hex: "#CA8A04", colorName: "Key Merchant Brass", percentage: 8, rgb: [202, 138, 4] },
    ],
    description: "Richard Mayhew is a young London businessman with a good heart and an ordinary life, which is changed forever when he stops to help a bleeding girl.",
    narrator: "Neil Gaiman",
    series: "London Below",
    seriesNumber: 1,
    rating: 4.82,
    audioFormat: "m4b",
    bitrateKbps: 128,
    isFavorite: true
  },
  {
    id: "ab-013",
    title: "The Ocean at the End of the Lane",
    author: "Neil Gaiman",
    year: 2013,
    genres: ["Fantasy", "Magical Realism", "Memoir/Myth"],
    tags: ["#HempstockFamily", "#Nostalgia", "#ChildhoodMemory", "#AncientMagic"],
    durationHours: 5.8,
    durationMinutes: 348,
    fileSizeBytes: 180 * 1024 * 1024,
    folderPath: "/Audiobooks/Neil Gaiman - The Ocean at the End of the Lane (2013)",
    coverPath: "/Audiobooks/Neil Gaiman - The Ocean at the End of the Lane (2013)/cover.jpg",
    coverUrl: createCoverSvg("Ocean at End of Lane", "Neil Gaiman", "#1D4ED8", "#0284C7", "compass", "MYTHIC CHILDHOOD"),
    hasCoverImage: true,
    dominantColor: classifyColor(29, 78, 216), // Cobalt Blue #1D4ED8
    palette: [
      { hex: "#1D4ED8", colorName: "Pond Ocean Cobalt", percentage: 46, rgb: [29, 78, 216] },
      { hex: "#0284C7", colorName: "Duckpond Cerulean", percentage: 30, rgb: [2, 132, 199] },
      { hex: "#0F172A", colorName: "Sussex Night Sky", percentage: 16, rgb: [15, 23, 42] },
      { hex: "#FDE047", colorName: "Hempstock Farm Light", percentage: 8, rgb: [253, 224, 71] },
    ],
    description: "A middle-aged man returns to his childhood home to attend a funeral. Although the house he lived in is long gone, he is drawn to the farm at the end of the road.",
    narrator: "Neil Gaiman",
    rating: 4.88,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-014",
    title: "1984",
    author: "George Orwell",
    year: 1949,
    genres: ["Classic", "Dystopian", "Political Fiction"],
    tags: ["#BigBrother", "#Newspeak", "#Thoughtcrime", "#Totalitarianism", "#Classics"],
    durationHours: 11.5,
    durationMinutes: 690,
    fileSizeBytes: 330 * 1024 * 1024,
    folderPath: "/Audiobooks/George Orwell - 1984 (1949)",
    coverPath: "/Audiobooks/George Orwell - 1984 (1949)/cover.jpg",
    coverUrl: createCoverSvg("1984", "George Orwell", "#DC2626", "#18181B", "eye", "BIG BROTHER IS WATCHING"),
    hasCoverImage: true,
    dominantColor: classifyColor(220, 38, 38), // Red #DC2626
    palette: [
      { hex: "#DC2626", colorName: "Ingsoc Party Red", percentage: 48, rgb: [220, 38, 38] },
      { hex: "#18181B", colorName: "Telescreen Obsidian", percentage: 34, rgb: [24, 24, 27] },
      { hex: "#71717A", colorName: "Ministry Concrete Gray", percentage: 12, rgb: [113, 113, 122] },
      { hex: "#FEF08A", colorName: "Victory Gin Amber", percentage: 6, rgb: [254, 240, 138] },
    ],
    description: "Winston Smith toils in the Ministry of Truth, rewriting history to satisfy the demands of the Ministry.",
    narrator: "Simon Prebble",
    rating: 4.78,
    audioFormat: "mp3",
    bitrateKbps: 64
  },
  {
    id: "ab-015",
    title: "The Shining",
    author: "Stephen King",
    year: 1977,
    genres: ["Horror", "Psychological Thriller", "Classic"],
    tags: ["#OverlookHotel", "#Supernatural", "#Isolation", "#Winter", "#JackTorrance"],
    durationHours: 15.9,
    durationMinutes: 954,
    fileSizeBytes: 460 * 1024 * 1024,
    folderPath: "/Audiobooks/Stephen King - The Shining (1977)",
    coverPath: "/Audiobooks/Stephen King - The Shining (1977)/folder.jpg",
    coverUrl: createCoverSvg("The Shining", "Stephen King", "#991B1B", "#7F1D1D", "eye", "THE OVERLOOK HOTEL"),
    hasCoverImage: true,
    dominantColor: classifyColor(153, 27, 27), // Crimson Blood #991B1B
    palette: [
      { hex: "#991B1B", colorName: "Overlook Crimson", percentage: 50, rgb: [153, 27, 27] },
      { hex: "#7F1D1D", colorName: "Room 237 Maroon", percentage: 28, rgb: [127, 29, 29] },
      { hex: "#F59E0B", colorName: "Colorado Sun Yellow", percentage: 14, rgb: [245, 158, 11] },
      { hex: "#18181B", colorName: "Hedge Maze Black", percentage: 8, rgb: [24, 24, 27] },
    ],
    description: "Jack Torrance's new job at the Overlook Hotel is the perfect chance for a fresh start. As the off-season caretaker at the atmospheric old hotel, he'll have plenty of time to spend reconnecting with his family.",
    narrator: "Campbell Scott",
    rating: 4.8,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-016",
    title: "Annihilation",
    author: "Jeff VanderMeer",
    year: 2014,
    genres: ["Sci-Fi", "Cosmic Horror", "Weird Fiction"],
    tags: ["#AreaX", "#SouthernReach", "#Shimmer", "#Biologist", "#EcologicalHorror"],
    durationHours: 6.0,
    durationMinutes: 360,
    fileSizeBytes: 185 * 1024 * 1024,
    folderPath: "/Audiobooks/Jeff VanderMeer - Annihilation (2014)",
    coverPath: "/Audiobooks/Jeff VanderMeer - Annihilation (2014)/cover.jpg",
    coverUrl: createCoverSvg("Annihilation", "Jeff VanderMeer", "#16A34A", "#064E3B", "brain", "THE SOUTHERN REACH TRILOGY"),
    hasCoverImage: true,
    dominantColor: classifyColor(22, 163, 74), // Toxic Viridian Green #16A34A
    palette: [
      { hex: "#16A34A", colorName: "Area X Flora Green", percentage: 46, rgb: [22, 163, 74] },
      { hex: "#064E3B", colorName: "Lighthouse Murk", percentage: 32, rgb: [6, 78, 59] },
      { hex: "#86EFAC", colorName: "Bioluminescent Spore", percentage: 14, rgb: [134, 239, 172] },
      { hex: "#F43F5E", colorName: "Crawler Cell Pink", percentage: 8, rgb: [244, 63, 94] },
    ],
    description: "Area X has been cut off from the rest of the continent for decades. Nature has reclaimed the last vestiges of human civilization. The twelfth expedition departs.",
    narrator: "Carolyn McCormick",
    series: "Southern Reach Trilogy",
    seriesNumber: 1,
    rating: 4.65,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-017",
    title: "The Man Who Mistook His Wife for a Hat",
    author: "Oliver Sacks",
    year: 1985,
    genres: ["Non-Fiction", "Neuroscience", "Memoir", "Psychology"],
    tags: ["#BrainCases", "#Neurology", "#HumanStories", "#Compassion", "#MedicalClassics"],
    durationHours: 7.5,
    durationMinutes: 450,
    fileSizeBytes: 230 * 1024 * 1024,
    folderPath: "/Audiobooks/Oliver Sacks - The Man Who Mistook His Wife (1985)",
    coverPath: "/Audiobooks/Oliver Sacks - The Man Who Mistook His Wife (1985)/cover.jpg",
    coverUrl: createCoverSvg("The Man Who Mistook...", "Oliver Sacks", "#475569", "#0F172A", "brain", "CLINICAL TALES"),
    hasCoverImage: true,
    dominantColor: classifyColor(71, 85, 105), // Slate Gray #475569
    palette: [
      { hex: "#475569", colorName: "Clinical Slate Gray", percentage: 46, rgb: [71, 85, 105] },
      { hex: "#0F172A", colorName: "Cognitive Dark Void", percentage: 30, rgb: [15, 23, 42] },
      { hex: "#94A3B8", colorName: "Silver Synapse", percentage: 16, rgb: [148, 163, 184] },
      { hex: "#D97706", colorName: "Compassion Gold", percentage: 8, rgb: [217, 119, 6] },
    ],
    description: "Dr. Oliver Sacks recounts the case histories of patients lost in the bizarre, apparent world of neurological disorders.",
    narrator: "Jonathan Davis",
    rating: 4.8,
    audioFormat: "mp3",
    bitrateKbps: 96
  },
  {
    id: "ab-018",
    title: "And Then There Were None",
    author: "Agatha Christie",
    year: 1939,
    genres: ["Mystery", "Classic", "Thriller"],
    tags: ["#IslandMystery", "#TenLittleIndians", "#Whodunit", "#QueenOfCrime", "#LockedRoom"],
    durationHours: 6.2,
    durationMinutes: 372,
    fileSizeBytes: 190 * 1024 * 1024,
    folderPath: "/Audiobooks/Agatha Christie - And Then There Were None (1939)",
    coverPath: "/Audiobooks/Agatha Christie - And Then There Were None (1939)/cover.jpg",
    coverUrl: createCoverSvg("And Then There Were None", "Agatha Christie", "#9A3412", "#431407", "eye", "SOLDIER ISLAND"),
    hasCoverImage: true,
    dominantColor: classifyColor(154, 52, 18), // Terracotta Sienna #9A3412
    palette: [
      { hex: "#9A3412", colorName: "Soldier Island Sienna", percentage: 48, rgb: [154, 52, 18] },
      { hex: "#431407", colorName: "Mansion Shadow Umber", percentage: 32, rgb: [67, 20, 7] },
      { hex: "#F97316", colorName: "Gramophone Brass", percentage: 12, rgb: [249, 115, 22] },
      { hex: "#F3F4F6", colorName: "Sea Spray Mist", percentage: 8, rgb: [243, 244, 246] },
    ],
    description: "Ten strangers are lured to an isolated island mansion off the Devon coast by a mysterious host named U.N. Owen.",
    narrator: "Dan Stevens",
    rating: 4.9,
    audioFormat: "m4b",
    bitrateKbps: 64,
    isFavorite: true
  },
  {
    id: "ab-019",
    title: "A Short History of Nearly Everything",
    author: "Bill Bryson",
    year: 2003,
    genres: ["Non-Fiction", "Science", "History", "Humor"],
    tags: ["#Cosmology", "#Geology", "#QuirkyScientists", "#BigBang", "#AccessibleScience"],
    durationHours: 18.2,
    durationMinutes: 1092,
    fileSizeBytes: 540 * 1024 * 1024,
    folderPath: "/Audiobooks/Bill Bryson - A Short History (2003)",
    coverPath: "/Audiobooks/Bill Bryson - A Short History (2003)/cover.jpg",
    coverUrl: createCoverSvg("Short History of Everything", "Bill Bryson", "#0284C7", "#0369A1", "planet", "FROM BIG BANG TO CIVILIZATION"),
    hasCoverImage: true,
    dominantColor: classifyColor(2, 132, 199), // Cerulean Blue #0284C7
    palette: [
      { hex: "#0284C7", colorName: "Atmospheric Blue", percentage: 50, rgb: [2, 132, 199] },
      { hex: "#0369A1", colorName: "Deep Ocean Trench", percentage: 28, rgb: [3, 105, 161] },
      { hex: "#FACC15", colorName: "Atom Nucleus Gold", percentage: 14, rgb: [250, 204, 21] },
      { hex: "#FFFFFF", colorName: "Ice Sheet White", percentage: 8, rgb: [255, 255, 255] },
    ],
    description: "Bill Bryson describes himself as a reluctant traveler, but even when he stays safely at home he can't stop asking questions about how we got from there to here.",
    narrator: "Richard Matthews",
    rating: 4.85,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-020",
    title: "Dracula",
    author: "Bram Stoker",
    year: 1897,
    genres: ["Classic", "Horror", "Gothic Fiction"],
    tags: ["#Vampire", "#Transylvania", "#Epistolary", "#CountDracula", "#Victorian"],
    durationHours: 15.4,
    durationMinutes: 924,
    fileSizeBytes: 450 * 1024 * 1024,
    folderPath: "/Audiobooks/Bram Stoker - Dracula (1897)",
    coverPath: "/Audiobooks/Bram Stoker - Dracula (1897)/cover.png",
    coverUrl: createCoverSvg("Dracula", "Bram Stoker", "#581C87", "#18181B", "eye", "THE GOTHIC MASTERWORK"),
    hasCoverImage: true,
    dominantColor: classifyColor(88, 28, 135), // Dark Purple #581C87
    palette: [
      { hex: "#581C87", colorName: "Transylvanian Velvet", percentage: 48, rgb: [88, 28, 135] },
      { hex: "#18181B", colorName: "Castle Midnight Noir", percentage: 34, rgb: [24, 24, 27] },
      { hex: "#DC2626", colorName: "Arterial Crimson", percentage: 12, rgb: [220, 38, 38] },
      { hex: "#CBD5E1", colorName: "Full Moon Silver", percentage: 6, rgb: [203, 213, 225] },
    ],
    description: "Jonathan Harker travels to the Carpathian Mountains to assist Count Dracula with real estate transactions, only to find himself trapped in a nightmare.",
    narrator: "Alan Cumming, Tim Curry, full cast",
    rating: 4.8,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-021",
    title: "Piranesi",
    author: "Susanna Clarke",
    year: 2020,
    genres: ["Fantasy", "Literary Fiction", "Mystery"],
    tags: ["#TheHouse", "#Tides", "#Statues", "#Solitude", "#WomenPrizeWinner"],
    durationHours: 6.9,
    durationMinutes: 414,
    fileSizeBytes: 205 * 1024 * 1024,
    folderPath: "/Audiobooks/Susanna Clarke - Piranesi (2020)",
    coverPath: "/Audiobooks/Susanna Clarke - Piranesi (2020)/cover.jpg",
    coverUrl: createCoverSvg("Piranesi", "Susanna Clarke", "#0369A1", "#0284C7", "compass", "THE BEAUTY OF THE HOUSE IS IMMESURABLE"),
    hasCoverImage: true,
    dominantColor: classifyColor(3, 105, 161), // Ocean Slate Blue #0369A1
    palette: [
      { hex: "#0369A1", colorName: "Marble Hall Tides", percentage: 46, rgb: [3, 105, 161] },
      { hex: "#0284C7", colorName: "Courtyard Azure", percentage: 30, rgb: [2, 132, 199] },
      { hex: "#E2E8F0", colorName: "Classical Statue Marble", percentage: 16, rgb: [226, 232, 240] },
      { hex: "#D97706", colorName: "Minotaur Horn Gold", percentage: 8, rgb: [217, 119, 6] },
    ],
    description: "Piranesi lives in the House. Perhaps he always has. In his notebooks, day after day, he makes a clear and careful record of its wonders.",
    narrator: "Chiwetel Ejiofor",
    rating: 4.92,
    audioFormat: "m4b",
    bitrateKbps: 64,
    isFavorite: true
  },
  {
    id: "ab-022",
    title: "Hyperion",
    author: "Dan Simmons",
    year: 1989,
    genres: ["Sci-Fi", "Space Opera", "Classic"],
    tags: ["#Shrike", "#TimeTombs", "#Pilgrimage", "#HugoWinner", "#Cantos"],
    durationHours: 20.8,
    durationMinutes: 1248,
    fileSizeBytes: 610 * 1024 * 1024,
    folderPath: "/Audiobooks/Dan Simmons - Hyperion (1989)",
    coverPath: "/Audiobooks/Dan Simmons - Hyperion (1989)/cover.jpg",
    coverUrl: createCoverSvg("Hyperion", "Dan Simmons", "#4C1D95", "#831843", "sparkles", "THE HYPERION CANTOS"),
    hasCoverImage: true,
    dominantColor: classifyColor(76, 29, 149), // Shrike Violet #4C1D95
    palette: [
      { hex: "#4C1D95", colorName: "Shrike Chrome Violet", percentage: 44, rgb: [76, 29, 149] },
      { hex: "#831843", colorName: "Time Tomb Magenta", percentage: 32, rgb: [131, 24, 67] },
      { hex: "#38BDF8", colorName: "Hegemony Plasma", percentage: 14, rgb: [56, 189, 248] },
      { hex: "#F59E0B", colorName: "Tree Ship Amber", percentage: 10, rgb: [245, 158, 11] },
    ],
    description: "On the world called Hyperion, beyond the reach of galactic law, waits a creature called the Shrike.",
    narrator: "Marc Vietor, Victor Bevine, Allyson Johnson",
    series: "Hyperion Cantos",
    seriesNumber: 1,
    rating: 4.84,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-023",
    title: "Children of Time",
    author: "Adrian Tchaikovsky",
    year: 2015,
    genres: ["Sci-Fi", "Hard Sci-Fi", "Evolutionary Speculation"],
    tags: ["#ArthurCClarkeWinner", "#Portia", "#SpiderEvolution", "#Terraforming", "#GenerationShip"],
    durationHours: 16.0,
    durationMinutes: 960,
    fileSizeBytes: 475 * 1024 * 1024,
    folderPath: "/Audiobooks/Adrian Tchaikovsky - Children of Time (2015)",
    coverPath: "/Audiobooks/Adrian Tchaikovsky - Children of Time (2015)/cover.jpg",
    coverUrl: createCoverSvg("Children of Time", "Adrian Tchaikovsky", "#047857", "#064E3B", "planet", "THE BATTLE FOR GREEN WORLD"),
    hasCoverImage: true,
    dominantColor: classifyColor(4, 120, 87), // Emerald Forest #047857
    palette: [
      { hex: "#047857", colorName: "Portian Silk Green", percentage: 48, rgb: [4, 120, 87] },
      { hex: "#064E3B", colorName: "Canopy Deep Emerald", percentage: 30, rgb: [6, 78, 59] },
      { hex: "#34D399", colorName: "Bio-Phosphor Mint", percentage: 14, rgb: [52, 211, 153] },
      { hex: "#F97316", colorName: "Kern Nanovirus Orange", percentage: 8, rgb: [249, 115, 22] },
    ],
    description: "A race for survival among two worlds—the last remnants of the human race and a new species engineered to inherit a green world.",
    narrator: "Mel Hudson",
    series: "Children of Time",
    seriesNumber: 1,
    rating: 4.88,
    audioFormat: "m4b",
    bitrateKbps: 64
  },
  {
    id: "ab-024",
    title: "The Fellowship of the Ring",
    author: "J.R.R. Tolkien",
    year: 1954,
    genres: ["Fantasy", "Epic Fantasy", "Classic"],
    tags: ["#OneRing", "#MiddleEarth", "#Hobbits", "#Rivendell", "#Masterpiece"],
    durationHours: 19.1,
    durationMinutes: 1146,
    fileSizeBytes: 580 * 1024 * 1024,
    folderPath: "/Audiobooks/J.R.R. Tolkien - The Fellowship of the Ring (1954)",
    coverPath: "/Audiobooks/J.R.R. Tolkien - The Fellowship of the Ring (1954)/cover.jpg",
    coverUrl: createCoverSvg("Fellowship of Ring", "J.R.R. Tolkien", "#B45309", "#15803D", "sword", "THE LORD OF THE RINGS #1"),
    hasCoverImage: true,
    dominantColor: classifyColor(180, 83, 9), // Shire Golden Amber #B45309
    palette: [
      { hex: "#B45309", colorName: "One Ring Golden Amber", percentage: 46, rgb: [180, 83, 9] },
      { hex: "#15803D", colorName: "Shire Meadow Green", percentage: 32, rgb: [21, 128, 61] },
      { hex: "#78350F", colorName: "Old Forest Bark", percentage: 14, rgb: [120, 53, 15] },
      { hex: "#FDE047", colorName: "Elven Starlight Yellow", percentage: 8, rgb: [253, 224, 71] },
    ],
    description: "In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron, the Dark Lord, forged the One Ring.",
    narrator: "Andy Serkis",
    series: "The Lord of the Rings",
    seriesNumber: 1,
    rating: 4.98,
    audioFormat: "m4b",
    bitrateKbps: 64,
    isFavorite: true
  }
];

export const DEFAULT_SAMPLE_AUDIOBOOKS = SAMPLE_AUDIOBOOKS_DATA;

export const SAMPLE_LIBRARIES = [
  {
    name: "Mega Archive (4,700+ Audiobooks • High-Volume Stress Test)",
    path: "/media/audiobooks/curated_mega_archive_4700",
    description: "Massive complete archive spanning over 4,700 audiobooks across every chromatic spectrum, genre, decade, and narrator.",
    getBooks: () => generateLargeLibrary(4720),
    books: SAMPLE_AUDIOBOOKS_DATA // Initial placeholder until generated
  },
  {
    name: "Cosmic Sci-Fi & Speculative Fiction Collection",
    path: "/media/audiobooks/curated_speculative_fiction",
    description: "Deep-space epics, hard science fiction, time loops, and philosophical thought experiments with vibrant neon and obsidian covers.",
    books: SAMPLE_AUDIOBOOKS_DATA.filter(b => b.genres.includes("Sci-Fi") || b.genres.includes("Hard Sci-Fi") || b.genres.includes("Time Travel"))
  },
  {
    name: "Complete Curated Masterpiece Library (24 Core Masterworks)",
    path: "/Users/audiobook_enthusiast/Audiobooks/All_Masterpieces",
    description: "A chromatic spectrum spanning epic fantasy, cosmic horror, investigative non-fiction, philosophy, and modern classics.",
    books: SAMPLE_AUDIOBOOKS_DATA
  },
  {
    name: "Fantasy, Classics & Literary Epics",
    path: "/Volumes/ExternalDrive/Audiobooks/Fantasy_and_Literature",
    description: "High-fantasy sagas, gothic mystery, and classic literary masterworks framed by rich crimson, emerald, and gold cover palettes.",
    books: SAMPLE_AUDIOBOOKS_DATA.filter(b => b.genres.includes("Fantasy") || b.genres.includes("Classic") || b.genres.includes("Horror"))
  }
];

