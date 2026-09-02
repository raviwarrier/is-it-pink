# Is it Pink? (v1.0)
> *What color is your audiobook shelf?*

[![License: MIT](https://img.shields.io/badge/License-MIT-pink.svg)](https://opensource.org/licenses/MIT)
[![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-blue.svg)](#)

<!-- Main Screen Image Placeholder -->
<div align="center">
  <img src="docs/screenshot-main.png" alt="Is it Pink? Main Screen" width="100%" style="border-radius: 12px; border: 1px solid #27272a; margin: 16px 0;" />
  <p><em>Is it Pink? — 3-Level Chromatic Treemap Interface</em></p>
</div>

---

## 💡 Why This?

I always wondered if I was biased towards books of a specific color — i.e., do I tend to buy, download, or listen to audiobooks with covers of a specific color more than others?

I asked in the Audiobookshelf (ABS) community if someone could build a cover color analyzer, but no one did. And now that vibe-coding is a thing, voila! **Is it Pink?** was born.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/raviwarrier/is-it-pink.git
cd is-it-pink
npm install
```

### 2. Run in Development
```bash
npm run dev
```
Open [http://localhost:4260](http://localhost:4260) (or your configured `$PORT`) in your browser.

### 3. Build & Run for Production
```bash
npm run build
npm start
```

---

## ⚙️ Port Configuration

By default, the server runs on port **`4260`** to avoid port collisions with other local Node.js / web services running on port `3000`.

To run on a custom port, set the `PORT` environment variable:
```bash
PORT=4260 npm start
# or in Windows PowerShell:
# $env:PORT=4260; npm start
```

---

## 🚀 Running with PM2 (`ecosystem.config.cjs`)

If you run multiple self-hosted services via **PM2**:

1. Open `ecosystem.config.cjs` and set `cwd` to the absolute path of your clone (e.g. `/home/user/is-it-pink` or `C:/apps/is-it-pink`):
   ```javascript
   module.exports = {
     apps: [
       {
         name: "is-it-pink",
         cwd: "/path/to/is-it-pink", // <-- Update this path
         script: "./dist/server.cjs",
         exec_mode: "fork",
         env: {
           NODE_ENV: "production",
           PORT: 4260
         }
       }
     ]
   };
   ```
2. Build and launch:
   ```bash
   npm run build
   pm2 start ecosystem.config.cjs
   pm2 save
   ```

---

## 🐳 Docker

```bash
docker build -t is-it-pink .
docker run -d -p 4260:4260 -e PORT=4260 --name is-it-pink is-it-pink
```

---

## 📄 License

MIT License © 2026. Free and open source for the audiobook community.
