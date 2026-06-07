# Bookmarks Fluffy

> A modern, lightweight Chrome Extension that replaces the default Bookmark Bar with a fast, keyboard-friendly bookmark manager — featuring real-time search, pinned favorites, recent history, and a persistent side panel.

---

## Meta

| Field           | Value                                              |
|-----------------|----------------------------------------------------|
| **Project**     | Bookmarks Fluffy                                   |
| **Version**     | 1.0.0 — Initial Release                            |
| **Author**      | yudhaniagara                                       |
| **Email**       | yudhaniagara27@gmail.com                           |
| **Threads**     | https://www.threads.com/@yudhaniagara              |
| **Platform**    | Google Chrome Extension — Manifest V3              |
| **Stack**       | Vanilla JS · HTML · CSS · ES Modules               |
| **License**     | MIT                                                |
| **Created**     | 2026-06-07 · 13:20 WIB                             |
| **Finished**    | 2026-06-07 · 14:05 WIB                             |
| **Status**      | Stable · Active Development                        |

---

## Background & Motivation

Chrome's default Bookmark Bar has several pain points:

- Takes up vertical screen space permanently
- Difficult to navigate when bookmarks grow beyond a single row
- No search — you must scroll and click through nested folders
- No quick-open keyboard shortcut
- No visual hierarchy or favorites system

**Bookmarks Fluffy** solves all of this by hiding the Bookmark Bar entirely and replacing it with a clean popup and side panel that loads in under 100ms.

---

## Features

### v1.0.0 — Core

| Feature | Description |
|---|---|
| **Global Search** | Real-time search across all bookmark titles and URLs. Debounced at 50ms. Results highlight matched text. Handles 1000+ bookmarks in < 100ms. |
| **Pinned Bookmarks** | Auto-imports Chrome Bookmark Bar items. Additional bookmarks can be pinned manually via hover action. |
| **Recent Opened** | Tracks last 20 bookmarks opened via the extension, with timestamp. |
| **Bookmark Tree** | Full collapsible/expandable folder tree in the Side Panel. Lazy-renders children on expand for performance. |
| **Dark / Light Theme** | Default dark. Toggle via sun/moon icon. Theme persists across sessions via `chrome.storage.local`. |
| **Side Panel** | Persistent panel with 4 tabs: Search · Pinned · Recent · All Bookmarks. |
| **Keyboard Shortcut** | `⌘B` on Mac · `Ctrl+B` on Windows/Linux — opens popup from anywhere. |
| **Favicon Display** | Fetches favicons via Google S2 Favicon API. Falls back to emoji icon on error. |
| **Cross-panel Sync** | Pinned and Recent data sync in real-time between popup and side panel via `chrome.storage.onChanged`. |
| **Author Link** | Footer attribution links to author's Threads profile. |

### v2.0 — Roadmap (Planned)

| Feature | Description |
|---|---|
| **Smart Folders** | Virtual folders auto-grouped by domain, tag, or access frequency |
| **AI Search** | Natural language search — type "open github" → finds github.com |
| **Workspaces** | Group bookmarks by context: Development · Trading · Research · Personal |
| **Bookmark Analytics** | Most opened · Least opened · Recently opened · Unused bookmarks |
| **Bookmark Bar Sync** | Two-way sync: pin/unpin in extension reflects in Chrome Bookmark Bar |
| **Drag & Drop** | Reorder pinned bookmarks via drag |
| **Export / Import** | Export bookmark data as JSON or HTML |

---

## Design System

### Color Palette — Dark Mode (Default)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0f1115` | Page background |
| `--panel` | `#171a21` | Card / input background |
| `--panel-hover` | `#1e2330` | Hover state |
| `--border` | `#272b35` | Borders, dividers |
| `--text` | `#f5f7fa` | Primary text |
| `--text-muted` | `#8b92a5` | Secondary text, labels |
| `--accent` | `#4f8cff` | Links, focus rings, active states |
| `--accent-dim` | `rgba(79,140,255,0.12)` | Highlight background |
| `--danger` | `#ff5f5f` | Remove / destructive actions |
| `--pin-color` | `#f5c542` | Pinned bookmark indicator |

### Color Palette — Light Mode

| Token | Hex |
|---|---|
| `--bg` | `#f4f6fb` |
| `--panel` | `#ffffff` |
| `--panel-hover` | `#eef1f8` |
| `--border` | `#dde1ec` |
| `--text` | `#1a1d26` |
| `--accent` | `#2f6de8` |

### Typography

- **Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`
- **Base size:** 13px
- **Line height:** 1.5
- **Section labels:** 10px · 700 weight · uppercase · 0.08em letter-spacing

### UI Characteristics

- Minimalist dark-first design
- Rounded corners (`--radius-sm: 6px` · `--radius-md: 10px` · `--radius-lg: 14px`)
- Smooth hover transitions at 120ms
- Compact layout — maximum information density
- Thin 4px custom scrollbar
- Inspired by: Arc Browser · Linear · Raycast · Notion

---

## Architecture

### Approach: Hybrid (Popup + Side Panel)

```
Popup (420px)               Side Panel (full height)
──────────────────          ───────────────────────────
Quick launcher              Deep browser
─ Search (autofocus)        ─ Tab: Search
─ Pinned chips              ─ Tab: Pinned (grid)
─ Recent (7 items)          ─ Tab: Recent (20 items)
─ All Bookmarks (flat)      ─ Tab: All (folder tree)
─ → Open Side Panel         ─ Always visible
```

### Data Flow

```
chrome.bookmarks API
      │
      ▼
shared/bookmarks.js ──── getAllBookmarks()
      │                  getBookmarkTree()
      │                  getBookmarkBarItems()   ← Bookmark Bar auto-sync
      │                  searchBookmarks()
      │
chrome.storage.local
      │
      ▼
shared/storage.js ────── getPinned() / togglePin()
      │                  getRecent() / addRecent()
      │                  getTheme() / setTheme()
      │                  onStorageChange()        ← real-time sync
      │
      ├──── popup/popup.js
      └──── sidepanel/sidepanel.js
```

### Chrome APIs Used

| API | Permission | Usage |
|---|---|---|
| `chrome.bookmarks` | `bookmarks` | Read full bookmark tree |
| `chrome.storage.local` | `storage` | Persist pinned, recent, theme |
| `chrome.sidePanel` | `sidePanel` | Open/manage side panel |
| `chrome.tabs` | `tabs` | Open bookmarks in new tab |
| `chrome.commands` | _(built-in)_ | ⌘B / Ctrl+B keyboard shortcut |

---

## Project Structure

```
chrome-extension-bookmarks-fluffy/
│
├── manifest.json                  Chrome Extension manifest (MV3)
│
├── popup/
│   ├── popup.html                 Popup UI — 420px quick launcher
│   ├── popup.js                   Popup logic — search, pinned, recent, all
│   └── popup.css                  Popup styles — design tokens, components
│
├── sidepanel/
│   ├── sidepanel.html             Side panel UI — 4 tabs
│   ├── sidepanel.js               Side panel logic — search, tree, pinned, recent
│   └── sidepanel.css              Side panel styles
│
├── shared/
│   ├── bookmarks.js               Chrome bookmarks API wrapper (shared)
│   ├── storage.js                 chrome.storage.local wrapper (shared)
│   └── theme.js                   Dark/light theme helper (shared)
│
├── background/
│   └── service-worker.js          MV3 service worker — minimal init
│
└── assets/
    ├── icon.svg                   SVG source icon
    ├── icon16.png                 Extension icon 16×16
    ├── icon48.png                 Extension icon 48×48
    ├── icon128.png                Extension icon 128×128
    └── generate-icons.html        Canvas-based PNG icon generator
```

---

## Storage Schema

### Pinned Bookmarks
```json
{
  "pinned": ["bookmarkId1", "bookmarkId2"]
}
```

### Recent Opened
```json
{
  "recent": [
    {
      "id": "bookmarkId",
      "title": "Page Title",
      "url": "https://example.com",
      "openedAt": 1717776000000
    }
  ]
}
```
Max 20 items. Newest first.

### Theme
```json
{
  "theme": "dark"
}
```
Values: `"dark"` | `"light"`

---

## Performance

| Metric | Target | Notes |
|---|---|---|
| Search latency | < 100ms | Native JS array filter + 50ms debounce |
| Popup open | < 150ms | No framework overhead |
| Bookmark tree render | Lazy | Children only rendered on folder expand |
| Storage read | < 10ms | chrome.storage.local — synchronous-equivalent |

---

## Installation

### From Source (Developer Mode)

**Step 1 — Generate PNG icons**

1. Open `assets/generate-icons.html` in Chrome (drag the file into a tab)
2. Click **"Download All Icons"**
3. Save the 3 downloaded PNG files into the `assets/` folder

**Step 2 — Load extension**

1. Open `chrome://extensions`
2. Enable **Developer Mode** (toggle — top right)
3. Click **"Load unpacked"**
4. Select the project root folder: `chrome-extension-bookmarks-fluffy/`
5. The extension appears in Chrome toolbar

**Step 3 — Hide Bookmark Bar (optional)**

Hide Chrome's default Bookmark Bar to reclaim vertical space:

- Mac: `⌘ + Shift + B`
- Windows: `Ctrl + Shift + B`

---

## Usage

| Action | How |
|---|---|
| Open popup | Click extension icon or press `⌘B` / `Ctrl+B` |
| Search bookmarks | Start typing — results appear instantly |
| Open bookmark | Click any bookmark item |
| Pin a bookmark | Hover item → click pin icon |
| Unpin | Hover chip → click ✕ (manual pins only) |
| Open side panel | Click "Open Side Panel →" in popup footer |
| Toggle theme | Click sun/moon icon in header |
| Close search | Press `Escape` |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘B` / `Ctrl+B` | Open popup |
| `Escape` | Clear search / close popup |

---

## Changelog

### v1.0.0 — 2026-06-07

**Initial Release**

- Built Chrome Extension with Manifest V3
- Popup: quick launcher (420px) with search, pinned, recent, all bookmarks
- Side Panel: persistent panel with 4 tabs — Search · Pinned · Recent · All
- Global real-time search with text highlight, debounced at 50ms
- Auto-import Chrome Bookmark Bar items into Pinned section
- Manual pin/unpin bookmarks via hover action
- Recent opened history — max 20 items with timestamp
- Full collapsible bookmark tree with lazy rendering
- Dark/Light theme toggle — persists via `chrome.storage.local`
- Cross-panel real-time sync via `chrome.storage.onChanged`
- Keyboard shortcut `⌘B` / `Ctrl+B` to open popup
- Favicon display via Google S2 Favicon API
- Footer author attribution → Threads @yudhaniagara
- Renamed extension from "Smart Bookmark Manager" to "Bookmarks Fluffy"
- Complete meta tags on all HTML pages (author, version, date, license)
- SVG source icon + Canvas-based PNG icon generator

---

### v1.1.0 — Planned

- Folder chips in Pinned section (show bookmark bar folders, not just bookmarks)
- Keyboard navigation in search results (↑ ↓ Enter)
- Click counter for "Most Opened" analytics groundwork
- Context menu: right-click a tab → "Add to Bookmarks Fluffy"

---

## Technical Notes

**Why Vanilla JS (no React/Vue)?**
Extension popups load in a fresh context every open. Framework overhead (bundle parsing, virtual DOM init) adds 50–200ms of perceived lag. Vanilla JS with ES Modules starts instantly.

**Why ES Modules?**
MV3 supports `type="module"` in both HTML script tags and the service worker. This allows clean `import/export` without a bundler, keeping the dev workflow zero-config.

**Why not store bookmark data locally?**
The extension reads directly from `chrome.bookmarks` on every open, ensuring data is always in sync with Chrome. No risk of stale data, no sync logic needed.

**Bookmark Bar folder ID**
Chrome always assigns folder ID `"1"` to the Bookmark Bar. This is a stable, documented behavior used to auto-populate the Pinned section.

---

## License

MIT License — free to use, modify, and distribute with attribution.

---

## Author

**yudhaniagara**
- Threads: [@yudhaniagara](https://www.threads.com/@yudhaniagara)
- Email: yudhaniagara27@gmail.com

---

*Built with care. No tracking. No analytics. No external dependencies.*
