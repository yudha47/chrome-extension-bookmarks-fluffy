import { getAllBookmarks, getBookmarkBarItems, getBookmarkTree, getRealRoots, searchBookmarks, openBookmark, getFaviconUrl } from '../shared/bookmarks.js';
import { getPinned, togglePin, getRecent, onStorageChange } from '../shared/storage.js';
import { applyTheme, toggleTheme } from '../shared/theme.js';

const SVG_PIN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7h1V5H8v2h1z"/></svg>`;
const SVG_PIN_FILLED = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7h1V5H8v2h1z"/></svg>`;
const SVG_FOLDER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
const SVG_CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

let allBookmarks = [];
let pinnedIds = [];
let recentItems = [];
let bookmarkTree = [];
let barItems = [];
let activeTab = 'search';
let debounceTimer = null;

async function init() {
  await applyTheme();
  updateThemeIcon();

  [allBookmarks, pinnedIds, recentItems, bookmarkTree, barItems] = await Promise.all([
    getAllBookmarks(),
    getPinned(),
    getRecent(),
    getBookmarkTree(),
    getBookmarkBarItems(),
  ]);

  renderSearch('');
  renderPinned();
  renderRecent();

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

// ── Theme ──────────────────────────────────────────────────────────────────
function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const btn = document.getElementById('themeToggle');
  btn.innerHTML = isDark
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

// ── Tabs ───────────────────────────────────────────────────────────────────
function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
  if (tabName === 'tree') renderTree();
}

// ── Render: Search ─────────────────────────────────────────────────────────
function renderSearch(query) {
  const list = document.getElementById('searchList');
  const empty = document.getElementById('searchEmpty');
  const count = document.getElementById('resultCount');

  if (!query.trim()) {
    list.innerHTML = '';
    empty.style.display = 'block';
    empty.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;margin-bottom:8px;opacity:.35;display:block;margin-inline:auto"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>Start typing to search`;
    count.textContent = '';
    return;
  }

  const results = searchBookmarks(allBookmarks, query);
  empty.style.display = results.length ? 'none' : 'block';
  if (!results.length) {
    empty.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;margin-bottom:8px;opacity:.35;display:block;margin-inline:auto"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>No results for "${escapeHtml(query)}"`;
    list.innerHTML = '';
    count.textContent = '';
    return;
  }

  count.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
  list.innerHTML = '';
  results.slice(0, 100).forEach((bm) => list.appendChild(createBmItem(bm, query)));
}

// ── Render: Pinned ─────────────────────────────────────────────────────────
// Merges Chrome Bookmark Bar items (auto) + manually pinned items (from storage).
function renderPinned() {
  const grid = document.getElementById('pinnedGrid');
  const empty = document.getElementById('pinnedEmpty');

  const barIds = new Set(barItems.map((b) => b.id));
  const manualPinned = pinnedIds
    .filter((id) => !barIds.has(id))
    .map((id) => allBookmarks.find((b) => b.id === id))
    .filter(Boolean);
  const merged = [...barItems, ...manualPinned];

  if (!merged.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = '';
  merged.forEach((bm) => {
    const isBar = barIds.has(bm.id);
    const chip = document.createElement('div');
    chip.className = 'pin-chip';
    chip.title = bm.title;
    chip.innerHTML = `
      <img src="${getFaviconUrl(bm.url)}" alt="" onerror="this.style.display='none'" />
      <span class="pin-chip-title">${escapeHtml(truncate(bm.title, 20))}</span>
      ${isBar ? '' : `<button class="pin-chip-remove" data-id="${bm.id}" title="Unpin">✕</button>`}
    `;
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.pin-chip-remove')) return;
      openBookmark(bm);
    });
    const removeBtn = chip.querySelector('.pin-chip-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        pinnedIds = await togglePin(bm.id);
        renderPinned();
      });
    }
    grid.appendChild(chip);
  });
}

// ── Render: Recent ─────────────────────────────────────────────────────────
function renderRecent() {
  const list = document.getElementById('recentList');
  const empty = document.getElementById('recentEmpty');
  if (!recentItems.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = '';
  recentItems.forEach((bm) => list.appendChild(createBmItem(bm)));
}

// ── Render: Tree ───────────────────────────────────────────────────────────
function renderTree() {
  const container = document.getElementById('treeContainer');
  if (container.dataset.rendered) return;
  container.dataset.rendered = '1';
  const roots = getRealRoots(bookmarkTree);
  roots.forEach((node) => container.appendChild(renderNode(node)));
}

function renderNode(node) {
  if (node.url) {
    return createBmItem(node);
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'folder-item';

  const childCount = countBookmarks(node);
  const row = document.createElement('div');
  row.className = 'folder-row';
  row.innerHTML = `
    <span class="folder-arrow">${SVG_CHEVRON}</span>
    <span class="folder-icon">${SVG_FOLDER}</span>
    <span class="folder-name">${escapeHtml(node.title || 'Untitled')}</span>
    <span class="folder-count">${childCount}</span>
  `;

  const children = document.createElement('div');
  children.className = 'folder-children';

  let rendered = false;
  row.addEventListener('click', () => {
    const isOpen = children.classList.toggle('open');
    row.querySelector('.folder-arrow').classList.toggle('open', isOpen);
    if (isOpen && !rendered) {
      rendered = true;
      (node.children || []).forEach((child) => children.appendChild(renderNode(child)));
    }
  });

  wrapper.appendChild(row);
  wrapper.appendChild(children);
  return wrapper;
}

function countBookmarks(node) {
  let count = 0;
  function walk(n) {
    if (n.url) { count++; return; }
    (n.children || []).forEach(walk);
  }
  (node.children || []).forEach(walk);
  return count;
}

// ── Bookmark item factory ──────────────────────────────────────────────────
function createBmItem(bm, query = '') {
  const el = document.createElement('div');
  el.className = 'bm-item';
  const pinned = pinnedIds.includes(bm.id);
  const title = query ? highlightMatch(bm.title, query) : escapeHtml(bm.title);
  const urlDisplay = query ? highlightMatch(getDomain(bm.url), query) : getDomain(bm.url);

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

// ── Events ─────────────────────────────────────────────────────────────────
function bindEvents() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
      if (btn.dataset.tab === 'search') {
        document.getElementById('searchInput').focus();
      }
    });
  });

  const input = document.getElementById('searchInput');
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const q = input.value;
      document.getElementById('searchClear').classList.toggle('visible', !!q.trim());
      if (activeTab !== 'search') switchTab('search');
      renderSearch(q);
    }, 50);
  });

  document.getElementById('searchClear').addEventListener('click', () => {
    input.value = '';
    document.getElementById('searchClear').classList.remove('visible');
    renderSearch('');
    input.focus();
  });

  document.getElementById('themeToggle').addEventListener('click', async () => {
    await toggleTheme();
    updateThemeIcon();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { input.value = ''; renderSearch(''); }
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const q = escapeHtml(query.trim());
  return escaped.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
}

init();
