// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import IndexListItem from '../IndexListItem';

vi.mock('@/ComponentsLib/Tooltip', () => ({
  default: ({ children, title }) => <span data-tooltip={title}>{children}</span>,
}));

vi.mock('@/[fsd]/entities/indexing-report', () => ({
  normalizeIndexingReport: () => null,
}));

vi.mock('@/[fsd]/shared/lib/hooks/useProjectType.hooks', () => ({
  useProjectType: () => ({ isPrivate: true }),
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BUTTON_VARIANTS: { tertiary: 'tertiary' },
    // eslint-disable-next-line no-unused-vars
    BaseBtn: ({ children, startIcon, variant, ...rest }) => <button {...rest}>{children}</button>,
  },
}));

vi.mock('@/[fsd]/shared/ui/tooltip/InfoTooltip', () => ({
  default: () => <span data-testid="fail-icon" />,
}));

vi.mock('@/components/EntityIcon', () => ({ default: () => null }));

vi.mock('@/components/Icons/AttentionIcon', () => ({
  default: () => <span data-testid="attention-icon" />,
}));

vi.mock('@/components/Icons/DeleteIcon', () => ({ default: () => null }));

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => true }),
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 2,
}));

afterEach(() => cleanup());

const theme = createTheme({
  palette: {
    background: {
      userInputBackground: '#111',
      wrongBkg: '#511',
      errorBkg: '#311',
      warning: '#a60',
      button: { primary: { disabled: '#666' } },
    },
    border: { table: '#222', lines: '#333' },
    split: { pressed: '#444', hover: '#555' },
    text: { info: '#7af' },
  },
});

const indexRow = (state, over = {}) => ({
  id: 'row-1',
  stale: false,
  metadata: {
    collection: 'docs-index',
    state,
    created_on: 1_700_000_000,
    history: [],
  },
  ...over,
});

const renderItem = (index, props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <IndexListItem
        index={index}
        listOnly
        onCardReindex={vi.fn()}
        onCardDelete={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

const spinner = () => screen.queryByRole('progressbar');
const attentionIcon = () => screen.queryByTestId('attention-icon');
const reindexBtn = () => screen.getByTestId('index-card-reindex-btn');
const deleteBtn = () => screen.getByTestId('index-card-delete-btn');

describe('IndexListItem — interrupted runs', () => {
  it('shows the attention icon and never the spinner', () => {
    renderItem(indexRow(IndexStatuses.interrupted));

    expect(attentionIcon()).toBeInTheDocument();
    // The reported #6389 defect rendered the spinner and the "stopped without
    // finishing" indicator side by side; only the negative assertion pins it.
    expect(spinner()).not.toBeInTheDocument();
  });

  it('keeps the "stopped without finishing" tooltip on the icon', () => {
    renderItem(indexRow(IndexStatuses.interrupted));

    expect(
      document.querySelector('[data-tooltip="This run stopped without finishing. Reindex to try again."]'),
    ).toBeInTheDocument();
  });

  it('leaves Reindex and Delete available', () => {
    renderItem(indexRow(IndexStatuses.interrupted));

    expect(reindexBtn()).toBeEnabled();
    expect(deleteBtn()).toBeEnabled();
  });
});

describe('IndexListItem — live runs are untouched', () => {
  it('shows only the spinner and locks the actions for a fresh in_progress run', () => {
    renderItem(indexRow(IndexStatuses.progress));

    expect(spinner()).toBeInTheDocument();
    expect(attentionIcon()).not.toBeInTheDocument();
    expect(reindexBtn()).toBeDisabled();
    expect(deleteBtn()).toBeDisabled();
  });

  it('releases the actions once the backend marks an in_progress run stale', () => {
    // The stale escape hatch stays: an alive-but-hung run the reclaimer refuses to
    // touch must remain deletable/reindexable after the timeout.
    renderItem(indexRow(IndexStatuses.progress, { stale: true }));

    expect(reindexBtn()).toBeEnabled();
    expect(deleteBtn()).toBeEnabled();
  });

  it('explains an unresponsive run on the spinner instead of claiming it stopped', () => {
    // Rows the reclaim cannot or will not touch (hung-but-alive, unresolvable,
    // pre-sweep window) keep the honest spinner, but its tooltip must say why the
    // actions unlocked — never the "stopped without finishing" copy, which is
    // reserved for the persisted interrupted state.
    renderItem(indexRow(IndexStatuses.progress, { stale: true }));

    expect(spinner()).toBeInTheDocument();
    expect(attentionIcon()).not.toBeInTheDocument();
    expect(document.querySelector('[data-tooltip^="No progress reported in a while"]')).toBeInTheDocument();
  });

  it('keeps the plain spinner silent while the run is fresh', () => {
    renderItem(indexRow(IndexStatuses.progress));

    expect(
      document.querySelector('[data-tooltip^="No progress reported in a while"]'),
    ).not.toBeInTheDocument();
  });

  it('locks both actions while a reindex request is in flight', () => {
    renderItem(indexRow(IndexStatuses.interrupted), { isReindexing: true });

    expect(reindexBtn()).toBeDisabled();
    expect(deleteBtn()).toBeDisabled();
  });
});

describe('IndexListItem — other states keep their icons', () => {
  it('renders exactly one state icon per state', () => {
    for (const [state, assertIcon] of [
      [IndexStatuses.fail, () => screen.getByTestId('fail-icon')],
      [IndexStatuses.partlyOk, () => screen.getByTestId('attention-icon')],
      [IndexStatuses.interrupted, () => screen.getByTestId('attention-icon')],
    ]) {
      renderItem(indexRow(state));
      assertIcon();
      expect(spinner()).not.toBeInTheDocument();
      cleanup();
    }
  });

  it('renders no state icon at all for a completed index', () => {
    renderItem(indexRow(IndexStatuses.success));

    expect(spinner()).not.toBeInTheDocument();
    expect(attentionIcon()).not.toBeInTheDocument();
    expect(screen.queryByTestId('fail-icon')).not.toBeInTheDocument();
  });
});
