// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ListLayoutContext } from '@/[fsd]/shared/lib/context';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CardList from '../CardList';

const fixture = vi.hoisted(() => ({ shouldCollapseRightToolbar: false }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useIsTableView: () => false,
  useShouldCollapseRightToolbar: () => ({ shouldCollapseRightToolbar: fixture.shouldCollapseRightToolbar }),
}));
vi.mock('@/[fsd]/widgets/data-table', () => ({ default: () => <div data-testid="table" /> }));
vi.mock('../DataCards', () => ({
  default: ({ isFullWidth }) => (
    <div
      data-testid="cards"
      data-full-width={String(isFullWidth)}
    />
  ),
}));
vi.mock('../RightPanel', () => ({
  default: ({ children }) => <div data-testid="right-panel">{children}</div>,
}));
vi.mock('@/components/EmptyListBox', () => ({ default: () => <div data-testid="empty" /> }));

const renderList = layout =>
  render(
    <ListLayoutContext.Provider value={layout}>
      <CardList
        cardList={[{ id: 1 }]}
        rightPanelContent={<span>Tags</span>}
      />
    </ListLayoutContext.Provider>,
  );

describe('CardList with a list layout', () => {
  beforeEach(() => {
    fixture.shouldCollapseRightToolbar = false;
  });
  afterEach(() => cleanup());

  it('keeps its own panel rule without a layout', () => {
    renderList(null);
    expect(screen.getByTestId('right-panel')).toBeInTheDocument();
    cleanup();
    fixture.shouldCollapseRightToolbar = true;
    renderList(null);
    expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
  });

  it('hides the panel and widens the list while the page keeps the filters closed', () => {
    renderList({ isRightPanelOpen: false, rightPanelTop: 120, isSearchInToolbar: true });
    expect(screen.queryByTestId('right-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('cards')).toHaveAttribute('data-full-width', 'true');
  });

  it('shows the panel the user opened, also on a narrow window', () => {
    fixture.shouldCollapseRightToolbar = true;
    renderList({ isRightPanelOpen: true, rightPanelTop: 120, isSearchInToolbar: true });
    expect(screen.getByTestId('right-panel')).toHaveTextContent('Tags');
    expect(screen.getByTestId('cards')).toHaveAttribute('data-full-width', 'false');
  });
});
