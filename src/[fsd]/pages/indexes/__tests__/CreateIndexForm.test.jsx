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

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

vi.mock('formik', () => ({ useFormikContext: () => ({ values: { type: 'github' } }) }));

vi.mock('@/[fsd]/features/toolkits/ui', () => ({
  ToolkitForm: { ToolFormContainer: props => <Box data-testid={`field-${props.fieldKey}`} /> },
}));

vi.mock('@/[fsd]/features/toolkits/lib/hooks', () => ({
  useToolkitChat: () => ({ handleIndexData: vi.fn(), isRunning: false, retryLastRun: vi.fn() }),
}));

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
afterEach(() => cleanup());

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
});
