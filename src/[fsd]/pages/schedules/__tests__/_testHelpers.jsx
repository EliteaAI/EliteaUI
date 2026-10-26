/**
 * Shared jsdom stubs and the theme wrapper for the Schedules page tests.
 *
 * Call installGlobalStubs() from vi.hoisted (dynamic import) so the stubs exist
 * before the components under test load: the store reads localStorage at module
 * scope and MUI uses ResizeObserver at render time.
 */
import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import { render } from '@testing-library/react';

export const installGlobalStubs = () => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
};

export const renderWithTheme = ui =>
  render(<ThemeProvider theme={createTheme({ palette: lightPalette })}>{ui}</ThemeProvider>);
