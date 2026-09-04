// @vitest-environment jsdom
//
// UI coverage for the "evaluate on input only / instructions-only" capability
// (backend: `select_evidence()` gating `output` — see AGENT_EVALUATION_IMPLEMENTATION_LOG.md,
// "output evidence-scope key was hardcoded always-on"). These tests confirm the "Output"
// checkbox is independently toggleable and that unchecking it (alone, or together with
// unchecking "Input") is what actually gets sent in the PATCH body.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import BindingDetailDialog from '../_legacy/suite/BindingDetailDialog';

const updateBinding = vi.fn(() => ({ unwrap: () => Promise.resolve({}) }));

vi.mock('../../api', () => ({
  useUpdateEvalBindingMutation: () => [updateBinding, { isLoading: false }],
}));

// Modal/Field/SingleSelect pull in CodeMirror + portal machinery that jsdom can't run;
// render them as plain pass-throughs so the test can focus on the evidence-scope checkboxes.
vi.mock('@/[fsd]/shared/ui', async () => {
  const actual = await vi.importActual('@/[fsd]/shared/ui');
  const { TextField } = await vi.importActual('@mui/material');
  return {
    ...actual,
    // InputBase pulls in useToast, which needs the redux store these tests don't mount.
    Input: { ...actual.Input, InputBase: props => <TextField {...props} /> },
    Modal: {
      BaseModal: ({ open, content, actions }) =>
        open ? (
          <div>
            {content}
            {actions}
          </div>
        ) : null,
    },
    Field: {
      CodeMirrorEditor: ({ value, notifyChange }) => (
        <textarea
          data-testid="binding-code-input"
          value={value}
          onChange={event => notifyChange(event.target.value)}
        />
      ),
    },
  };
});

vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: () => null,
}));

const DIMENSION_BINDING = {
  id: 1,
  dimension_id: 5,
  engine: 'ai',
  evidence_scope: { structure: false, input: true, output: true },
  weight: 1,
  target: '',
  target_operator: '',
};

const renderDialog = (binding = DIMENSION_BINDING) =>
  render(
    <BindingDetailDialog
      open
      onClose={vi.fn()}
      projectId={2}
      suiteId={11}
      binding={binding}
      dimensions={[{ id: 5, name: 'Correctness' }]}
    />,
  );

// MUI's data-testid lands on the checkbox's root <span>; the actual checked state
// lives on the nested <input>.
const evidenceCheckbox = key => screen.getByTestId(`binding-evidence-${key}`).querySelector('input');

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('BindingDetailDialog — evidence scope (input-only / instructions-only)', () => {
  it('renders all three evidence-scope checkboxes with the binding defaults', () => {
    renderDialog();
    expect(evidenceCheckbox('output')).toHaveProperty('checked', true);
    expect(evidenceCheckbox('input')).toHaveProperty('checked', true);
    expect(evidenceCheckbox('structure')).toHaveProperty('checked', false);
  });

  it('unchecking "Output" alone and applying submits an input-only evidence_scope', async () => {
    renderDialog();

    fireEvent.click(evidenceCheckbox('output'));
    expect(evidenceCheckbox('output')).toHaveProperty('checked', false);
    expect(evidenceCheckbox('input')).toHaveProperty('checked', true);

    fireEvent.click(screen.getByTestId('binding-editor-apply'));
    await vi.waitFor(() => expect(updateBinding).toHaveBeenCalledTimes(1));

    const [{ body }] = updateBinding.mock.calls[0];
    expect(body.evidence_scope).toEqual({ structure: false, input: true, output: false });
  });

  it('unchecking "Output" + checking "Agent structure" submits an instructions-only evidence_scope', async () => {
    renderDialog();

    fireEvent.click(evidenceCheckbox('output'));
    fireEvent.click(evidenceCheckbox('input'));
    fireEvent.click(evidenceCheckbox('structure'));

    fireEvent.click(screen.getByTestId('binding-editor-apply'));
    await vi.waitFor(() => expect(updateBinding).toHaveBeenCalledTimes(1));

    const [{ body }] = updateBinding.mock.calls[0];
    expect(body.evidence_scope).toEqual({ structure: true, input: false, output: false });
  });

  it('re-checking "Output" after it was off restores it in the submitted evidence_scope', async () => {
    const outputOffBinding = {
      ...DIMENSION_BINDING,
      evidence_scope: { structure: true, input: true, output: false },
    };
    renderDialog(outputOffBinding);

    expect(evidenceCheckbox('output')).toHaveProperty('checked', false);
    fireEvent.click(evidenceCheckbox('output'));

    fireEvent.click(screen.getByTestId('binding-editor-apply'));
    await vi.waitFor(() => expect(updateBinding).toHaveBeenCalledTimes(1));

    const [{ body }] = updateBinding.mock.calls[0];
    expect(body.evidence_scope).toEqual({ structure: true, input: true, output: true });
  });

  it('submits a plain binding update when editing a dimension binding', async () => {
    renderDialog();
    fireEvent.click(evidenceCheckbox('output'));
    fireEvent.click(screen.getByTestId('binding-editor-apply'));
    await vi.waitFor(() => expect(updateBinding).toHaveBeenCalledTimes(1));
  });
});
