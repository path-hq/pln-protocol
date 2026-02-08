# PLN Protocol Promo Video

60-second promotional video for PATH Liquidity Network hackathon submission.

## Structure (60 seconds)

| Time | Section | Content |
|------|---------|---------|
| 0-6s | Intro | PLN Protocol logo, tagline, 14%+ APY hook |
| 6-10s | Problem | Split screen: Human (idle USDC) vs Agent (no credit) |
| 10-20s | Live Demo | IFrame capture of pln-protocol.vercel.app |
| 20-32s | How It Works | 3 steps: Deposit → Auto-route → Watch grow |
| 32-42s | Safety & APY | Big 14.2% number + 3 safety icons |
| 42-60s | CTA | Pulsing button + URL |

## Design System

- **Background:** #000000 (pure black)
- **Accent:** #00FFB8 (neon teal)
- **Typography:** IBM Plex Sans + IBM Plex Mono
- **Animations:** Smooth fades, slides, neon glows

## How to Run

### 1. Install dependencies
```bash
cd video
npm install
```

### 2. Preview (dev mode)
```bash
npm run dev
```
Opens player at http://localhost:3000

### 3. Render final video
```bash
npm run build
```
Outputs to `out/video.mp4` (1920x1080, 30fps, 60s)

## Key Features

✅ **IFrame Integration:** Captures live website (pln-protocol.vercel.app) at 10-20s mark
✅ **Neon Glow Effects:** Teal (#00FFB8) accents with animated shadows
✅ **Smooth Transitions:** Using Remotion's interpolate() for fades and slides
✅ **60 Seconds Exactly:** Optimized for hackathon/demo requirements

## Files

- `src/Video.tsx` — Root composition (exports PLNPromo)
- `src/PLNPromo.tsx` — Main video component with all sections
- `package.json` — Dependencies (remotion, react)

## Notes

- The IFrame section (10-20s) captures the live site automatically during render
- If site blocks iframe, that section will show blank (test first in browser)
- Rendering requires Chrome/Chromium (Puppeteer under the hood)
- Final output: 60s MP4, ~10-20MB depending on encoding