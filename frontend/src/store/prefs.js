import { create } from 'zustand';

const read = (k, d) => {
  try { return localStorage.getItem(k) ?? d; } catch { return d; }
};

export function applyTheme(theme) {
  const t = theme === 'auto'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#14100d' : '#17120e');
}

export const usePrefs = create((set) => ({
  theme: read('kairos-theme', 'light'),
  setTheme(theme) {
    try { localStorage.setItem('kairos-theme', theme); } catch { /* navigation privee */ }
    applyTheme(theme);
    set({ theme });
  },
}));
