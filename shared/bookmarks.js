/**
 * Flatten bookmark tree into array for fast search.
 * @param {chrome.bookmarks.BookmarkTreeNode[]} nodes
 * @param {Object[]} result
 */
function flattenTree(nodes, result = []) {
  for (const node of nodes) {
    if (node.url) {
      result.push({ id: node.id, title: node.title, url: node.url, parentId: node.parentId });
    }
    if (node.children) {
      flattenTree(node.children, result);
    }
  }
  return result;
}

/**
 * Get full bookmark tree from Chrome.
 * @returns {Promise<chrome.bookmarks.BookmarkTreeNode[]>}
 */
export async function getBookmarkTree() {
  return new Promise((resolve) => chrome.bookmarks.getTree(resolve));
}

/**
 * Get flat list of all bookmarks (no folders).
 * @returns {Promise<Object[]>}
 */
export async function getAllBookmarks() {
  const tree = await getBookmarkTree();
  return flattenTree(tree);
}

/**
 * Search bookmarks by query against title and url.
 * Target: <100ms for 1000 items.
 * @param {Object[]} bookmarks - flat bookmark list
 * @param {string} query
 * @returns {Object[]}
 */
export function searchBookmarks(bookmarks, query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  return bookmarks.filter(
    (b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)
  );
}

/**
 * Open a bookmark in a new tab and record it in recent history.
 * @param {Object} bookmark - { id, title, url }
 */
export async function openBookmark(bookmark) {
  chrome.tabs.create({ url: bookmark.url });
  const { addRecent } = await import('./storage.js');
  await addRecent(bookmark);
}

/**
 * Extract root folders + their children for tree rendering.
 * Skips the invisible root wrapper nodes (id "0", "1", "2").
 * @param {chrome.bookmarks.BookmarkTreeNode[]} tree
 * @returns {chrome.bookmarks.BookmarkTreeNode[]}
 */
export function getRealRoots(tree) {
  const roots = [];
  function collect(nodes) {
    for (const node of nodes) {
      if (node.children) {
        // id 0 is the root container — skip it, collect its children
        if (node.id === '0') {
          collect(node.children);
        } else {
          roots.push(node);
        }
      }
    }
  }
  collect(tree);
  return roots;
}

/**
 * Get direct bookmark children of the Chrome Bookmark Bar (folder id "1").
 * Folders inside the bar are ignored — only bookmarks with URLs are returned.
 * @returns {Promise<chrome.bookmarks.BookmarkTreeNode[]>}
 */
export async function getBookmarkBarItems() {
  return new Promise((resolve) => {
    chrome.bookmarks.getChildren('1', (items) => {
      resolve((items || []).filter((b) => b.url));
    });
  });
}

/**
 * Get favicon URL for a bookmark URL.
 * @param {string} url
 * @returns {string}
 */
export function getFaviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=16`;
  } catch {
    return '';
  }
}
