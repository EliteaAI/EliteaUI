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
import { Provider } from 'react-redux';

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

export const installGlobalStubs = () => {
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
};

export const analyticsTestTheme = createTheme({
  palette: {
    text: { accent: '#000', metrics: '#666', button: { primary: '#fff' } },
    status: { rejected: '#f00', published: '#0f0', pending: '#ff0', draft: '#1976d2' },
    background: {
      userInputBackground: '#fff',
      card: '#fafafa',
      conversation: { hover: '#fafafa' },
    },
    border: { table: '#eee', divider: '#ddd' },
    action: { hover: '#eee' },
    // The shared icon components read palette.icon.fill.<variant> inside their sx
    // functions, so every variant an analytics screen can render needs a value here.
    icon: {
      main: '#888',
      fill: {
        default: '#888',
        primary: '#888',
        secondary: '#fff',
        send: '#888',
        tips: '#4285F4',
        disabled: '#ccc',
        attention: '#f90',
        warning: '#f90',
        error: '#f00',
        success: '#0f0',
        active: '#00f',
        inactive: '#88f',
        delete: '#666',
        button: '#888',
      },
    },
  },
});

/**
 * The analytics screens reach the redux store through @/hooks/useSelectedProject, and the store
 * pulls in api slices that call eliteaApi.enhanceEndpoints(...).injectEndpoints(...) at module
 * scope. None of those endpoints are exercised in these tests, so a self-returning stub is
 * enough to satisfy the chain when a test mocks the '@/api' barrel.
 */
export const createEliteaApiStub = () => {
  const stub = new Proxy(() => stub, {
    get: () => stub,
    apply: () => stub,
  });
  return stub;
};

/**
 * The analytics screens call useSelector directly and through useSelectedProject, so they need a
 * react-redux Provider. The real store cannot be built here (it evaluates slices that match on
 * eliteaApi endpoints the mocked '@/api' barrel never injects), and nothing under test
 * dispatches, so a read-only store double with the two slices these screens read is enough.
 */
// One frozen state object: useSelector compares references, so returning a fresh object per
// getState() call would re-render forever.
const TEST_STATE = Object.freeze({
  user: { personal_project_id: 99 },
  settings: { project: { id: 1, name: 'Test project' } },
});

const testStore = {
  getState: () => TEST_STATE,
  subscribe: () => () => {},
  dispatch: action => action,
};

export const AnalyticsTestWrapper = ({ children }) => (
  <Provider store={testStore}>
    <ThemeProvider theme={analyticsTestTheme}>{children}</ThemeProvider>
  </Provider>
);
