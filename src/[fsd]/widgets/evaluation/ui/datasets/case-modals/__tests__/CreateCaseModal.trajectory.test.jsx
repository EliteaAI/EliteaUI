// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import CreateCaseModal from '../CreateCaseModal';

const { addCase, updateCase, toastError } = vi.hoisted(() => ({
  addCase: vi.fn(),
  updateCase: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../../../../api', () => ({
  useAddEvalDatasetCaseMutation: () => [addCase, { isLoading: false }],
  useUpdateEvalDatasetCaseMutation: () => [updateCase, { isLoading: false }],
}));

vi.mock('@/api/applications', async importOriginal => ({
  ...(await importOriginal()),
  useApplicationDetailsQuery: () => ({
    data: {
      version_details: {
        tools: [
          { type: 'jira', settings: { selected_tools: ['search_issues'] } },
          { type: 'application', name: 'Child Writer' },
        ],
      },
    },
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastSuccess: vi.fn(), toastError }),
}));

const theme = createTheme({ palette: lightPalette });

const stored = {
  id: 5,
  input: 'find EL bugs',
  expected_output: null,
  variables: {},
  expected_trajectory: {
    match: 'superset',
    tools: [{ name: 'search_issues' }],
    forbidden: [],
    allow_repeat: [],
  },
};

const renderModal = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <CreateCaseModal
        open
        onClose={vi.fn()}
        projectId={1}
        datasetId={2}
        applicationId={3}
        {...props}
      />
    </ThemeProvider>,
  );

const ok = () => ({ unwrap: () => Promise.resolve({}) });

describe('CreateCaseModal expected trajectory', () => {
  afterEach(() => {
    cleanup();
    addCase.mockReset();
    updateCase.mockReset();
    toastError.mockReset();
  });

  it('suggests the agent tool names and saves the reference', async () => {
    addCase.mockReturnValue(ok());
    renderModal();

    fireEvent.change(screen.getByTestId('create-case-input').querySelector('textarea'), {
      target: { value: 'q' },
    });
    fireEvent.click(screen.getByTestId('create-case-expected-trajectory-checkbox').querySelector('input'));
    fireEvent.click(screen.getByTestId('create-case-expected-tool-add'));

    const nameInput = screen.getByTestId('create-case-expected-tool-name-0').querySelector('input');
    fireEvent.mouseDown(nameInput);
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual(['ChildWriter', 'search_issues']);

    fireEvent.change(nameInput, { target: { value: 'sea' } });
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual(['search_issues']);
    fireEvent.click(screen.getByRole('option', { name: 'search_issues' }));
    expect(nameInput).toHaveValue('search_issues');

    const forbiddenInput = screen
      .getByTestId('create-case-expected-trajectory-forbidden')
      .querySelector('input');
    fireEvent.change(forbiddenInput, { target: { value: 'drop_table' } });
    fireEvent.keyDown(forbiddenInput, { key: 'Enter' });
    fireEvent.change(forbiddenInput, { target: { value: 'mcp_delete' } });
    fireEvent.blur(forbiddenInput);
    expect(
      screen.getByTestId('create-case-expected-trajectory-forbidden-chip-drop_table'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('create-case-expected-trajectory-forbidden-chip-mcp_delete'),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('create-case-expected-trajectory-max-calls').querySelector('input'), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByTestId('create-case-save'));
    await vi.waitFor(() => expect(addCase).toHaveBeenCalled());

    expect(addCase.mock.calls[0][0].body.expected_trajectory).toEqual({
      match: 'superset',
      tools: [{ name: 'search_issues' }],
      forbidden: ['drop_table', 'mcp_delete'],
      allow_repeat: [],
      max_tool_calls: 4,
    });
  });

  it('accepts a free-text tool name the agent does not list', async () => {
    addCase.mockReturnValue(ok());
    renderModal();
    fireEvent.change(screen.getByTestId('create-case-input').querySelector('textarea'), {
      target: { value: 'q' },
    });
    fireEvent.click(screen.getByTestId('create-case-expected-trajectory-checkbox').querySelector('input'));
    fireEvent.click(screen.getByTestId('create-case-expected-tool-add'));
    fireEvent.change(screen.getByTestId('create-case-expected-tool-name-0').querySelector('input'), {
      target: { value: 'mcp_get_page' },
    });
    fireEvent.click(screen.getByTestId('create-case-save'));
    await vi.waitFor(() => expect(addCase).toHaveBeenCalled());

    expect(addCase.mock.calls[0][0].body.expected_trajectory.tools).toEqual([{ name: 'mcp_get_page' }]);
  });

  it('blocks the save on bad arguments JSON', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderModal();
    fireEvent.change(screen.getByTestId('create-case-input').querySelector('textarea'), {
      target: { value: 'q' },
    });
    fireEvent.click(screen.getByTestId('create-case-expected-trajectory-checkbox').querySelector('input'));
    fireEvent.click(screen.getByTestId('create-case-expected-tool-add'));
    fireEvent.change(screen.getByTestId('create-case-expected-tool-name-0').querySelector('input'), {
      target: { value: 'a' },
    });
    fireEvent.change(screen.getByTestId('create-case-expected-tool-args-0').querySelector('textarea'), {
      target: { value: '{oops' },
    });
    fireEvent.click(screen.getByTestId('create-case-save'));

    expect(screen.getByTestId('create-case-error')).toHaveTextContent(
      'Expected tool 1: arguments are not valid JSON',
    );
    expect(toastError).toHaveBeenCalledWith('Expected tool 1: arguments are not valid JSON');
    expect(scrollIntoView).toHaveBeenCalled();
    expect(addCase).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('create-case-expected-tool-args-0').querySelector('textarea'), {
      target: { value: '[1, 2]' },
    });
    fireEvent.click(screen.getByTestId('create-case-save'));
    expect(screen.getByTestId('create-case-error')).toHaveTextContent(
      'Expected tool 1: arguments must be a JSON object',
    );
    expect(toastError).toHaveBeenLastCalledWith('Expected tool 1: arguments must be a JSON object');
    expect(addCase).not.toHaveBeenCalled();
    delete Element.prototype.scrollIntoView;
  });

  it('leaves a stored reference alone when only the input changes', async () => {
    updateCase.mockReturnValue(ok());
    renderModal({ datasetCase: stored });

    fireEvent.change(screen.getByTestId('create-case-input').querySelector('textarea'), {
      target: { value: 'find EL bugs, newest first' },
    });
    fireEvent.click(screen.getByTestId('create-case-save'));
    await vi.waitFor(() => expect(updateCase).toHaveBeenCalled());

    expect(updateCase.mock.calls[0][0].body).not.toHaveProperty('expected_trajectory');
  });

  it('clears the reference when the section is turned off', async () => {
    updateCase.mockReturnValue(ok());
    renderModal({ datasetCase: stored });

    expect(screen.getByTestId('create-case-expected-tool-name-0').querySelector('input')).toHaveValue(
      'search_issues',
    );
    fireEvent.click(screen.getByTestId('create-case-expected-trajectory-checkbox').querySelector('input'));
    fireEvent.click(screen.getByTestId('create-case-save'));
    await vi.waitFor(() => expect(updateCase).toHaveBeenCalled());

    expect(updateCase.mock.calls[0][0].body.expected_trajectory).toBeNull();
  });

  it('shows a stored reference read-only and hides an absent one', () => {
    renderModal({ datasetCase: stored, readOnly: true });
    expect(screen.getByTestId('create-case-expected-tool-name-0').querySelector('input')).toHaveAttribute(
      'readonly',
    );
    expect(screen.queryByTestId('create-case-expected-tool-add')).not.toBeInTheDocument();
    cleanup();

    renderModal({ datasetCase: { ...stored, expected_trajectory: null }, readOnly: true });
    expect(screen.queryByTestId('create-case-expected-trajectory')).not.toBeInTheDocument();
  });
});
