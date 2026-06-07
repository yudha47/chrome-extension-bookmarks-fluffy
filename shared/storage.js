const RECENT_MAX = 20;

function get(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function set(data) {
  return new Promise((resolve) => chrome.storage.local.set(data, resolve));
}

// --- Pinned ---

export async function getPinned() {
  const data = await get({ pinned: [] });
  return data.pinned;
}

export async function setPinned(ids) {
  await set({ pinned: ids });
}

export async function togglePin(bookmarkId) {
  const pinned = await getPinned();
  const idx = pinned.indexOf(bookmarkId);
  if (idx === -1) {
    pinned.unshift(bookmarkId);
  } else {
    pinned.splice(idx, 1);
  }
  await setPinned(pinned);
  return pinned;
}

export async function isPinned(bookmarkId) {
  const pinned = await getPinned();
  return pinned.includes(bookmarkId);
}

// --- Recent ---

export async function getRecent() {
  const data = await get({ recent: [] });
  return data.recent;
}

export async function addRecent(bookmark) {
  const recent = await getRecent();
  const filtered = recent.filter((r) => r.id !== bookmark.id);
  filtered.unshift({
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    openedAt: Date.now(),
  });
  await set({ recent: filtered.slice(0, RECENT_MAX) });
}

// --- Theme ---

export async function getTheme() {
  const data = await get({ theme: 'dark' });
  return data.theme;
}

export async function setTheme(theme) {
  await set({ theme });
}

// --- Listen for external storage changes ---

export function onStorageChange(callback) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') callback(changes);
  });
}
