// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const runner = vi.hoisted(() => ({ props: null }));
const toast = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));

vi.mock('@/[fsd]/features/toolkits/indexes/api', () => ({
  useDeleteIndexItemMutation: () => [vi.fn(), { isLoading: false }],
  useGetIndexScheduleQuery: () => ({}),
}));
vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({
  useIndexNavigation: () => ({ goToCreateIndex: vi.fn(), goToIndex: vi.fn(), openIndexInNewTab: vi.fn() }),
  useIndexesListPolling: () => ({ refetch: vi.fn(), startedTimeStamp: 0, fulfilledTimeStamp: 0 }),
  useToolkitIndexes: () => ({
    indexes: [{ id: 5, metadata: { collection: 'docs', state: 'success' } }],
    isLoading: false,
  }),
}));
vi.mock('@/[fsd]/features/toolkits/indexes/ui', () => ({
  IndexesList: ({ indexesList, onCardReindex }) => (
    <button onClick={() => onCardReindex(indexesList[0])}>reindex</button>
  ),
  HeadlessReindexRunner: props => {
    runner.props = props;
    return null;
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 1, useToast: () => toast }));
vi.mock('@/[fsd]/shared/ui', async () => ({
  Chip: { ErrorCodeChip: (await vi.importActual('@/[fsd]/shared/ui/chip/ErrorCodeChip')).default },
  Modal: {
    DeleteEntityModal: ({ open, onConfirm, confirmButtonText }) =>
      open ? <button onClick={onConfirm}>{confirmButtonText}</button> : null,
  },
}));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('@/assets/arrow-right-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/components/Icons/CopyIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/DownloadIcon', () => ({ default: () => null }));

const { default: IndexesContainer } = await import('../IndexesContainer');

const theme = createTheme({
  palette: {
    border: { error: '#f00' },
    background: { error: '#fee', surface: { interactive: { default: '#eee', active: '#ddd' } } },
    text: { warning: '#900', primary: '#000', secondary: '#555' },
    icon: { default: '#000' },
  },
});

const REFUSAL = {
  code: 'DENIED_DEVELOPMENT_CREDENTIAL',
  message: 'This credential needs a grant before a draft can use it.',
};

const startReindex = () => {
  render(
    <ThemeProvider theme={theme}>
      <IndexesContainer toolkitId={3} />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByText('reindex'));
  fireEvent.click(screen.getByText('Reindex'));
  expect(runner.props).not.toBeNull();
};

describe('IndexesContainer — a reindex refused by governance', () => {
  afterEach(() => {
    cleanup();
    runner.props = null;
    vi.clearAllMocks();
  });

  it('shows the refusal card inline with the readable reason and its code, not a failure toast', () => {
    startReindex();

    act(() => runner.props.traceNewIndex(5, { collection: 'docs', state: 'failed', refusal: REFUSAL }));

    expect(screen.getByText(REFUSAL.message)).toBeInTheDocument();
    expect(screen.getByText(REFUSAL.code)).toBeInTheDocument();
    expect(toast.toastError).not.toHaveBeenCalled();
  });

  it('keeps the failure toast for any other failed reindex', () => {
    startReindex();

    act(() => runner.props.traceNewIndex(5, { collection: 'docs', state: 'failed' }));

    expect(toast.toastError).toHaveBeenCalledWith('Reindexing has failed!');
    expect(screen.queryByText(REFUSAL.code)).not.toBeInTheDocument();
  });

  it('clears the card when the next reindex starts', () => {
    startReindex();
    act(() => runner.props.traceNewIndex(5, { collection: 'docs', state: 'failed', refusal: REFUSAL }));
    act(() => runner.props.onDone());

    fireEvent.click(screen.getByText('reindex'));
    fireEvent.click(screen.getByText('Reindex'));

    expect(screen.queryByText(REFUSAL.message)).not.toBeInTheDocument();
  });
});
