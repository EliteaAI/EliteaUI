// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

const mockToastError = vi.fn();
const mockToastInfo = vi.fn();
const mockGenerate = vi.fn();
const mockEnsurePrompt = vi.fn();
let mockProjectId = 7;
let mockIsServicePromptLoading = false;
let mockModelsData = { low_tier_default_model_name: 'haiku', low_tier_default_model_project_id: 1 };

vi.mock('../useToast.hooks', () => ({
  useToast: () => ({ toastError: mockToastError, toastInfo: mockToastInfo }),
}));
vi.mock('../useSelectedProject.hooks', () => ({
  useSelectedProjectId: () => mockProjectId,
}));
vi.mock('../useServicePromptByKey.hooks', () => ({
  SERVICE_PROMPT_KEYS: { MERMAID_QUICK_FIX: 'mermaid_quick_fix' },
  useServicePromptByKey: () => ({
    isLoading: mockIsServicePromptLoading,
    ensurePrompt: mockEnsurePrompt,
  }),
}));
vi.mock('@/api/configurations.js', () => ({
  useListModelsQuery: () => ({ data: mockModelsData }),
}));
vi.mock('@/api/llm.js', () => ({
  useGenerateContentBlockingMutation: () => [mockGenerate, { isLoading: false }],
}));

const { useMermaidQuickFix } = await import('../useMermaidQuickFix.hooks');

const respondWith = result => ({ unwrap: () => Promise.resolve({ result }) });

describe('useMermaidQuickFix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectId = 7;
    mockIsServicePromptLoading = false;
    mockModelsData = { low_tier_default_model_name: 'haiku', low_tier_default_model_project_id: 1 };
    mockEnsurePrompt.mockResolvedValue({ prompt: 'BASE PROMPT', error: null });
  });

  const run = async (props, payload = { error: 'bad', code: 'graph TD' }) => {
    const { result } = renderHook(() => useMermaidQuickFix(props));
    await act(async () => {
      await result.current.handleQuickFix(payload);
    });
    return result;
  };

  it('sends the diagram to the model and hands the fixed code to onFixed', async () => {
    const onFixed = vi.fn();
    const onBeforeRequest = vi.fn();
    mockGenerate.mockReturnValueOnce(respondWith('```mermaid\ngraph LR\nA-->B\n```'));

    await run({ onFixed, onBeforeRequest });

    expect(onBeforeRequest).toHaveBeenCalledTimes(1);
    expect(mockGenerate.mock.calls[0][0]).toMatchObject({
      projectId: 7,
      llm_settings: { model_name: 'haiku', model_project_id: 1 },
    });
    expect(mockGenerate.mock.calls[0][0].user_input).toContain('BASE PROMPT');
    expect(mockGenerate.mock.calls[0][0].user_input).toContain('graph TD');
    expect(onFixed).toHaveBeenCalledWith('graph LR\nA-->B');
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('exposes the model tooltip', () => {
    const { result } = renderHook(() => useMermaidQuickFix({}));
    expect(result.current.quickFixTooltip).toBe('Quick Fix: haiku (low-tier)');
  });

  it('blocks the fix while read only', async () => {
    await run({ readOnly: true, onFixed: vi.fn() });
    expect(mockToastError).toHaveBeenCalledWith('Diagram is read-only right now');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('asks for a project when none is selected', async () => {
    mockProjectId = undefined;
    await run({ onFixed: vi.fn() });
    expect(mockToastError).toHaveBeenCalledWith('Select a project to use Quick Fix');
  });

  it('reports a missing model', async () => {
    mockModelsData = {};
    await run({ onFixed: vi.fn() });
    expect(mockToastError).toHaveBeenCalledWith('No model is available for Quick Fix');
  });

  it('tells the user the service prompt is still loading', async () => {
    mockIsServicePromptLoading = true;
    await run({ onFixed: vi.fn() });
    expect(mockToastInfo).toHaveBeenCalledWith('Loading Service Prompt…');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('says the prompt is not configured when it is missing', async () => {
    mockEnsurePrompt.mockResolvedValueOnce({ prompt: '', error: null });
    await run({ onFixed: vi.fn() });
    expect(mockToastError).toHaveBeenCalledWith('Service Prompt is not configured');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('says the prompt failed to load when the lookup errored', async () => {
    mockEnsurePrompt.mockResolvedValueOnce({ prompt: '', error: { status: 500 } });
    await run({ onFixed: vi.fn() });
    expect(mockToastError).toHaveBeenCalledWith('Failed to load the Service Prompt. Please try again.');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('does not run onBeforeRequest when the prompt is unavailable', async () => {
    const onBeforeRequest = vi.fn();
    mockEnsurePrompt.mockResolvedValueOnce({ prompt: '', error: null });
    await run({ onBeforeRequest, onFixed: vi.fn() });
    expect(onBeforeRequest).not.toHaveBeenCalled();
  });

  it('reports a task that did not finish in time', async () => {
    const onFixed = vi.fn();
    mockGenerate.mockReturnValueOnce({ unwrap: () => Promise.resolve({ task_id: 'abc' }) });
    await run({ onFixed });
    expect(mockToastError).toHaveBeenCalledWith(
      'Quick Fix is taking longer than expected. Please try again.',
    );
    expect(onFixed).not.toHaveBeenCalled();
  });

  it('reports a response with no diagram code', async () => {
    const onFixed = vi.fn();
    mockGenerate.mockReturnValueOnce(respondWith(''));
    await run({ onFixed });
    expect(mockToastError).toHaveBeenCalledWith('Quick Fix did not return Mermaid code');
    expect(onFixed).not.toHaveBeenCalled();
  });

  it('surfaces a request failure', async () => {
    const onFixed = vi.fn();
    mockGenerate.mockReturnValueOnce({ unwrap: () => Promise.reject({ data: { error: 'boom' } }) });
    await run({ onFixed });
    expect(mockToastError).toHaveBeenCalledWith('boom');
    expect(onFixed).not.toHaveBeenCalled();
  });
});
