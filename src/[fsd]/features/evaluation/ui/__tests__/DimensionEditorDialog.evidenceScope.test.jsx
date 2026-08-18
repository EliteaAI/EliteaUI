// @vitest-environment jsdom
//
// UI coverage for evidence-scope selection at dimension-creation time: previously the only
// place to set evidence_scope was "Edit binding" AFTER a binding was silently attached with
// whatever the backend default was — this dialog now lets an author pick the scope while
// creating a new dimension, and threads it out via a second onSaved argument.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import DimensionEditorDialog from '../DimensionEditorDialog';

const createDimension = vi.fn(() => ({ unwrap: () => Promise.resolve({ id: 99 }) }));
const updateDimension = vi.fn(() => ({ unwrap: () => Promise.resolve({ id: 5 }) }));

vi.mock('../../api', () => ({
  useCreateEvalDimensionMutation: () => [createDimension, { isLoading: false }],
  useUpdateEvalDimensionMutation: () => [updateDimension, { isLoading: false }],
}));

vi.mock('@/[fsd]/shared/ui', async () => {
  const actual = await vi.importActual('@/[fsd]/shared/ui');
  return {
    ...actual,
    Modal: {
      BaseModal: ({ open, content, actions }) =>
        open ? (
          <div>
            {content}
            {actions}
          </div>
        ) : null,
    },
  };
});

// Rendered as a native select so a test can actually pick a value — polarity is a required
// choice, so a stubbed-out select would block Save.
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: props => (
    <select
      data-testid={props['data-testid']}
      value={props.value ?? ''}
      onChange={event => props.onValueChange?.(event.target.value)}
    >
      <option value="" />
      {(props.options ?? []).map(option => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const evidenceCheckbox = key => screen.getByTestId(`dimension-evidence-${key}`).querySelector('input');

const pickPolarity = (value = 'higher_better') =>
  fireEvent.change(screen.getByTestId('dimension-polarity-select'), { target: { value } });

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('DimensionEditorDialog — evidence scope on creation', () => {
  it('shows evidence-scope checkboxes with defaults when creating a new dimension', () => {
    render(
      <DimensionEditorDialog
        open
        onClose={vi.fn()}
        projectId={2}
        dimension={null}
        onSaved={vi.fn()}
      />,
    );
    // Output-only by default: most dimensions judge the answer, and pre-checking `input` made
    // every new dimension ship the prompt to the judge whether or not it mattered.
    expect(evidenceCheckbox('input')).toHaveProperty('checked', false);
    expect(evidenceCheckbox('output')).toHaveProperty('checked', true);
    expect(evidenceCheckbox('structure')).toHaveProperty('checked', false);
  });

  it('hides evidence-scope checkboxes when editing an existing dimension', () => {
    render(
      <DimensionEditorDialog
        open
        onClose={vi.fn()}
        projectId={2}
        dimension={{ id: 5, name: 'Correctness', allowed_engines: ['ai'], scale_type: 'continuous' }}
        onSaved={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('dimension-evidence-input')).toBeNull();
  });

  it('creating with structure-only scope passes the selected evidence_scope to onSaved', async () => {
    const onSaved = vi.fn();
    render(
      <DimensionEditorDialog
        open
        onClose={vi.fn()}
        projectId={2}
        dimension={null}
        onSaved={onSaved}
      />,
    );

    fireEvent.change(screen.getByTestId('dimension-name-input').querySelector('input'), {
      target: { value: 'Instructions structure' },
    });

    pickPolarity();
    fireEvent.click(evidenceCheckbox('output'));
    fireEvent.click(evidenceCheckbox('structure'));

    fireEvent.click(screen.getByTestId('dimension-editor-save'));
    await vi.waitFor(() => expect(createDimension).toHaveBeenCalledTimes(1));

    expect(onSaved).toHaveBeenCalledWith({ id: 99 }, { structure: true, input: false, output: false });
  });

  it('editing an existing dimension calls onSaved with only the result (no evidence_scope)', async () => {
    const onSaved = vi.fn();
    render(
      <DimensionEditorDialog
        open
        onClose={vi.fn()}
        projectId={2}
        dimension={{ id: 5, name: 'Correctness', allowed_engines: ['ai'], scale_type: 'continuous' }}
        onSaved={onSaved}
      />,
    );

    pickPolarity();
    fireEvent.click(screen.getByTestId('dimension-editor-save'));
    await vi.waitFor(() => expect(updateDimension).toHaveBeenCalledTimes(1));

    expect(onSaved).toHaveBeenCalledWith({ id: 5 });
  });
});
