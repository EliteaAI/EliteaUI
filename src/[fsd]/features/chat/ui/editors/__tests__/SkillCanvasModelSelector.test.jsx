// @vitest-environment jsdom
import { Formik, useFormikContext } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import SkillCanvasModelSelector from '../SkillCanvasModelSelector';

const MODELS = [
  { name: 'sonnet', project_id: 1, default: true },
  { name: 'haiku', project_id: 1 },
];

const selectorProps = vi.hoisted(() => ({ current: null }));
const access = vi.hoisted(() => ({ canUpdateSkill: true, isLoadingModels: false, hasNoModels: false }));

vi.mock('@/[fsd]/widgets/llm-model-selector', () => ({
  LLMModelSelector: props => {
    selectorProps.current = props;
    return null;
  },
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BaseBtn: ({ onClick, children, 'data-testid': testId }) => (
      <button
        onClick={onClick}
        data-testid={testId}
      >
        {children}
      </button>
    ),
  },
}));
vi.mock('@/[fsd]/shared/ui/button/BaseBtn', () => ({ BUTTON_VARIANTS: { secondary: 'secondary' } }));
vi.mock('@/api/configurations', () => ({
  useListModelsQuery: () =>
    access.isLoadingModels
      ? { data: undefined, isLoading: true }
      : { data: { items: access.hasNoModels ? [] : MODELS }, isLoading: false },
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => access.canUpdateSkill }),
}));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/[fsd]/features/skill/lib/hooks', async () => ({
  useSkillVersionModel: (await import('@/[fsd]/features/skill/lib/hooks/useSkillVersionModel.hooks'))
    .useSkillVersionModel,
}));
vi.mock('@/[fsd]/features/chat/lib/hooks', async () => ({
  useSkillChatModel: (await import('@/[fsd]/features/chat/lib/hooks/useSkillChatModel.hooks'))
    .useSkillChatModel,
}));

const skill = (entitySettings = { version_id: 8 }) => ({
  id: 4,
  entity_name: 'skill',
  entity_meta: { id: 174, project_id: 2 },
  entity_settings: entitySettings,
});

const HAIKU_SETTINGS = { model_name: 'haiku', model_project_id: 1, max_tokens: 2048 };

const formValues = (status, llmSettings, versionId = 8) => ({
  id: 174,
  version_details: {
    id: versionId,
    status,
    run_settings: { ignore_project_context: true, llm_settings: llmSettings },
  },
});

const formRef = { current: null };

const FormSpy = () => {
  formRef.current = useFormikContext();
  return null;
};

const renderSelector = (
  status,
  participant,
  onChangeSkillSettings,
  llmSettings = HAIKU_SETTINGS,
  versionId = 8,
) =>
  render(
    <Formik
      initialValues={formValues(status, llmSettings, versionId)}
      onSubmit={vi.fn()}
    >
      <>
        <SkillCanvasModelSelector
          skill={participant}
          onChangeSkillSettings={onChangeSkillSettings}
        />
        <FormSpy />
      </>
    </Formik>,
  );

describe('SkillCanvasModelSelector', () => {
  afterEach(() => {
    cleanup();
    selectorProps.current = null;
  });

  it('edits the model of an editable version in the form, not the chat', async () => {
    const onChangeSkillSettings = vi.fn();
    renderSelector(
      'draft',
      skill({ version_id: 8, llm_settings: { model_name: 'sonnet' } }),
      onChangeSkillSettings,
    );

    expect(selectorProps.current.selectedModel).toBe(MODELS[1]);
    await act(async () => selectorProps.current.onSelectModel(MODELS[0]));

    expect(onChangeSkillSettings).not.toHaveBeenCalled();
    expect(formRef.current.values.version_details.run_settings).toMatchObject({
      ignore_project_context: true,
      llm_settings: { model_name: 'sonnet', model_project_id: 1, max_tokens: 2048 },
    });
  });

  it('falls back to the project default on reset of an editable version', async () => {
    renderSelector('draft', skill(), vi.fn());

    await act(async () => selectorProps.current.onResetToDefaults());

    expect(formRef.current.values.version_details.run_settings.llm_settings).toBeNull();
  });

  it('saves the model of a published version to this chat only', async () => {
    const onChangeSkillSettings = vi.fn();
    renderSelector('published', skill(), onChangeSkillSettings);

    expect(selectorProps.current.selectedModel).toBe(MODELS[1]);
    await act(async () => selectorProps.current.onSelectModel(MODELS[0]));

    const [saved, hasBeenChanged] = onChangeSkillSettings.mock.calls[0];
    expect(hasBeenChanged).toBe(true);
    expect(saved.entity_settings).toMatchObject({ version_id: 8, llm_settings: { model_name: 'sonnet' } });
    expect(formRef.current.dirty).toBe(false);
  });

  it("drops the chat's model of a published version on reset", async () => {
    const onChangeSkillSettings = vi.fn();
    renderSelector(
      'published',
      skill({ version_id: 8, llm_settings: { model_name: 'sonnet' } }),
      onChangeSkillSettings,
    );

    expect(selectorProps.current.selectedModel).toBe(MODELS[0]);
    await act(async () => selectorProps.current.onResetToDefaults());

    const [saved] = onChangeSkillSettings.mock.calls[0];
    expect(saved.entity_settings.version_id).toBe(8);
    expect(saved.entity_settings.llm_settings).toBeUndefined();
  });

  it('locks a published version when the chat cannot save a model', () => {
    renderSelector('published', skill(), undefined);

    expect(selectorProps.current.disabled).toBe(true);
    expect(selectorProps.current.onResetToDefaults).toBeUndefined();
  });
});

describe('SkillCanvasModelSelector on the project default', () => {
  afterEach(() => cleanup());

  it('shows the project default instead of naming a model', () => {
    renderSelector('draft', skill(), vi.fn(), null);

    expect(selectorProps.current.selectedModel).toBeNull();
    expect(selectorProps.current.emptyModelLabel).toBe('Project default');
  });

  it('keeps following the project default when only settings change', async () => {
    renderSelector('draft', skill(), vi.fn(), null);

    await act(async () => selectorProps.current.onSetLLMSettings({ max_tokens: 8192 }));

    expect(formRef.current.values.version_details.run_settings.llm_settings).toEqual({ max_tokens: 8192 });
  });
});

describe('SkillCanvasModelSelector chat override on an editable version', () => {
  afterEach(() => cleanup());

  it("offers to drop the chat's own model that outranks the version model", async () => {
    const onChangeSkillSettings = vi.fn();
    renderSelector(
      'draft',
      skill({ version_id: 8, llm_settings: { model_name: 'sonnet' } }),
      onChangeSkillSettings,
    );

    fireEvent.click(screen.getByTestId('skill-canvas-use-version-model'));

    const [saved, hasBeenChanged] = onChangeSkillSettings.mock.calls[0];
    expect(hasBeenChanged).toBe(true);
    expect(saved.entity_settings).toEqual({ version_id: 8, llm_settings: undefined });
    expect(formRef.current.dirty).toBe(false);
  });

  it('stays quiet when the chat has no model of its own', () => {
    renderSelector('draft', skill(), vi.fn());
    expect(screen.queryByTestId('skill-canvas-chat-override')).not.toBeInTheDocument();
  });

  it('stays quiet when the chat cannot save', () => {
    renderSelector('draft', skill({ version_id: 8, llm_settings: { model_name: 'sonnet' } }), undefined);
    expect(screen.queryByTestId('skill-canvas-chat-override')).not.toBeInTheDocument();
  });

  it('leaves a locked version to the chip itself', () => {
    renderSelector('published', skill({ version_id: 8, llm_settings: { model_name: 'sonnet' } }), vi.fn());
    expect(screen.queryByTestId('skill-canvas-chat-override')).not.toBeInTheDocument();
  });
});

describe('SkillCanvasModelSelector access and loading', () => {
  afterEach(() => {
    cleanup();
    selectorProps.current = null;
    access.canUpdateSkill = true;
    access.isLoadingModels = false;
    access.hasNoModels = false;
  });

  it('shows the selector, not a loader, when the project has no models', () => {
    access.hasNoModels = true;
    renderSelector('draft', skill(), vi.fn(), null);

    expect(screen.queryByText('Loading models...')).not.toBeInTheDocument();
    expect(selectorProps.current.models).toEqual([]);
  });

  it('locks the version model for someone who cannot update the skill', () => {
    access.canUpdateSkill = false;
    renderSelector('draft', skill(), vi.fn());

    expect(selectorProps.current.disabled).toBe(true);
    expect(selectorProps.current.onResetToDefaults).toBeUndefined();
  });

  it('waits for the models before showing a selector', () => {
    access.isLoadingModels = true;
    renderSelector('draft', skill(), vi.fn());

    expect(screen.getByText('Loading models...')).toBeInTheDocument();
    expect(selectorProps.current).toBeNull();
  });

  it('waits for the version before choosing which selector to show', () => {
    renderSelector('published', skill(), vi.fn(), HAIKU_SETTINGS, null);

    expect(screen.getByText('Loading models...')).toBeInTheDocument();
    expect(selectorProps.current).toBeNull();
  });

  it('lets a chat whose skill follows its default version pick a model for the loaded version', async () => {
    const onChangeSkillSettings = vi.fn();
    renderSelector('published', skill({}), onChangeSkillSettings);

    expect(selectorProps.current.disabled).toBe(false);
    await act(async () => selectorProps.current.onSelectModel(MODELS[0]));

    const [saved] = onChangeSkillSettings.mock.calls[0];
    expect(saved.entity_settings).toMatchObject({ version_id: 8, llm_settings: { model_name: 'sonnet' } });
  });
});

describe('SkillCanvasModelSelector in a chat that starts', () => {
  afterEach(() => {
    cleanup();
    selectorProps.current = null;
  });

  const canvas = props => (
    <Formik
      initialValues={formValues('published', HAIKU_SETTINGS)}
      onSubmit={vi.fn()}
    >
      <SkillCanvasModelSelector
        skill={skill()}
        {...props}
      />
    </Formik>
  );

  it('explains that a new chat needs its first message before a model can be chosen', () => {
    render(canvas({ isNewConversation: true }));

    expect(selectorProps.current.disabled).toBe(true);
    expect(selectorProps.current.modelTooltip).toBe(
      'Published versions are locked. Send the first message to choose a model for this chat',
    );
  });

  it('enables the chat model once the chat exists, without reopening the canvas', () => {
    const { rerender } = render(canvas({ isNewConversation: true }));

    rerender(canvas({ isNewConversation: false, onChangeSkillSettings: vi.fn() }));

    expect(selectorProps.current.disabled).toBe(false);
    expect(selectorProps.current.modelTooltip).toBe(
      'Published versions are locked. The model applies to this chat only',
    );
  });
});
