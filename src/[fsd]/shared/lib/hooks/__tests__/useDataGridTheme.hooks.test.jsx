// @vitest-environment jsdom
import { memo } from 'react';

import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, renderHook, screen } from '@testing-library/react';

import { useDataGridTheme } from '../useDataGridTheme.hooks';

const ROWS = [{ id: 1, name: 'Decision' }];
const COLUMNS = [{ field: 'name', headerName: 'Name' }];

const GridWithDataGridTheme = memo(() => {
  const dataGridTheme = useDataGridTheme();

  return (
    <ThemeProvider theme={dataGridTheme}>
      <DataGrid
        rows={ROWS}
        columns={COLUMNS}
      />
    </ThemeProvider>
  );
});

GridWithDataGridTheme.displayName = 'GridWithDataGridTheme';

const buildWrapper = theme => {
  const Wrapper = memo(props => {
    const { children } = props;

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  });

  Wrapper.displayName = 'Wrapper';

  return Wrapper;
};

describe('useDataGridTheme', () => {
  afterEach(() => cleanup());

  describe.each(['dark', 'light'])('%s app theme', mode => {
    const appTheme = createTheme(getDesignTokens(mode));

    it('flattens background.default to the secondary surface colour', () => {
      const { result } = renderHook(() => useDataGridTheme(), { wrapper: buildWrapper(appTheme) });

      expect(result.current.palette.background.default).toBe(appTheme.palette.background.default.secondary);
    });

    it('lets a DataGrid render without throwing', () => {
      render(
        <ThemeProvider theme={appTheme}>
          <GridWithDataGridTheme />
        </ThemeProvider>,
      );

      expect(screen.getByText('Decision')).toBeInTheDocument();
    });
  });

  it('keeps background.default when it is already a colour string', () => {
    const plainTheme = createTheme({ palette: { background: { default: '#101010' } } });
    const { result } = renderHook(() => useDataGridTheme(), { wrapper: buildWrapper(plainTheme) });

    expect(result.current.palette.background.default).toBe('#101010');
  });
});
