// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Box, ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import CreateIndexForm from '../CreateIndexForm';

vi.hoisted(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    clear: () => store.clear(),
  };
});

const navigate = vi.fn();
const toastError = vi.fn();
const startIndexData = vi.fn();
const chat = { options: null };

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('formik', () => ({ useFormikContext: () => ({ values: { type: 'github' } }) }));

vi.mock('@/[fsd]/features/toolkits/ui', () => ({
  ToolkitForm: { ToolFormContainer: props => <Box data-testid={`field-${props.fieldKey}`} /> },
}));

vi.mock('@/[fsd]/features/toolkits/lib/hooks', () => ({
  useToolkitChat: options => {
    chat.options = options;
    return { handleIndexData: startIndexData, isRunning: false, retryLastRun: vi.fn() };
  },
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useToast: () => ({ toastError }) }));

vi.mock('@/[fsd]/features/toolkits/indexes/lib/hooks', () => ({
  useIndexNameValidation: () => ({
    clearIndexNameError: vi.fn(),
    indexNameError: null,
    updateIndexNameError: vi.fn(),
    isIndexNameValid: () => true,
  }),
}));

vi.mock('@/[fsd]/features/mcp/lib/hooks', () => ({
  useMcpAuthModal: () => ({ handleMcpAuthRequired: vi.fn(), getModalProps: () => ({ open: false }) }),
}));

vi.mock('@/[fsd]/features/mcp/ui', () => ({ McpAuthModal: () => null }));

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BUTTON_VARIANTS: { elitea: 'elitea', secondary: 'secondary' },
    BaseBtn: props => (
      <button
        type="button"
        disabled={props.disabled}
        onClick={props.onClick}
      >
        {props.children}
      </button>
    ),
  },
}));

vi.mock('@/hooks/toolkit/useGetSelectedToolSchema', () => ({
  useGetSelectedToolSchema: () => ({ properties: { index_name: { type: 'string' } } }),
}));

const theme = createTheme({ palette: { icon: { fill: { default: '#fff' } } } });

const renderForm = props =>
  render(
    <ThemeProvider theme={theme}>
      <CreateIndexForm
        toolkitId="44"
        {...props}
      />
    </ThemeProvider>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const CONVERSATION = { conversation_id: 7, conversation_uuid: 'conv-uuid' };
const trace = meta => chat.options.traceNewIndex(null, meta);

describe('CreateIndexForm', () => {
  it('sends Cancel to the toolkit details page rather than back through history', () => {
    renderForm({ tab: 'my-liked' });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(navigate).toHaveBeenCalledWith('/toolkits/my-liked/44');
  });

  it('falls back to the default tab when the route has none', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(navigate).toHaveBeenCalledWith('/toolkits/all/44');
  });

  it('hands over to the index page only once the run has a task, carrying the task id', () => {
    renderForm({ tab: 'all' });

    trace({ collection: 'docs', state: 'in_progress' });
    trace(CONVERSATION);
    expect(navigate).not.toHaveBeenCalled();

    trace({ task_id: 'task-1' });
    expect(navigate).toHaveBeenCalledWith('/toolkits/all/44/index/docs', {
      replace: true,
      state: { creating: true, collection: 'docs', ...CONVERSATION, task_id: 'task-1' },
    });
  });

  it('stays on the form and shows the refusal when the server refuses the run', () => {
    renderForm({ tab: 'all' });

    trace({ collection: 'docs', state: 'in_progress' });
    trace(CONVERSATION);
    trace({
      collection: 'docs',
      state: 'failed',
      refusal: { message: 'You have read-only access to this index' },
    });
    trace({ task_id: 'late-task' });

    expect(toastError).toHaveBeenCalledWith('You have read-only access to this index');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the reason the server gave when the run fails before it starts', () => {
    renderForm({ tab: 'all' });

    trace({ collection: 'docs', state: 'failed', failureReason: 'Index docs is already being indexed' });

    expect(toastError).toHaveBeenCalledWith('Index docs is already being indexed');
  });

  it('says the run did not start when no answer comes within the start window', () => {
    vi.useFakeTimers();
    renderForm({ tab: 'all' });

    fireEvent.click(screen.getByRole('button', { name: 'Index' }));
    vi.advanceTimersByTime(45_000);

    expect(startIndexData).toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Indexing didn't start — refresh the page and try again");
  });

  it('does not report a timeout once the run has handed over', () => {
    vi.useFakeTimers();
    renderForm({ tab: 'all' });

    fireEvent.click(screen.getByRole('button', { name: 'Index' }));
    trace({ collection: 'docs', ...CONVERSATION, task_id: 'task-1' });
    vi.advanceTimersByTime(45_000);

    expect(navigate).toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });
});
