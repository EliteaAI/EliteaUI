// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import IndexesPanel from '../IndexesPanel';

const canWriteIndexes = vi.hoisted(() => ({ current: true }));

vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({
  useCanWriteIndexes: () => canWriteIndexes.current,
  useIndexNavigation: () => ({ goToCreateIndex: vi.fn() }),
  useToolkitIndexes: () => ({ count: 2, label: '2 indexes', isLoading: false }),
}));

vi.mock('@/[fsd]/features/interactive-tours', () => ({
  TOOLKIT_TOUR_TARGET_IDS: { indexesTab: 'indexes-tab' },
}));

vi.mock('../AddIndexButton', () => ({ default: () => <button type="button">+ Index</button> }));

vi.mock('../IndexesContainer', () => ({
  default: props => (
    <div
      data-testid="indexes-container"
      data-can-index={String(props.canIndex)}
    />
  ),
}));

vi.mock('../RunIndexBanner', () => ({ default: () => null }));

vi.mock('../index-list/IndexesList', () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  canWriteIndexes.current = true;
});

const colorForAnyPalettePath = new Proxy(
  {},
  {
    get: (_target, key) =>
      key === Symbol.toPrimitive || key === 'toString' ? () => '#123456' : colorForAnyPalettePath,
  },
);
const themeWhereEveryPaletteTokenResolves = createTheme();
themeWhereEveryPaletteTokenResolves.palette = new Proxy(themeWhereEveryPaletteTokenResolves.palette, {
  get: (target, key) => (key in target ? target[key] : colorForAnyPalettePath),
});

const renderPanel = indexingBlocker =>
  render(
    <ThemeProvider theme={themeWhereEveryPaletteTokenResolves}>
      <IndexesPanel
        toolkitId={1}
        indexingBlocker={indexingBlocker}
      />
    </ThemeProvider>,
  );

describe('IndexesPanel', () => {
  it('offers + Index and card actions to someone who may write indexes', () => {
    renderPanel(null);

    expect(screen.getByRole('button', { name: '+ Index' })).toBeInTheDocument();
    expect(screen.getByTestId('indexes-container')).toHaveAttribute('data-can-index', 'true');
  });

  it('lists the indexes without any way to create or reindex for someone who may only read them', () => {
    canWriteIndexes.current = false;
    renderPanel(null);

    expect(screen.queryByRole('button', { name: '+ Index' })).not.toBeInTheDocument();
    expect(screen.getByTestId('indexes-container')).toHaveAttribute('data-can-index', 'false');
  });

  it('keeps a configuration blocker in charge for someone who may write indexes', () => {
    renderPanel('builds_disabled');

    expect(screen.queryByRole('button', { name: '+ Index' })).not.toBeInTheDocument();
    expect(screen.getByTestId('indexes-container')).toHaveAttribute('data-can-index', 'false');
  });
});
