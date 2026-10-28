// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const runner = vi.hoisted(() => ({ props: null }));
const toast = vi.hoisted(() => ({ toastSuccess: vi.fn(), toastError: vi.fn() }));
const polling = vi.hoisted(() => ({ startedTimeStamp: 0, fulfilledTimeStamp: 0 }));

vi.mock('@/[fsd]/features/toolkits/indexes/api', () => ({
  useDeleteIndexItemMutation: () => [vi.fn(), { isLoading: false }],
  useGetIndexScheduleQuery: () => ({}),
}));
vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({
  useIndexNavigation: () => ({ goToCreateIndex: vi.fn(), goToIndex: vi.fn(), openIndexInNewTab: vi.fn() }),
  useIndexesListPolling: () => ({ refetch: vi.fn(), ...polling }),
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

// What the worker sent, and what the run hands over: the readable text, the code, the payload and its message
const PAYLOAD = {
  code: 'DENIED_DEVELOPMENT_CREDENTIAL',
  error: 'This credential needs a grant before a draft can use it.',
};
const REFUSAL = {
  code: PAYLOAD.code,
  message: PAYLOAD.error,
  trace: JSON.stringify(PAYLOAD),
  messageId: 'msg-42',
};

// the container is memoized: a changing prop makes a rerender read the polling state again
const ui = (renderCount = 0) => (
  <ThemeProvider theme={theme}>
    <IndexesContainer
      toolkitId={3}
      canIndex={renderCount % 2 === 0}
    />
  </ThemeProvider>
);

const startReindex = () => {
  const view = render(ui());
  fireEvent.click(screen.getByText('reindex'));
  fireEvent.click(screen.getByText('Reindex'));
  expect(runner.props).not.toBeNull();
  return view;
};

describe('IndexesContainer — a reindex refused by governance', () => {
  afterEach(() => {
    cleanup();
    runner.props = null;
    polling.startedTimeStamp = 0;
    polling.fulfilledTimeStamp = 0;
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('shows the refusal card inline with the readable reason and its code, not a failure toast', () => {
    startReindex();

    act(() => runner.props.traceNewIndex(5, { collection: 'docs', state: 'failed', refusal: REFUSAL }));

    expect(screen.getByText(REFUSAL.message)).toBeInTheDocument();
    expect(screen.getByText(REFUSAL.code)).toBeInTheDocument();
    expect(toast.toastError).not.toHaveBeenCalled();
  });

  it('keeps what the worker sent as the debugging info and names the download after the message', () => {
    const created = [];
    URL.createObjectURL = vi.fn(blob => (created.push(blob), 'blob:x'));
    URL.revokeObjectURL = vi.fn();
    let downloadName;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
      downloadName = this.download;
    });
    startReindex();
    act(() => runner.props.traceNewIndex(5, { collection: 'docs', state: 'failed', refusal: REFUSAL }));

    fireEvent.click(screen.getByText('Error debugging info'));
    expect(screen.getByText(REFUSAL.trace, { selector: 'pre' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button').find(button => !button.textContent));

    expect(downloadName).toMatch(/^error-trace-msg-42-/);
    expect(created).toHaveLength(1);
  });

  it("clears the card when the list is read again after the run settled, not for the run's own refetch", () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const view = startReindex();
    act(() => runner.props.traceNewIndex(5, { collection: 'docs', state: 'failed', refusal: REFUSAL }));

    // the run's own refetch starts with the refusal
    polling.startedTimeStamp = 1_000_050;
    polling.fulfilledTimeStamp = 1_000_300;
    view.rerender(ui(1));
    expect(screen.getByText(REFUSAL.message)).toBeInTheDocument();

    // a read that is still in flight does not clear it
    polling.startedTimeStamp = 1_060_000;
    view.rerender(ui(2));
    expect(screen.getByText(REFUSAL.message)).toBeInTheDocument();

    polling.fulfilledTimeStamp = 1_060_400;
    now.mockReturnValue(1_060_400);
    view.rerender(ui(3));
    expect(screen.queryByText(REFUSAL.message)).not.toBeInTheDocument();
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
