// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SocketContext } from '@/[fsd]/shared/lib/context';
import { act, cleanup, render } from '@testing-library/react';

import SkillTestPanel from '../SkillTestPanel';

const AUTO_SELECTION = vi.hoisted(() => ({ mode: 'auto', profile_ref: { id: 'quality-auto', revision: 1 } }));
const MODELS = vi.hoisted(() => [
  { name: 'haiku', project_id: 1, default: true },
  { name: 'sonnet', project_id: 1 },
  { id: 'auto', name: 'auto', selection: AUTO_SELECTION },
]);
const fixture = vi.hoisted(() => ({
  skillModels: { models: MODELS, defaultModel: MODELS[0] },
  versionModel: MODELS[0],
  canEditVersionModel: true,
  generateContent: vi.fn(() => ({ unwrap: () => Promise.resolve({ task_id: 't1' }) })),
  values: {},
  inputProps: null,
  onSelectVersionModel: vi.fn(),
  onSetVersionLLMSettings: vi.fn(),
}));

vi.mock('formik', () => ({
  useFormikContext: () => ({ values: fixture.values }),
}));
vi.mock('react-redux', () => ({ useSelector: () => ({}) }));
vi.mock('@/[fsd]/features/chat', () => ({
  BudgetWarningBanner: () => null,
  ChatButton: { ClearChatButton: () => null },
  ChatMessageList: () => null,
  VoiceMiniPlayer: () => null,
  useBudgetWarning: () => ({ shouldShow: false }),
  useReadAloud: () => ({}),
}));
vi.mock('@/[fsd]/features/chat/lib/helpers', async importOriginal => ({
  ...(await importOriginal()),
  normalizeContinuationError: vi.fn(),
}));
vi.mock('@/common/initializeNewMessages', () => ({
  initializeNewMessages: () => [{ internal_id: 'question' }, { internal_id: 'answer' }],
}));
vi.mock('@/components/Chat/StyledComponents', () => ({ ChatBodyContainer: ({ children }) => children }));
vi.mock('@/pages/Common/Components/StyledComponents', () => ({
  ContentContainer: ({ children }) => children,
}));
vi.mock('@/[fsd]/features/chat/ui/chat-input', () => ({
  NewChatInput: props => {
    fixture.inputProps = props;
    return null;
  },
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useSkillModels: () => fixture.skillModels,
  useSkillVersionModel: () => ({
    selectedModel: fixture.versionModel,
    canEditVersionModel: fixture.canEditVersionModel,
    onSelectModel: fixture.onSelectVersionModel,
    onSetLLMSettings: fixture.onSetVersionLLMSettings,
  }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }),
}));
vi.mock('@/api/llm', () => ({
  useGenerateContentStreamingMutation: () => [fixture.generateContent],
  useStopLlmTaskMutation: () => [vi.fn()],
}));
vi.mock('@/common/utils', () => ({ buildErrorMessage: vi.fn() }));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/hooks/useSocket', () => ({
  useManualSocket: () => ({ subscribe: vi.fn(), unsubscribe: vi.fn() }),
}));
vi.mock('@/components/Chat/FullScreenToggle', () => ({ default: () => null }));

const SAVED_RUN_SETTINGS = { llm_settings: { model_name: 'haiku', model_project_id: 1 } };

const SOCKET = { id: 'sid-1' };

const renderPanel = (canEditVersionModel, runSettings = SAVED_RUN_SETTINGS) => {
  fixture.canEditVersionModel = canEditVersionModel;
  fixture.values = { name: 'Reviewer', version_details: { run_settings: runSettings } };
  return render(
    <SocketContext.Provider value={SOCKET}>
      <SkillTestPanel />
    </SocketContext.Provider>,
  );
};

describe('SkillTestPanel model chip', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    fixture.versionModel = MODELS[0];
  });

  it('edits the model of an editable version, like the agent chat pane', async () => {
    renderPanel(true);

    await act(async () => fixture.inputProps.onSelectModel(MODELS[1]));
    await act(async () => fixture.inputProps.onSetLLMSettings({ max_tokens: 8192 }));

    expect(fixture.onSelectVersionModel).toHaveBeenCalledWith(MODELS[1]);
    expect(fixture.onSetVersionLLMSettings).toHaveBeenCalledWith({ max_tokens: 8192 });
  });

  it('keeps the model to this test when the version model cannot be edited', async () => {
    renderPanel(false);

    await act(async () => fixture.inputProps.onSelectModel(MODELS[1]));

    expect(fixture.onSelectVersionModel).not.toHaveBeenCalled();
    expect(fixture.inputProps.selectedModel).toBe(MODELS[1]);
  });

  it('runs an Auto version on Auto, routed as the agent task a skill run is', async () => {
    const selection = AUTO_SELECTION;
    fixture.versionModel = { id: 'auto', name: 'auto', selection };
    renderPanel(true, { llm_settings: { selection, max_tokens: 4096 } });

    await act(async () => fixture.inputProps.onSend('hello'));

    expect(fixture.generateContent.mock.calls[0][0].llm_settings).toMatchObject({
      selection,
      model_name: null,
      max_tokens: 4096,
    });
    expect(fixture.generateContent.mock.calls[0][0].routing_surface).toBe('agent');
  });

  it('tests on the project default when the version model is not available, like Run', async () => {
    fixture.versionModel = { name: 'unshared-model', project_id: 9 };
    renderPanel(true, { llm_settings: { model_name: 'unshared-model', model_project_id: 9 } });

    await act(async () => fixture.inputProps.onSend('hello'));

    expect(fixture.inputProps.selectedModel).toBe(MODELS[0]);
    expect(fixture.generateContent.mock.calls[0][0].llm_settings).toMatchObject({
      model_name: 'haiku',
      model_project_id: 1,
    });
  });

  it('tests on the project default when the saved model belongs to another project, like Run', async () => {
    renderPanel(true, { llm_settings: { model_name: 'sonnet', model_project_id: 9 } });

    await act(async () => fixture.inputProps.onSend('hello'));

    expect(fixture.inputProps.selectedModel).toBe(MODELS[0]);
    expect(fixture.generateContent.mock.calls[0][0].llm_settings).toMatchObject({ model_name: 'haiku' });
  });
});
