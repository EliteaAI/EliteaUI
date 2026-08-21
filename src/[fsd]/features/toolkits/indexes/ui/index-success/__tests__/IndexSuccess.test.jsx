// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Box } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import IndexSuccess from '../IndexSuccess';

vi.mock('../SuccessPanel', () => ({
  default: () => <Box data-testid="init-panel" />,
}));

vi.mock('../RunIndexSettingsPanel', () => ({
  default: () => <Box data-testid="settings-panel" />,
}));

vi.mock('../SearchResult', () => ({
  default: () => <Box data-testid="results-panel" />,
}));

afterEach(() => cleanup());

const renderSuccess = props =>
  render(
    <IndexSuccess
      banner={{ severity: 'success' }}
      selectedIndexTools={['search_index']}
      onSelectSearchTool={() => {}}
      {...props}
    />,
  );

describe('IndexSuccess panel selection', () => {
  it('starts on the tool picker when nothing is selected', () => {
    renderSuccess({ selectedSearchTool: null, showResults: false });

    expect(screen.getByTestId('init-panel')).toBeInTheDocument();
  });

  it('shows the search form once a tool is selected', () => {
    renderSuccess({ selectedSearchTool: 'search_index', showResults: false });

    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });

  it('shows results whenever the parent reports them, whatever the tool', () => {
    renderSuccess({ selectedSearchTool: 'search_index', showResults: true });

    expect(screen.getByTestId('results-panel')).toBeInTheDocument();
  });

  it('keeps the search form across a remount, since the tab gate unmounts this subtree', () => {
    const { unmount } = renderSuccess({ selectedSearchTool: 'search_index', showResults: false });
    unmount();
    renderSuccess({ selectedSearchTool: 'search_index', showResults: false });

    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('init-panel')).not.toBeInTheDocument();
  });
});
