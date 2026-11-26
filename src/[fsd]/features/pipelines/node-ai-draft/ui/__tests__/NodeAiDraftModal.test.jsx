// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react';

import NodeAiDraftModal from '../NodeAiDraftModal';

const { mocks } = vi.hoisted(() => ({
  mocks: { draft: null, apply: vi.fn(), applyError: null, yaml: { nodes: [] } },
}));

vi.mock('@/[fsd]/features/pipelines/node-ai-draft/lib/hooks', () => ({
  useNodeAiDraft: () => mocks.draft,
  useApplyNodeDraft: () => ({ apply: mocks.apply, error: mocks.applyError }),
}));
vi.mock('@/[fsd]/features/pipelines/flow-editor/lib/hooks', () => ({
  useNodeAiAssistantConfig: () => ({ model_name: 'gpt-5-mini' }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/api/configurations', async importOriginal => ({
  ...(await importOriginal()),
  useListModelsQuery: () => ({ data: { items: [{ name: 'gpt-5-mini', display_name: 'GPT-5 mini' }] } }),
}));
vi.mock('formik', () => ({
  useFormikContext: () => ({
    values: { id: 5, version_details: { id: 50, llm_settings: { model_name: 'gpt-5-mini' } } },
  }),
}));
vi.mock('../NodeAiRequirementStep', () => ({
  default: props => (
    <div
      data-testid="requirement-step"
      data-model={props.modelName}
      data-mode={props.mode}
    >
      <button
        data-testid="requirement-cancel"
        onClick={props.onCancel}
      />
    </div>
  ),
}));
vi.mock('../NodeAiReviewStep', () => ({
  default: props => (
    <div data-testid="review-step">
      <button
        data-testid="review-apply"
        onClick={() => props.apply()}
      />
      <button
        data-testid="review-apply-typed"
        onClick={() => props.apply({ id: 'summarize', type: 'llm', transition: 'typed' })}
      />
      <button
        data-testid="review-tools"
        onClick={() => props.onToolsChange([{ id: 9 }])}
      />
    </div>
  ),
}));

const theme = createTheme({ palette: darkPalette });
const NODE = { id: 'summarize', type: 'llm' };

const draftState = (overrides = {}) => ({
  step: 'requirement',
  requirement: '',
  hasDraft: false,
  draft: null,
  error: null,
  generate: vi.fn(),
  stop: vi.fn(),
  ...overrides,
});

const renderModal = (props = {}) => {
  const onClose = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <FlowEditorContext.Provider value={{ yamlJsonObject: mocks.yaml }}>
        <NodeAiDraftModal
          open
          mode="build"
          yamlNode={NODE}
          NodeComponent={() => null}
          onClose={onClose}
          {...props}
        />
      </FlowEditorContext.Provider>
    </ThemeProvider>,
  );
  return { onClose };
};

describe('NodeAiDraftModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.applyError = null;
    mocks.yaml = { nodes: [NODE] };
  });
  afterEach(() => cleanup());

  it('titles the modal by node and mode and shows the model display name (AC-2, AC-7)', () => {
    mocks.draft = draftState();
    renderModal();
    expect(screen.getByTestId('node-ai-modal-title-text')).toHaveTextContent('summarize - Build with AI');
    expect(screen.getByTestId('requirement-step')).toHaveAttribute('data-model', 'GPT-5 mini');
    cleanup();
    renderModal({ mode: 'edit' });
    expect(screen.getByTestId('node-ai-modal-title-text')).toHaveTextContent('summarize - Edit with AI');
  });

  it('shows the review step for a draft', () => {
    mocks.draft = draftState({ step: 'review', hasDraft: true, draft: { node: NODE } });
    renderModal();
    expect(screen.getByTestId('review-step')).toBeInTheDocument();
  });

  it('shows the error with Try again (AC-33, AC-34)', () => {
    const generate = vi.fn();
    mocks.draft = draftState({
      step: 'error',
      error: { message: 'Generating took too long.', canRetry: true },
      generate,
    });
    renderModal();
    expect(screen.getByTestId('node-ai-error')).toHaveTextContent('Generating took too long.');
    fireEvent.click(screen.getByTestId('node-ai-try-again-button'));
    expect(generate).toHaveBeenCalled();
  });

  it('hides Try again for errors a retry can not fix', () => {
    mocks.draft = draftState({ step: 'error', error: { message: 'Too large.', canRetry: false } });
    renderModal();
    expect(screen.queryByTestId('node-ai-try-again-button')).toBeNull();
  });

  it('closes at once without a draft and asks first with one (AC-27)', async () => {
    mocks.draft = draftState();
    const first = renderModal();
    fireEvent.click(screen.getByTestId('requirement-cancel'));
    expect(first.onClose).toHaveBeenCalled();
    cleanup();

    mocks.draft = draftState({ step: 'requirement', hasDraft: true, draft: { node: NODE } });
    const second = renderModal();
    fireEvent.click(screen.getByTestId('requirement-cancel'));
    expect(screen.getByText('Discard this draft?')).toBeInTheDocument();
    expect(second.onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Keep reviewing'));
    await waitForElementToBeRemoved(() => screen.queryByText('Discard this draft?'));
    fireEvent.click(screen.getByTestId('requirement-cancel'));
    fireEvent.click(screen.getByText('Discard'));
    expect(second.onClose).toHaveBeenCalled();
  });

  it('applies the draft with the sandbox tools and closes (AC-24)', async () => {
    mocks.apply.mockResolvedValue(true);
    const draft = { node: NODE };
    mocks.draft = draftState({ step: 'review', hasDraft: true, draft });
    const { onClose } = renderModal();
    fireEvent.click(screen.getByTestId('review-tools'));
    await act(async () => fireEvent.click(screen.getByTestId('review-apply')));
    expect(mocks.apply).toHaveBeenCalledWith(draft, [{ id: 9 }]);
    expect(onClose).toHaveBeenCalled();
  });

  it('applies the node the review step hands over (review #1)', async () => {
    mocks.apply.mockResolvedValue(true);
    mocks.draft = draftState({ step: 'review', hasDraft: true, draft: { node: NODE, summary: 's' } });
    renderModal();
    await act(async () => fireEvent.click(screen.getByTestId('review-apply-typed')));
    expect(mocks.apply).toHaveBeenCalledWith(
      { node: { id: 'summarize', type: 'llm', transition: 'typed' }, summary: 's' },
      null,
    );
  });

  it('stays open and shows why when Apply is refused (AC-29)', async () => {
    mocks.apply.mockResolvedValue(false);
    mocks.applyError = 'This node changed while you were reviewing. Generate a new draft.';
    mocks.draft = draftState({ step: 'review', hasDraft: true, draft: { node: NODE } });
    const { onClose } = renderModal();
    await act(async () => fireEvent.click(screen.getByTestId('review-apply')));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('node-ai-error')).toHaveTextContent(
      'This node changed while you were reviewing.',
    );
  });
});
