// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import GridTableHeader from '../GridTableHeader';

// EL-7011 QA 2026-10-21 table width: the compact density narrows the header padding; the default stays

const COLUMNS = [
  { field: 'name', label: 'Name & Description', sortable: true },
  { field: 'owner', label: 'Owner' },
];

const renderHeader = props =>
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <GridTableHeader
        columns={COLUMNS}
        onSort={() => {}}
        showCheckbox={false}
        columnTestIdPrefix="t"
        {...props}
      />
    </ThemeProvider>,
  );

afterEach(() => cleanup());

describe('EL-7011 GridTableHeader density', () => {
  it('keeps the 0.75 rem cell padding and no label title by default', () => {
    renderHeader();
    const cell = screen.getByTestId('t-column-header-owner');
    expect(getComputedStyle(cell).paddingLeft).toBe('0.75rem');
    expect(getComputedStyle(cell).paddingRight).toBe('0.75rem');
    expect(screen.getByText('Owner')).not.toHaveAttribute('title');
  });

  it('uses 0.5 rem cell padding and a label title for the compact density', () => {
    renderHeader({ density: 'compact' });
    const cell = screen.getByTestId('t-column-header-name');
    expect(getComputedStyle(cell).paddingLeft).toBe('0.5rem');
    expect(getComputedStyle(cell).paddingRight).toBe('0.5rem');
    expect(screen.getByText('Name & Description')).toHaveAttribute('title', 'Name & Description');
  });
});
