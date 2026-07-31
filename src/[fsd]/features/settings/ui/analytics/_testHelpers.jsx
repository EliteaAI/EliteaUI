/**
 * Shared jsdom stubs + theme extensions for analytics component tests.
 *
 * Call installGlobalStubs() at the top of a test file BEFORE any vi.mock
 * factory (import order matters — the analytics components pull in
 * slices/settings.js which reads localStorage at module scope, and MUI's
 * TablePagination uses ResizeObserver at render time).
 *
 * Theme provides the custom palette extensions the real app defines
 * (border.table, status.rejected, text.accent, background.card, etc).
 */
import { ThemeProvider, createTheme } from '@mui/material';

const _mkStore = () => {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    clear: () => m.clear(),
  };
};

export function installGlobalStubs() {
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = _mkStore();
  }
  if (typeof globalThis.sessionStorage === 'undefined') {
    globalThis.sessionStorage = _mkStore();
  }
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}

export const analyticsTestTheme = createTheme({
  palette: {
    text: { accent: '#000', metrics: '#666' },
    status: { rejected: '#f00', published: '#0f0', pending: '#ff0' },
    background: { userInputBackground: '#fff', card: '#fafafa' },
    border: { table: '#eee', divider: '#ddd' },
    action: { hover: '#eee' },
  },
});

export const AnalyticsTestWrapper = ({ children }) => (
  <ThemeProvider theme={analyticsTestTheme}>{children}</ThemeProvider>
);
