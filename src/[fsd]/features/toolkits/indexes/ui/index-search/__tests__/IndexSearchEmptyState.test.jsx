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

const renderEmptyState = props =>
  render(
    <ThemeProvider theme={theme}>
      <IndexSearchEmptyState
        searchToolOptions={INDEX_SEARCH_TOOL_OPTIONS}
        onChangeTool={() => {}}
        {...props}
      />
    </ThemeProvider>,
  );

describe('IndexSearchEmptyState', () => {
  it('invites the user to pick a tool when searching is available', () => {
    renderEmptyState();

    expect(screen.getByText(/Choose a tool from the list/)).toBeInTheDocument();
  });

  it('states the reason instead of an instruction the disabled picker would refuse', () => {
    renderEmptyState({
      searchToolOptions: [],
      blockedReason: 'No search tools are enabled for this toolkit',
    });

    expect(screen.queryByText(/Choose a tool from the list/)).not.toBeInTheDocument();
    expect(screen.getByText('No search tools are enabled for this toolkit')).toBeInTheDocument();
  });
});
