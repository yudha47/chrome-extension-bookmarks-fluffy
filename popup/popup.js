import { getAllBookmarks, getBookmarkBarItems, searchBookmarks, openBookmark, getFaviconUrl } from '../shared/bookmarks.js';
import { getPinned, togglePin, getRecent, onStorageChange } from '../shared/storage.js';
import { applyTheme, toggleTheme } from '../shared/theme.js';

// ── SVG icons ──────────────────────────────────────────────────────────────
const SVG_PIN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7h1V5H8v2h1z"/></svg>`;
const SVG_PIN_FILLED = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7h1V5H8v2h1z"/></svg>`;

let allBookmarks = [];
let pinnedIds = [];
let recentItems = [];
let barItems = [];
let debounceTimer = null;

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  await applyTheme();
  updateThemeIcon();
  detectPlatform();

  [allBookmarks, pinnedIds, recentItems, barItems] = await Promise.all([
    getAllBookmarks(),
    getPinned(),
    getRecent(),
    getBookmarkBarItems(),
  ]);

  renderPinned();
  renderRecent();
  renderAll();

  document.getElementById('searchInput').focus();

  bindEvents();

  onStorageChange((changes) => {
    if (changes.pinned) {
      pinnedIds = changes.pinned.newValue;
      renderPinned();
    }
    if (changes.recent) {
      recentItems = changes.recent.newValue;
      renderRecent();
    }
  });
}

// ── Platform detection for shortcut label ─────────────────────────────────
function detectPlatform() {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  document.getElementById('searchKbd').textContent = isMac ? '⌘B' : 'Ctrl+B';
}

// ── Theme ──────────────────────────────────────────────────────────────────
function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const btn = document.getElementById('themeToggle');
  btn.innerHTML = isDark
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

// ── Render: Pinned ─────────────────────────────────────────────────────────
// Merges Chrome Bookmark Bar items (auto) + manually pinned items (from storage).
function renderPinned() {
  const container = document.getElementById('pinnedList');

  // Build merged list: bar items first, then manually pinned not already in bar
  const barIds = new Set(barItems.map((b) => b.id));
  const manualPinned = pinnedIds
    .filter((id) => !barIds.has(id))
    .map((id) => allBookmarks.find((b) => b.id === id))
    .filter(Boolean);
  const merged = [...barItems, ...manualPinned];

  if (!merged.length) {
    container.innerHTML = `<span class="pinned-empty">Hover a bookmark and click ★ to pin</span>`;
    return;
  }

  container.innerHTML = '';
  merged.forEach((bm) => {
    const isBar = barIds.has(bm.id);
    const chip = document.createElement('div');
    chip.className = 'pin-chip';
    chip.title = bm.title;
    chip.innerHTML = `
      <img src="${getFaviconUrl(bm.url)}" alt="" onerror="this.style.display='none'" />
      <span class="pin-chip-title">${escapeHtml(truncate(bm.title, 18))}</span>
      ${isBar ? '' : `<button class="pin-chip-remove" title="Unpin" data-id="${bm.id}">✕</button>`}
    `;
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.pin-chip-remove')) return;
      openBookmark(bm);
      window.close();
    });
    const removeBtn = chip.querySelector('.pin-chip-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        pinnedIds = await togglePin(bm.id);
        renderPinned();
      });
    }
    container.appendChild(chip);
  });
}

// ── Render: Recent ─────────────────────────────────────────────────────────
function renderRecent() {
  const container = document.getElementById('recentList');
  const empty = document.getElementById('recentEmpty');
  const display = recentItems.slice(0, 7);
  if (!display.length) {
    container.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  container.innerHTML = '';
  display.forEach((bm) => {
    container.appendChild(createBookmarkItem(bm, false));
  });
}

// ── Render: All Bookmarks ──────────────────────────────────────────────────
function renderAll() {
  const container = document.getElementById('allList');
  const countEl = document.getElementById('allCount');
  container.innerHTML = '';
  countEl.textContent = allBookmarks.length;
  allBookmarks.forEach((bm) => {
    container.appendChild(createBookmarkItem(bm, false));
  });
}

// ── Bookmark item factory ──────────────────────────────────────────────────
function createBookmarkItem(bm, highlight = false, query = '') {
  const el = document.createElement('div');
  el.className = 'bm-item';
  const pinned = pinnedIds.includes(bm.id);

  const title = highlight ? highlightMatch(bm.title, query) : escapeHtml(bm.title);
  const urlDisplay = highlight ? highlightMatch(getDomain(bm.url), query) : getDomain(bm.url);

  el.innerHTML = `
    <img class="bm-favicon" src="${getFaviconUrl(bm.url)}" alt=""
         onerror="this.outerHTML='<span class=bm-favicon-fallback>🔗</span>'" />
    <div class="bm-info">
      <div class="bm-title">${title}</div>
      <div class="bm-url">${urlDisplay}</div>
    </div>
    <div class="bm-actions">
      <button class="bm-action-btn ${pinned ? 'pinned' : ''}" title="${pinned ? 'Unpin' : 'Pin'}" data-pin="${bm.id}">
        ${pinned ? SVG_PIN_FILLED : SVG_PIN}
      </button>
    </div>
  `;

  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-pin]')) return;
    openBookmark(bm);
    window.close();
  });

  el.querySelector('[data-pin]').addEventListener('click', async (e) => {
    e.stopPropagation();
    pinnedIds = await togglePin(bm.id);
    renderPinned();
    const btn = e.currentTarget;
    const nowPinned = pinnedIds.includes(bm.id);
    btn.classList.toggle('pinned', nowPinned);
    btn.title = nowPinned ? 'Unpin' : 'Pin';
    btn.innerHTML = nowPinned ? SVG_PIN_FILLED : SVG_PIN;
  });

  return el;
}

// ── Search ─────────────────────────────────────────────────────────────────
function runSearch(query) {
  const searchResults = document.getElementById('searchResults');
  const defaultView = document.getElementById('defaultView');
  const searchList = document.getElementById('searchList');
  const searchEmpty = document.getElementById('searchEmpty');
  const resultCount = document.getElementById('resultCount');
  const clearBtn = document.getElementById('searchClear');

  if (!query.trim()) {
    searchResults.classList.remove('visible');
    defaultView.classList.remove('hidden');
    clearBtn.classList.remove('visible');
    return;
  }

  clearBtn.classList.add('visible');
  searchResults.classList.add('visible');
  defaultView.classList.add('hidden');

  const results = searchBookmarks(allBookmarks, query);
  searchList.innerHTML = '';

  if (!results.length) {
    searchEmpty.style.display = 'block';
    resultCount.textContent = '';
    return;
  }

  searchEmpty.style.display = 'none';
  resultCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
  results.slice(0, 50).forEach((bm) => {
    searchList.appendChild(createBookmarkItem(bm, true, query));
  });
}

// ── Events ─────────────────────────────────────────────────────────────────
function bindEvents() {
  const input = document.getElementById('searchInput');

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(input.value), 50);
  });

  document.getElementById('searchClear').addEventListener('click', () => {
    input.value = '';
    runSearch('');
    input.focus();
  });

  document.getElementById('themeToggle').addEventListener('click', async () => {
    await toggleTheme();
    updateThemeIcon();
  });

  document.getElementById('clearRecent').addEventListener('click', async () => {
    const { setTheme } = await import('../shared/storage.js');
    await chrome.storage.local.set({ recent: [] });
    recentItems = [];
    renderRecent();
  });

  document.getElementById('openPanel').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  });

  // Keyboard: Escape clears search
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (input.value) {
        input.value = '';
        runSearch('');
      } else {
        window.close();
      }
    }
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const q = escapeHtml(query.trim());
  return escaped.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
}

init();
