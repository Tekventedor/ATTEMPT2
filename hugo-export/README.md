# Trading Dashboard - Hugo Export

Complete static export system for embedding your Flowhunt AI Trading Bot dashboard in any Hugo website.

## 🚀 Quick Start

### 1. Generate Dashboard Export

```bash
# From project root, run:
npm run hugo:update
```

This will:
- ✅ Fetch latest trading data from Alpaca API
- ✅ Build dashboard bundle with all charts (includes Recharts)
- ✅ Output files to `hugo-export/static/trading-dashboard/`

### 2. Preview Locally

```bash
npm run preview:hugo
```

Then open: **http://localhost:3001/dashboard-new.html**

### 3. Deploy to Hugo Site

```bash
# Copy files to your Hugo site
cp -r hugo-export/layouts YOUR_HUGO_SITE/
cp -r hugo-export/static/trading-dashboard YOUR_HUGO_SITE/static/
```

### 4. Use in Hugo Pages

Add this to any Hugo markdown file:

```markdown
---
title: "My Trading Dashboard"
---

{{< trading-dashboard >}}
```

---

## 📁 File Structure

```
hugo-export/
├── layouts/
│   └── shortcodes/
│       └── trading-dashboard.html    # Hugo shortcode
├── static/
│   └── trading-dashboard/
│       ├── dashboard-new.html        # ✅ Main HTML file (use this!)
│       ├── dashboard-bundle.js       # Bundled component (1MB, self-contained)
│       ├── snapshot.json             # Your trading data
│       └── dashboard.html            # Old version (deprecated)
└── README.md                         # This file
```

**Use `dashboard-new.html`** - it has all the charts and works without CDN issues!

---

## ✨ What's Included

### Dashboard Features
- 📊 **4 Live Stats Cards** - Balance, Return, Market Exposure, Available Cash
- 📈 **Stock Performance Chart** - Multi-line chart showing each position's performance
- 📉 **Portfolio Value Chart** - Historical value with trade markers
- 🥧 **Agent Distribution Chart** - Pie chart of position allocation
- 📊 **AI vs S&P 500 Chart** - Performance comparison
- 📋 **Positions Table** - Current holdings with P&L
- 📝 **Activity Log** - Recent trades

### Technical Details
- **Self-contained bundle** - Recharts is bundled (no CDN issues!)
- **React 18** from CDN (unpkg)
- **Tailwind CSS** from CDN
- **Static snapshot** - Data frozen at generation time
- **1MB total** - Dashboard bundle includes everything

---

## 🔧 NPM Commands

| Command | Description |
|---------|-------------|
| `npm run hugo:update` | **Main command** - Fetch data + build everything |
| `npm run export:hugo` | Same as hugo:update (alias) |
| `npm run preview:hugo` | Preview at http://localhost:3001 |

---

## ⚙️ Configuration

### Environment Variables

Create/edit `.env` in project root:

```env
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret
TWELVE_DATA_API_KEY=your_twelve_data_key  # Optional for S&P 500 data
```

The scripts automatically load these using `dotenv`.

---

## 🎯 Hugo Integration

### Shortcode Usage

The generated shortcode uses an iframe:

```html
<div class="trading-dashboard-wrapper">
  <iframe
    src="/trading-dashboard/dashboard-new.html"
    style="width: 100%; min-height: 1000px; border: none;"
    title="Trading Dashboard">
  </iframe>
</div>
```

### Customization

**Adjust height:**
Edit `hugo-export/layouts/shortcodes/trading-dashboard.html` and change `min-height`.

**Update data:**
Re-run `npm run hugo:update` anytime to refresh with latest trading data.

---

## 🐛 Troubleshooting

### Charts not showing

**Problem:** Dashboard loads but charts are blank
**Solution:** Make sure you're using `dashboard-new.html` (not `dashboard.html`)

### "Cannot read properties of undefined"

**Problem:** Dashboard shows errors in console
**Solution:**
1. Run `npm run hugo:update` to regenerate
2. Clear browser cache
3. Make sure you're serving over HTTP (not `file://`)

### Old data showing

**Solution:**
```bash
npm run hugo:update   # Fetch latest data and rebuild everything
```
Then hard-refresh your browser (Ctrl+Shift+R)

### "Alpaca API credentials not configured"

**Solution:** Add API keys to `.env` file in project root:
```env
ALPACA_API_KEY=your_key
ALPACA_SECRET_KEY=your_secret
TWELVE_DATA_API_KEY=your_key
```

### Preview server won't start

**Solution:**
```bash
# Kill any existing server
pkill -f "serve hugo-export"

# Start fresh
npm run preview:hugo
```

---

## 🔐 Security Notes

- ⚠️ **API keys** are only used during `npm run snapshot` (server-side)
- ⚠️ **Snapshot data** contains your trading info in plain text
- ⚠️ **Generated files** contain NO API keys
- 💡 Add `snapshot.json` to `.gitignore` if your repo is public

---

## 📊 Data Flow

```
npm run hugo:update
    ↓
Alpaca API (fetch data)
    ↓
snapshot.json (saved directly to hugo-export/)
    ↓
dashboard-bundle.js (component bundled)
    ↓
dashboard-new.html (loads bundle + data)
    ↓
Your Hugo Site
```

**Note:** All steps happen in one command - no intermediate files!

---

## ✅ Success Checklist

When you open the preview, you should see:

- [ ] Header: "Flowhunt AI Trading Bot"
- [ ] 4 stat cards with your account data
- [ ] Stock Performance chart (colorful multi-line chart)
- [ ] Activity log with recent trades
- [ ] Portfolio Value chart (blue line with trade markers)
- [ ] Agent Distribution pie chart (colorful slices)
- [ ] AI vs S&P 500 comparison (purple + cyan lines)
- [ ] Positions table with all holdings
- [ ] No console errors (except harmless Tailwind warning)

**If all boxes are checked - you're ready to deploy!** 🎊

---

## 🔄 Update Workflow

To update your Hugo site with fresh data:

```bash
# 1. Generate new export (fetches data + builds bundle automatically)
npm run hugo:update

# 2. Copy to Hugo site (only 2 files need updating)
cp hugo-export/static/trading-dashboard/dashboard-bundle.js YOUR_HUGO_SITE/static/trading-dashboard/
cp hugo-export/static/trading-dashboard/snapshot.json YOUR_HUGO_SITE/static/trading-dashboard/

# 3. Rebuild Hugo
cd YOUR_HUGO_SITE
hugo

# 4. Deploy
# (your deployment process)
```

**Tip:** The first time, copy the entire `hugo-export/` folder. After that, only update the 2 files above!

---

## 🎨 Customization

### Dashboard Styling

The dashboard uses Tailwind CSS. To customize:

1. Edit `src/components/StaticDashboard.tsx`
2. Rebuild: `npm run build:bundle`
3. Re-export: `npm run hugo:update`

### Chart Colors

Colors are defined in `StaticDashboard.tsx`:
```typescript
const COLORS = [
  '#8b5cf6',  // Purple
  '#22d3ee',  // Cyan
  '#f59e0b',  // Amber
  '#10b981',  // Green
  // ...
];
```

---

## 📝 Technical Details

### Bundle Contents

`dashboard-bundle.js` includes:
- Full StaticDashboard component
- Recharts library (bundled, not from CDN)
- date-fns formatting utilities
- All chart components

### Dependencies (from CDN)
- React 18 (UMD)
- ReactDOM 18 (UMD)
- Tailwind CSS

### Browser Compatibility
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ All modern browsers

---

## 🆘 Support

For issues:
1. Check this README
2. Run `npm run preview:hugo` to test locally
3. Check browser console for errors
4. Verify environment variables are set

---

## 🎉 You're All Set!

Run `npm run hugo:update && npm run preview:hugo` to see your dashboard with all charts!
