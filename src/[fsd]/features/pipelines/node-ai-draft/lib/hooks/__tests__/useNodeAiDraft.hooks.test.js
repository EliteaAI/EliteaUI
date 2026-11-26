// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { NODE_DRAFT_STEPS, useNodeAiDraft } from '../useNodeAiDraft.hooks';

const { generate, abort, toastInfo } = vi.hoisted(() => ({
  generate: vi.fn(),
  abort: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock('@/[fsd]/features/pipelines/node-ai-draft/api/nodeDraftApi', () => ({
  useGeneratePipelineNodeDraftMutation: () => [generate, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useToast: () => ({ toastInfo }) }));

const DRAFT = {
  summary: 'Summarizes issues.',
  node: { id: 'summarize', type: 'llm', transition: 'END' },
  changed_paths: ['transition'],
  attachments: [],
  new_state: [{ name: 'summary', type: 'str' }],
  warnings: [],
};

// RTK returns a request with abort() and unwrap(); with an outcome it settles once unwrap() is awaited
const request = outcome => {
  const settle = {};
  const promise = new Promise((resolve, reject) => Object.assign(settle, { resolve, reject }));
  return {
    // A real RTK abort rejects unwrap() with an AbortError
    abort: () => {
      abort();
      settle.reject?.({ name: 'AbortError' });
    },
    settle,
    unwrap: () => {
      if (outcome) (outcome.error ? settle.reject : settle.resolve)(outcome.error || outcome);
      return promise;
    },
  };
};

const OPTIONS = {
  projectId: 2,
  applicationId: 5,
  versionId: 50,
  mode: 'build',
  node: { id: 'summarize', type: 'llm' },
  pipelineYaml: 'nodes: []',
  llmSettings: { model_name: 'gpt-5-mini' },
};

const render = (options = OPTIONS) => renderHook(() => useNodeAiDraft(options));

describe('useNodeAiDraft', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('starts on the requirement step with an empty requirement', () => {
    const { result } = render();
    expect(result.current.step).toBe(NODE_DRAFT_STEPS.requirement);
    expect(result.current.canGenerate).toBe(false);
  });

  it('only allows generating a non-blank requirement up to 2,000 characters', () => {
    const { result } = render();
    act(() => result.current.setRequirement('   '));
    expect(result.current.canGenerate).toBe(false);
    act(() => result.current.setRequirement('x'.repeat(2001)));
    expect(result.current.requirement).toHaveLength(2000);
    expect(result.current.charactersLeft).toBe(0);
    act(() => result.current.setRequirement('Summarize'));
    expect(result.current.canGenerate).toBe(true);
  });

  it('sends the request body and shows the draft', async () => {
    generate.mockReturnValue(request(DRAFT));
    const { result } = render();
    act(() => result.current.setRequirement('  Summarize the issues '));
    await act(async () => result.current.generate());

    expect(generate).toHaveBeenCalledWith({
      projectId: 2,
      application_id: 5,
      version_id: 50,
      node_id: 'summarize',
      node_type: 'llm',
      mode: 'build',
      requirement: 'Summarize the issues',
      current_node: { id: 'summarize', type: 'llm' },
      pipeline_yaml: 'nodes: []',
      llm_settings: { model_name: 'gpt-5-mini' },
    });
    expect(result.current.step).toBe(NODE_DRAFT_STEPS.review);
    expect(result.current.draft.node).toEqual(DRAFT.node);
    expect(result.current.draft.newState).toEqual([{ name: 'summary', type: 'str', checked: true }]);
    expect(result.current.isDraftEdited).toBe(false);
  });

  it('sends only one request on a double click', async () => {
    generate.mockReturnValue(request());
    const { result } = render();
    act(() => result.current.setRequirement('Summarize'));
    act(() => {
      result.current.generate();
      result.current.generate();
    });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(result.current.step).toBe(NODE_DRAFT_STEPS.generating);
  });

  it('stops: aborts, returns to the requirement with the text kept and a toast', async () => {
    generate.mockReturnValue(request());
    const { result } = render();
    act(() => result.current.setRequirement('Summarize'));
    act(() => {
      // left pending on purpose: returning the promise would turn this into an un-awaited async act
      result.current.generate();
    });
    await act(async () => result.current.stop());

    expect(abort).toHaveBeenCalled();
    expect(result.current.step).toBe(NODE_DRAFT_STEPS.requirement);
    expect(result.current.requirement).toBe('Summarize');
    expect(toastInfo).toHaveBeenCalledWith('Generation stopped.');
  });

  it('cancels silently when the modal closes during generation', async () => {
    generate.mockReturnValue(request());
    const { result, unmount } = render();
    act(() => result.current.setRequirement('Summarize'));
    act(() => {
      // left pending on purpose: returning the promise would turn this into an un-awaited async act
      result.current.generate();
    });
    await act(async () => unmount());
    expect(abort).toHaveBeenCalled();
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it.each([
    [
      { status: 504, data: { error: 'Generating took too long. Try again or simplify the request.' } },
      'Generating took too long. Try again or simplify the request.',
      true,
    ],
    [
      { status: 422, data: { error: "The AI couldn't produce a valid node.", details: [] } },
      "The AI couldn't produce a valid node.",
      true,
    ],
    [
      { status: 413, data: { error: 'This pipeline is too large for AI drafting.' } },
      'This pipeline is too large for AI drafting.',
      false,
    ],
    [
      { status: 400, data: { error: "Model 'x' is not available in project 2.", code: 'model_unavailable' } },
      "Model 'x' is not available in project 2. Choose another model in the pipeline settings.",
      false,
    ],
    [{ status: 'FETCH_ERROR', error: 'TypeError' }, 'Something went wrong. Try again.', true],
  ])('maps the error %#', async (error, message, canRetry) => {
    generate.mockReturnValue(request({ error }));
    const { result } = render();
    act(() => result.current.setRequirement('Summarize'));
    await act(async () => result.current.generate());

    expect(result.current.step).toBe(NODE_DRAFT_STEPS.error);
    expect(result.current.error).toEqual({ message, canRetry });
  });

  it('tracks user edits to the draft and resets them on a new draft', async () => {
    generate.mockReturnValue(request(DRAFT));
    const { result } = render();
    act(() => result.current.setRequirement('Summarize'));
    await act(async () => result.current.generate());

    act(() => result.current.updateDraftNode({ ...DRAFT.node, transition: 'next' }));
    expect(result.current.isDraftEdited).toBe(true);
    expect(result.current.draft.node.transition).toBe('next');

    generate.mockReturnValue(request(DRAFT));
    await act(async () => result.current.regenerate());
    expect(result.current.isDraftEdited).toBe(false);
    expect(generate).toHaveBeenLastCalledWith(expect.objectContaining({ requirement: 'Summarize' }));
  });

  it('toggles new state variables', async () => {
    generate.mockReturnValue(request(DRAFT));
    const { result } = render();
    act(() => result.current.setRequirement('Summarize'));
    await act(async () => result.current.generate());
    act(() => result.current.toggleNewState('summary'));
    expect(result.current.draft.newState[0].checked).toBe(false);
  });

  it('goes back to the requirement keeping the text', async () => {
    generate.mockReturnValue(request(DRAFT));
    const { result } = render();
    act(() => result.current.setRequirement('Summarize'));
    await act(async () => result.current.generate());
    act(() => result.current.back());
    expect(result.current.step).toBe(NODE_DRAFT_STEPS.requirement);
    expect(result.current.requirement).toBe('Summarize');
    expect(result.current.hasDraft).toBe(true);
  });
});
