import { getTheme, setTheme } from './storage.js';

export async function applyTheme(root = document.documentElement) {
  const theme = await getTheme();
  root.setAttribute('data-theme', theme);
  return theme;
}

export async function toggleTheme(root = document.documentElement) {
  const current = root.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  await setTheme(next);
  return next;
}
