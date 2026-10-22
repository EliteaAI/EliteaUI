// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RunHistorySortableHeader from '../RunHistorySortableHeader';

afterEach(cleanup);

const theme = createTheme({
  palette: { background: { surface: { interactive: { default: '#eee' } } }, border: { lines: '#ccc' } },
});

describe('RunHistorySortableHeader EL-7011 CR-22 review r9', () => {
  it('CR-22 review r9 pads the header like the rows, so header and value columns start at the same x', () => {
    render(
      <ThemeProvider theme={theme}>
        <RunHistorySortableHeader
          headerItems={[{ label: 'Date', type: 'date' }]}
          sortConfig={{ type: 'date', direction: 'asc' }}
          onSort={vi.fn()}
          gridTemplateColumns="1fr"
        />
      </ThemeProvider>,
    );

    // 1 px border + 15 px padding = the 16 px row padding
    expect(screen.getByTestId('run-history-header')).toHaveStyle({
      paddingLeft: '0.9375rem',
      paddingRight: '0.9375rem',
      borderWidth: '0.0625rem',
    });
  });
});
