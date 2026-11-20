// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { ListLayoutContext } from '@/[fsd]/shared/lib/context';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RightPanel from '../RightPanel';

vi.mock('@/[fsd]/features/discovery-search', () => ({
  DiscoverySearchBar: () => <div data-testid="panel-search" />,
  useDiscoverySearchState: () => ({
    searchString: '',
    setSearchString: vi.fn(),
    searchTags: [],
    setSearchTags: vi.fn(),
    onClear: vi.fn(),
  }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSearchBar: () => ({ showSearchBar: true, isPipelinesPage: false }),
}));

const theme = createTheme(getDesignTokens('dark'));

const renderPanel = layout =>
  render(
    <ThemeProvider theme={theme}>
      <ListLayoutContext.Provider value={layout}>
        <RightPanel>
          <span>Tags</span>
        </RightPanel>
      </ListLayoutContext.Provider>
    </ThemeProvider>,
  );

describe('RightPanel with a list layout', () => {
  afterEach(() => cleanup());

  it('keeps the search above the tags without a layout', () => {
    renderPanel(null);
    expect(screen.getByTestId('panel-search')).toBeInTheDocument();
  });

  it('leaves the search to the page toolbar', () => {
    renderPanel({ isRightPanelOpen: true, rightPanelTop: 120, isSearchInToolbar: true });
    expect(screen.queryByTestId('panel-search')).not.toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });
});
