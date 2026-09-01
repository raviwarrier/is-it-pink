# Is it Pink?
> *What color is your audiobook shelf?*

[![License: MIT](https://img.shields.io/badge/License-MIT-pink.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![D3](https://img.shields.io/badge/D3-Hierarchy-f9a03f.svg)](https://d3js.org/)

<!-- Main Screen Image Placeholder -->
<div align="center">
  <img src="docs/screenshot-main.png" alt="Is it Pink? Audiobook Chromatic Treemap Interface" width="100%" style="border-radius: 12px; border: 1px solid #27272a; margin: 16px 0;" />
  <p><em>Interactive Chromatic Treemap & Audiobookshelf Intelligence Visualizer</em></p>
</div>

**Is it Pink?** is an interactive, chromatic treemap visualizer and reading intelligence dashboard for audiobook lovers, curatorial archivists, and Audiobookshelf self-hosters. It transforms cover art into an explorable, multi-level color spectrum weighted by duration, file size, or book count.

---

## ✨ Features

- **🌈 Flagship Cover Spectrum Treemap (3-Level Hierarchy)**
  - **Level 1 (Pure Color Spectrum)**: Distraction-free, radiant chromatic blocks grouped by broad spectral families (**VIBGYOR** — Violet, Indigo, Blue, Green, Yellow, Orange & Brown, Red — plus **Pink, White & Light Gray, and Black & Dark Gray**), preserving distinct hex nuances without title clutter.
  - **Level 2 (Collection List & Grid)**: Click any color cluster to drill down into book titles, authors, durations, genres, and cover thumbnails.
  - **Level 3 (Audiobook Inspector)**: In-depth metadata viewer with RGB/HSL breakdown, palette swatches, and chapter details.
  - **Render Style Toggle**: Switch seamlessly between **Solid Colors** and **Cover Blend** modes.

- **📱 iPhone-Style Mode Switch**
  - **Library Mode**: Explore your entire scanned filesystem collection.
  - **My Shelf Mode**: Focus exclusively on your finished/read audiobooks with tailored reading analytics.

- **🔒 Zero-Trace Audiobookshelf Integration**
  - Connect your Audiobookshelf server to sync your personal Read list.
  - **Zero Disk Persistence**: API tokens and read history are processed purely in ephemeral server memory to proxy CORS requests and are immediately purged on disconnect or tab close.

- **📊 Multi-Faceted Treemaps & Chromatic Analytics**
  - Group and subdivide your library by **Genre**, **Author**, **Release Decade**, **Narrator**, **Audio Format**, and **Duration Tier**.
  - Deep analytics covering color prevalence, hue vs. length correlation, and genre chromatic signatures.

- **🎨 Social Post Studio & High-Res Infographic Export**
  - Export 4K PNG canvas infographics, download structured JSON/CSV library manifests, and generate AI-assisted social summaries.

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+ or **pnpm** / **yarn** / **bun**
- (Optional) **Docker** & **Docker Compose**

---

### Option 1: Running with npm (Standard Node.js)

#### 1. Clone the repository
```bash
git clone https://github.com/your-username/is-it-pink.git
cd is-it-pink
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure environment (Optional)
```bash
cp .env.example .env
```
*(Optional: Provide `GEMINI_API_KEY` if you want AI-assisted social media post generation).*

#### 4. Run in Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 5. Build and Run in Production Mode
```bash
npm run build
npm start
```

---

### Option 2: Running with PM2 (Production Process Manager)

[PM2](https://pm2.keymetrics.io/) ensures background execution, automatic clustering, and auto-restart on system boot.

#### 1. Install PM2 globally
```bash
npm install -g pm2
```

#### 2. Build the application
```bash
npm install
npm run build
```

#### 3. Start with PM2
Using the included `ecosystem.config.cjs`:
```bash
pm2 start ecosystem.config.cjs
```
Or directly:
```bash
pm2 start dist/server.cjs --name "is-it-pink" -i max
```

#### 4. Monitor & Manage PM2
```bash
# View live logs
pm2 logs is-it-pink

# View real-time metrics
pm2 monit

# Save process list for system reboot
pm2 save
pm2 startup
```

---

### Option 3: Running with Docker & Docker Compose

#### Using Docker Compose (Recommended)
1. Edit `docker-compose.yml` to mount your local audiobook folder (optional):
   ```yaml
   volumes:
     - /your/audiobook/directory:/media/audiobooks:ro
   ```

2. Launch the container:
   ```bash
   docker compose up -d --build
   ```
3. Access the web interface at `http://localhost:3000`.

#### Using standalone Docker CLI
```bash
# Build Docker image
docker build -t is-it-pink .

# Run Docker container
docker run -d \
  --name is-it-pink \
  -p 3000:3000 \
  -v /path/to/audiobooks:/media/audiobooks:ro \
  is-it-pink
```

---

## 🔄 Updation & Maintenance Steps

### Updating via npm / Git
```bash
# 1. Pull the latest release
git pull origin main

# 2. Install any updated dependencies
npm install

# 3. Rebuild the frontend bundle and server bundle
npm run build

# 4. Restart your Node process
npm start
```

### Updating via PM2 (Zero-Downtime Reload)
```bash
# 1. Pull changes and rebuild
git pull origin main
npm install
npm run build

# 2. Gracefully reload cluster workers with zero downtime
pm2 reload is-it-pink --update-env
```

### Updating via Docker
```bash
# 1. Pull changes
git pull origin main

# 2. Rebuild and restart containers
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 🛡️ Privacy & Zero-Trace Architecture

- **No Remote Database**: Scanned folder manifests and local audiobooks remain within your private network.
- **Audiobookshelf Key Ephemerality**: ABS tokens are passed in volatile memory headers directly to your ABS instance. They are never written to disk, databases, or cookies, and are immediately flushed upon disconnection.

---

## 🔮 Vibe-Coded Disclosure

> **Crafted with Human Vision & Agentic AI Pair-Programming.**
> 
> *Is it Pink?* was vibe-coded using modern autonomous coding agents, state-of-the-art LLMs, and direct human-in-the-loop architectural direction. Every visual calculation — from D3 treemap squaring and HSV chromatic cluster sorting to nested border radius math and zero-trace proxy routing — was curated and vetted for performance, type safety, and aesthetic delight.

---

## 📄 License

Distributed under the [MIT License](LICENSE). Copyright &copy; 2026 Is it Pink? Contributors.
