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

describe('IndexListItem — abandoned run', () => {
  it('shows the attention icon and never the spinner', () => {
    renderItem(indexRow(IndexStatuses.progress, { stale: true }));

    expect(attentionIcon()).toBeInTheDocument();
    expect(spinner()).not.toBeInTheDocument();
  });

  it('keeps Reindex and Delete available', () => {
    renderItem(indexRow(IndexStatuses.progress, { stale: true }));

    expect(reindexBtn()).not.toBeDisabled();
    expect(deleteBtn()).not.toBeDisabled();
  });
});

describe('IndexListItem — live run', () => {
  it('spins without the abandoned treatment', () => {
    renderItem(indexRow(IndexStatuses.progress));

    expect(spinner()).toBeInTheDocument();
    expect(attentionIcon()).not.toBeInTheDocument();
  });

  it('locks Reindex and Delete while the run may still be alive', () => {
    renderItem(indexRow(IndexStatuses.progress));

    expect(reindexBtn()).toBeDisabled();
    expect(deleteBtn()).toBeDisabled();
  });
});
