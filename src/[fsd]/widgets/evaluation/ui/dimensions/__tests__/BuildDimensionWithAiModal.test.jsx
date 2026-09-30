// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import BuildDimensionWithAiModal from '../BuildDimensionWithAiModal';

const api = vi.hoisted(() => ({
  generate: vi.fn(),
  create: vi.fn(),
}));

vi.mock('../../../api', () => ({
  useGenerateEvalDimensionsMutation: () => [api.generate],
  useCreateEvalDimensionMutation: () => [api.create, { isLoading: false }],
}));

// InputBase (used by the review form) wires copy actions to toasts, which need the app's provider.
vi.mock('@/hooks/useToast', () => ({
  default: () => ({ toastError: vi.fn(), toastSuccess: vi.fn(), toastInfo: vi.fn(), toastWarning: vi.fn() }),
}));

const theme = createTheme(getDesignTokens('dark'));

const GENERATED = [
  {
    name: 'Politeness',
    description: 'Checks tone.',
    allowed_engines: ['ai'],
    scale_type: 'continuous',
    scale_min: 1,
    scale_max: 100,
    default_target: 80,
    default_target_operator: '>=',
    default_weight: 1,
    evidence_scope: { output: true },
  },
  {
    name: 'Valid JSON',
    description: 'Checks JSON.',
    allowed_engines: ['ai'],
    scale_type: 'continuous',
    scale_min: 1,
    scale_max: 100,
    default_target: 90,
    default_target_operator: '>=',
    default_weight: 2,
    evidence_scope: { output: true },
  },
  {
    name: 'Grounded',
    description: 'Checks grounding.',
    allowed_engines: ['ai'],
    scale_type: 'continuous',
    scale_min: 1,
    scale_max: 100,
    default_target: 70,
    default_target_operator: '>=',
    evidence_scope: { output: true },
  },
];

const mutationResult = value => ({ unwrap: () => value, abort: vi.fn() });

const renderModal = (props = {}) => {
  const handlers = { onClose: vi.fn(), onSaved: vi.fn() };
  render(
    <ThemeProvider theme={theme}>
      <BuildDimensionWithAiModal
        open
        projectId={1}
        applicationId={7}
        {...handlers}
        {...props}
      />
    </ThemeProvider>,
  );
  return handlers;
};

const generate = async (prompt = 'Check politeness') => {
  fireEvent.change(screen.getByTestId('build-dimension-prompt-input'), { target: { value: prompt } });
  await act(async () => {
    fireEvent.click(screen.getByTestId('build-dimension-generate-button'));
  });
};

const checkbox = testId => within(screen.getByTestId(testId)).getByRole('checkbox');

beforeEach(() => {
  vi.clearAllMocks();
  api.generate.mockImplementation(() => mutationResult(Promise.resolve({ dimensions: GENERATED })));
  api.create.mockImplementation(({ body }) =>
    mutationResult(Promise.resolve({ id: body.name.length, ...body })),
  );
});

afterEach(() => cleanup());

describe('BuildDimensionWithAiModal', () => {
  it('lists every generated draft with its tags and a select-all counter', async () => {
    renderModal();
    await generate();

    expect(screen.getByText(/Select the dimensions you want to create/)).toBeInTheDocument();
    expect(screen.getByText('Select all (3)')).toBeInTheDocument();
    const firstCard = screen.getByTestId('build-dimension-select-0');
    expect(within(firstCard).getByText('AI')).toBeInTheDocument();
    expect(within(firstCard).getByText('≥80')).toBeInTheDocument();
    expect(within(firstCard).getByText('Low')).toBeInTheDocument();
    expect(within(screen.getByTestId('build-dimension-select-1')).getByText('Medium')).toBeInTheDocument();
    expect(screen.getByTestId('build-dimension-selected-count')).toHaveTextContent('0 selected');
    expect(screen.getByTestId('build-dimension-save-button')).toBeDisabled();
  });

  it('keeps the action bar with a disabled Generate Draft while generating', async () => {
    api.generate.mockImplementation(() => mutationResult(new Promise(() => {})));
    renderModal();
    await generate();

    expect(screen.getByTestId('build-dimension-loading')).toBeInTheDocument();
    expect(screen.getByTestId('build-dimension-generate-button')).toBeDisabled();
    expect(screen.getByTestId('build-dimension-cancel-button')).toBeEnabled();
  });

  it('selects items individually and in bulk', async () => {
    renderModal();
    await generate();

    fireEvent.click(checkbox('build-dimension-checkbox-0'));
    expect(screen.getByTestId('build-dimension-selected-count')).toHaveTextContent('1 selected');
    expect(checkbox('build-dimension-select-all')).toHaveAttribute('data-indeterminate', 'true');

    fireEvent.click(checkbox('build-dimension-select-all'));
    expect(screen.getByTestId('build-dimension-selected-count')).toHaveTextContent('3 selected');

    fireEvent.click(checkbox('build-dimension-select-all'));
    expect(screen.getByTestId('build-dimension-selected-count')).toHaveTextContent('0 selected');
  });

  it('validates on "Save and back to list" and keeps the selection when returning', async () => {
    renderModal();
    await generate();

    fireEvent.click(checkbox('build-dimension-checkbox-1'));
    fireEvent.click(screen.getByTestId('build-dimension-select-0'));

    const targetInput = screen.getByTestId('dimension-target-value-input').querySelector('input');
    fireEvent.change(targetInput, { target: { value: '' } });

    const saveAndBack = screen.getByTestId('build-dimension-save-and-back-button');
    expect(saveAndBack).toBeEnabled();
    fireEvent.click(saveAndBack);

    expect(screen.getByTestId('build-dimension-form-errors-alert')).toHaveTextContent(
      'Some required fields are missing or contain invalid values.',
    );
    expect(screen.getByTestId('dimension-target-value-field-error')).toHaveTextContent('Field is required.');

    fireEvent.change(targetInput, { target: { value: '65' } });
    fireEvent.click(saveAndBack);

    expect(screen.getByTestId('build-dimension-select-list')).toBeInTheDocument();
    expect(within(screen.getByTestId('build-dimension-select-0')).getByText('≥65')).toBeInTheDocument();
    expect(checkbox('build-dimension-checkbox-1')).toBeChecked();
    expect(checkbox('build-dimension-checkbox-0')).not.toBeChecked();
  });

  it('discards unsaved edits on "Back to list" and keeps the selection', async () => {
    renderModal();
    await generate();

    fireEvent.click(checkbox('build-dimension-checkbox-2'));
    fireEvent.click(screen.getByTestId('build-dimension-select-0'));

    const targetInput = screen.getByTestId('dimension-target-value-input').querySelector('input');
    fireEvent.change(targetInput, { target: { value: '' } });
    fireEvent.click(screen.getByTestId('build-dimension-back-to-list-button'));

    expect(screen.getByTestId('build-dimension-select-list')).toBeInTheDocument();
    expect(within(screen.getByTestId('build-dimension-select-0')).getByText('≥80')).toBeInTheDocument();
    expect(checkbox('build-dimension-checkbox-2')).toBeChecked();
  });

  it('creates only the selected drafts and reports them in one call', async () => {
    const { onSaved, onClose } = renderModal();
    await generate();

    fireEvent.click(checkbox('build-dimension-checkbox-0'));
    fireEvent.click(checkbox('build-dimension-checkbox-2'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('build-dimension-save-button'));
    });

    expect(api.create).toHaveBeenCalledTimes(2);
    expect(api.create.mock.calls.map(([{ body }]) => body.name)).toEqual(['Politeness', 'Grounded']);
    expect(api.create.mock.calls[0][0].body.default_weight).toBe(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onSaved.mock.calls[0][0]).toHaveLength(2);
    expect(onSaved.mock.calls[0][0][0]).toMatchObject({
      dimension: { name: 'Politeness' },
      evidenceScope: { output: true },
      engine: 'ai',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('opens an incomplete selected draft instead of creating it', async () => {
    api.generate.mockImplementation(() =>
      mutationResult(
        Promise.resolve({ dimensions: [{ ...GENERATED[0], default_target: null }, GENERATED[1]] }),
      ),
    );
    renderModal();
    await generate();

    fireEvent.click(checkbox('build-dimension-select-all'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('build-dimension-save-button'));
    });

    expect(api.create).not.toHaveBeenCalled();
    expect(screen.getByTestId('build-dimension-form-errors-alert')).toBeInTheDocument();
  });

  it('keeps failed drafts in the list so they can be retried', async () => {
    api.create.mockImplementation(({ body }) =>
      mutationResult(
        body.name === 'Valid JSON'
          ? Promise.reject({ data: { error: 'Name already exists' } })
          : Promise.resolve({ id: 1, ...body }),
      ),
    );
    const { onSaved, onClose } = renderModal();
    await generate();

    fireEvent.click(checkbox('build-dimension-checkbox-0'));
    fireEvent.click(checkbox('build-dimension-checkbox-1'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('build-dimension-save-button'));
    });

    expect(onSaved.mock.calls[0][0]).toHaveLength(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('build-dimension-save-error')).toBeInTheDocument();
    expect(screen.queryByTestId('build-dimension-select-0')).not.toBeInTheDocument();
    expect(checkbox('build-dimension-checkbox-1')).toBeChecked();
    expect(screen.getByText('Select all (2)')).toBeInTheDocument();
  });

  it('stays open and locks the list while the selected drafts are being created', async () => {
    let resolveCreate;
    api.create.mockImplementation(({ body }) =>
      mutationResult(
        new Promise(resolve => {
          resolveCreate = () => resolve({ id: 1, ...body });
        }),
      ),
    );
    const { onClose, onSaved } = renderModal();
    await generate();

    fireEvent.click(checkbox('build-dimension-checkbox-0'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('build-dimension-save-button'));
    });

    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).not.toHaveBeenCalled();
    expect(checkbox('build-dimension-checkbox-1')).toBeDisabled();
    expect(checkbox('build-dimension-select-all')).toBeDisabled();
    fireEvent.click(screen.getByTestId('build-dimension-select-1'));
    expect(screen.getByTestId('build-dimension-select-list')).toBeInTheDocument();

    await act(async () => {
      resolveCreate();
    });

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('returns to the prompt with the text kept on "Refine Prompt"', async () => {
    renderModal();
    await generate('Check tone');

    fireEvent.click(screen.getByTestId('build-dimension-refine-prompt-button'));

    expect(screen.getByTestId('build-dimension-prompt-input')).toHaveValue('Check tone');
  });
});
