// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';

import DataCards from '../DataCards';

const fixture = vi.hoisted(() => ({ useCardLayout: vi.fn(() => '300px') }));

vi.mock('react-redux', () => ({ useSelector: select => select({ tags: { tagList: [] } }) }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useCardLayout: (...args) => fixture.useCardLayout(...args),
  useGetComponentWidth: () => ({ componentRef: { current: null }, componentWidth: 1500 }),
  useTags: () => ({ calculateTagsWidthOnCard: vi.fn(), setGetElement: vi.fn() }),
}));
vi.mock('@/ComponentsLib/ListInfiniteMoreLoader', () => ({ default: () => null }));

const theme = createTheme(getDesignTokens('dark'));

const renderCards = props =>
  render(
    <ThemeProvider theme={theme}>
      <DataCards
        data={[]}
        renderCard={() => null}
        isFullWidth
        {...props}
      />
    </ThemeProvider>,
  );

describe('DataCards loading layout', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('lays the skeletons out as a full grid measured from the container', () => {
    renderCards({ isLoading: true });
    expect(fixture.useCardLayout).toHaveBeenLastCalledWith(1500, 10, true);
  });

  it('lays the loaded cards out by their count', () => {
    renderCards({ data: [{ id: 1 }, { id: 2 }] });
    expect(fixture.useCardLayout).toHaveBeenLastCalledWith(1500, 2, true);
  });
});
