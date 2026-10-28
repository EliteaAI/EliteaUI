// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SocketContext } from '@/[fsd]/shared/lib/context';
import { SocketMessageType } from '@/common/constants';
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
  initialValues: {},
  maxInstructionsLength: 1200,
  inputProps: null,
  messageListProps: null,
  onSocketEvent: null,
  toastError: vi.fn(),
  onSelectVersionModel: vi.fn(),
  onSetVersionLLMSettings: vi.fn(),
}));

vi.mock('formik', () => ({
  useFormikContext: () => ({ values: fixture.values, initialValues: fixture.initialValues }),
}));
vi.mock('react-redux', () => ({ useSelector: () => ({}) }));
vi.mock('@/[fsd]/features/chat', () => ({
  BudgetWarningBanner: () => null,
  ChatButton: { ClearChatButton: () => null },
  ChatMessageList: props => {
    fixture.messageListProps = props;
    return null;
  },
  VoiceMiniPlayer: () => null,
  useBudgetWarning: () => ({ shouldShow: false }),
  useReadAloud: () => ({}),
}));
vi.mock('@/[fsd]/features/chat/lib/helpers', async importOriginal => ({
  ...(await importOriginal()),
  normalizeContinuationError: vi.fn(),
}));
vi.mock('@/common/initializeNewMessages', () => ({
  initializeNewMessages: ({ question }) => [
    { internal_id: 'question', id: 'question', role: 'user', content: question },
    { internal_id: 'answer', question_id: 'question', role: 'assistant' },
  ],
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
  useSkillInstructionsMaxLength: () => fixture.maxInstructionsLength,
  useSkillModels: () => fixture.skillModels,
  useSkillVersionModel: () => ({
    selectedModel: fixture.versionModel,
    canEditVersionModel: fixture.canEditVersionModel,
    onSelectModel: fixture.onSelectVersionModel,
    onSetLLMSettings: fixture.onSetVersionLLMSettings,
  }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 2,
  useToast: () => ({ toastError: fixture.toastError, toastInfo: vi.fn() }),
}));
vi.mock('@/api/llm', () => ({
  useGenerateContentStreamingMutation: () => [fixture.generateContent],
  useStopLlmTaskMutation: () => [vi.fn()],
}));
vi.mock('@/common/utils', () => ({ buildErrorMessage: vi.fn() }));
vi.mock('@/[fsd]/features/auth/lib/hooks/useRunActiveSignal.hooks', () => ({ useRunActiveSignal: vi.fn() }));
vi.mock('@/[fsd]/features/auth/lib/hooks/useSocket.hooks', () => ({
  useManualSocket: (_event, onEvent) => {
    fixture.onSocketEvent = onEvent;
    return { subscribe: vi.fn(), unsubscribe: vi.fn() };
  },
}));
vi.mock('@/components/Chat/FullScreenToggle', () => ({ default: () => null }));

const SAVED_RUN_SETTINGS = { llm_settings: { model_name: 'haiku', model_project_id: 1 } };

const SOCKET = { id: 'sid-1' };

const PANEL = (
  <SocketContext.Provider value={SOCKET}>
    <SkillTestPanel />
  </SocketContext.Provider>
);

// A fresh callback prop gets past memo, as a Formik values change does in the page
const rerenderedPanel = () => (
  <SocketContext.Provider value={SOCKET}>
    <SkillTestPanel setIsFullScreenChat={() => {}} />
  </SocketContext.Provider>
);

const finishAnswer = () =>
  act(async () =>
    fixture.onSocketEvent({ type: SocketMessageType.AgentResponse, stream_id: 's1', content: 'ok' }),
  );

const renderPanel = (canEditVersionModel, runSettings = SAVED_RUN_SETTINGS) => {
  fixture.canEditVersionModel = canEditVersionModel;
  fixture.values = { name: 'Reviewer', version_details: { run_settings: runSettings } };
  return render(PANEL);
};

const UNDER_LIMIT = 'a'.repeat(1200);
const OVER_LIMIT = 'a'.repeat(1201);

const withInstructions = (instructions, savedInstructions = UNDER_LIMIT) => {
  fixture.canEditVersionModel = true;
  fixture.values = { name: 'Reviewer', version_details: { instructions, run_settings: SAVED_RUN_SETTINGS } };
  fixture.initialValues = { version_details: { instructions: savedInstructions } };
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

  it('gives the chip the Auto selection so it shows the Auto effort picker, not a temperature', () => {
    renderPanel(true, { llm_settings: { selection: AUTO_SELECTION, max_tokens: 4096 } });

    expect(fixture.inputProps.llmSettings).toMatchObject({ selection: AUTO_SELECTION, temperature: null });
  });

  it('tests a locked Auto version on the effort picked in the panel', async () => {
    const picked = { ...AUTO_SELECTION, reasoning: { mode: 'explicit', preset: 'high' } };
    renderPanel(false, { llm_settings: { selection: AUTO_SELECTION, max_tokens: 4096 } });

    await act(async () => fixture.inputProps.onSetLLMSettings({ selection: picked }));
    await act(async () => fixture.inputProps.onSend('hello'));

    expect(fixture.generateContent.mock.calls[0][0].llm_settings.selection).toEqual(picked);
  });

  it('leaves Auto when a locked version switches to a fixed model, like the agent pane', async () => {
    renderPanel(false, { llm_settings: { selection: AUTO_SELECTION, max_tokens: 4096 } });

    await act(async () => fixture.inputProps.onSelectModel(MODELS[1]));

    expect(fixture.inputProps.llmSettings.selection).toBeNull();
    expect(fixture.inputProps.llmSettings.temperature).not.toBeNull();
  });
});

describe('SkillTestPanel instructions limit', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    fixture.initialValues = {};
  });

  it('disables sending and says why while the edited instructions are over the limit', async () => {
    withInstructions(OVER_LIMIT);
    render(PANEL);

    expect(fixture.inputProps.disabledSend).toBe(true);
    expect(fixture.inputProps.tooltipOfSendButton).toBe(
      'Instructions are 1201 characters long. Maximum allowed is 1200 characters.',
    );

    await act(async () => fixture.inputProps.onSend('run'));

    expect(fixture.generateContent).not.toHaveBeenCalled();
    expect(fixture.messageListProps.chat_history).toEqual([]);
  });

  it('blocks regenerate and edit-and-resend over the limit and says why', async () => {
    withInstructions(UNDER_LIMIT);
    const { rerender } = render(PANEL);
    await act(async () => fixture.inputProps.onSend('hello'));
    await finishAnswer();
    expect(fixture.generateContent).toHaveBeenCalledTimes(1);
    expect(fixture.messageListProps.isStreaming).toBe(false);
    const historyBefore = fixture.messageListProps.chat_history;

    withInstructions(OVER_LIMIT);
    rerender(rerenderedPanel());
    await act(async () => fixture.messageListProps.onRegenerateAnswer('answer'));
    await act(async () => fixture.messageListProps.onSubmitEditedMessage('question', 'edited'));

    expect(fixture.generateContent).toHaveBeenCalledTimes(1);
    expect(fixture.messageListProps.chat_history).toBe(historyBefore);
    expect(fixture.toastError.mock.calls).toEqual([
      ['Instructions are 1201 characters long. Maximum allowed is 1200 characters.'],
      ['Instructions are 1201 characters long. Maximum allowed is 1200 characters.'],
    ]);
  });

  it('sends again as soon as the instructions are back within the limit', async () => {
    withInstructions(OVER_LIMIT);
    const { rerender } = render(PANEL);

    withInstructions(UNDER_LIMIT);
    rerender(rerenderedPanel());
    await act(async () => fixture.inputProps.onSend('run'));

    expect(fixture.inputProps.disabledSend).toBe(false);
    expect(fixture.generateContent.mock.calls[0][0].instructions).toBe(UNDER_LIMIT);
  });

  it('still tests saved instructions that predate a lowered limit, as Save allows them', async () => {
    withInstructions(OVER_LIMIT, OVER_LIMIT);
    render(PANEL);

    await act(async () => fixture.inputProps.onSend('run'));

    expect(fixture.inputProps.disabledSend).toBe(false);
    expect(fixture.generateContent.mock.calls[0][0].instructions).toBe(OVER_LIMIT);
  });
});
