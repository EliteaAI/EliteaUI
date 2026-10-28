// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import StyledTabs from '../StyledTabs';

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useShouldCollapseRightToolbar: () => ({ shouldCollapseTabs: false }),
  useGetComponentHeight: () => ({ componentRef: { current: null }, componentHeight: 100 }),
}));
vi.mock('../AlertDialog', () => ({ default: () => null }));

const theme = createTheme(getDesignTokens('dark'));

const renderTabs = (path, props) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <StyledTabs
          hideBackButton
          tabs={[{ label: 'Tab', content: null }]}
          {...props}
        />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('StyledTabs', () => {
  afterEach(cleanup);

  it('makes the tab inert when the page sets the create-page flag', () => {
    renderTabs('/settings/schedules/3', { isCreatePage: true });

    expect(screen.getByRole('tab')).toHaveStyle({ pointerEvents: 'none' });
  });

  it('keeps the known create paths inert without the flag', () => {
    renderTabs('/agents/create');

    expect(screen.getByRole('tab')).toHaveStyle({ pointerEvents: 'none' });
  });

  it('keeps the tab clickable on any other path', () => {
    renderTabs('/settings/schedules');

    expect(screen.getByRole('tab')).not.toHaveStyle({ pointerEvents: 'none' });
  });
});
