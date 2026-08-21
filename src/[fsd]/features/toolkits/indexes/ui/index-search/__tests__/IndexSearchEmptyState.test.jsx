// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Box, ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { INDEX_SEARCH_TOOL_OPTIONS } from '../../../lib/constants/indexDetails.constants';
import IndexSearchEmptyState from '../IndexSearchEmptyState';

vi.mock('@/[fsd]/shared/ui', () => ({
  Select: { PopoverSelect: () => <Box data-testid="tool-picker" /> },
}));

afterEach(() => cleanup());

const theme = createTheme({ palette: { icon: { fill: { disabled: '#999' } } } });

const renderEmptyState = searchToolOptions =>
  render(
    <ThemeProvider theme={theme}>
      <IndexSearchEmptyState
        searchToolOptions={searchToolOptions}
        onChangeTool={() => {}}
      />
    </ThemeProvider>,
  );

describe('IndexSearchEmptyState', () => {
  it('offers the picker when the toolkit exposes search tools', () => {
    renderEmptyState(INDEX_SEARCH_TOOL_OPTIONS);

    expect(screen.getByTestId('tool-picker')).toBeInTheDocument();
    expect(screen.getByText(/Choose a tool from the list/)).toBeInTheDocument();
  });

  it('explains itself instead of offering an empty picker', () => {
    renderEmptyState([]);

    expect(screen.queryByTestId('tool-picker')).not.toBeInTheDocument();
    expect(screen.getByText('No search tools are enabled for this toolkit.')).toBeInTheDocument();
  });
});
