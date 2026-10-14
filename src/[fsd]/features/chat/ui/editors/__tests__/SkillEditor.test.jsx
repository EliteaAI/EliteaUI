// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, render } from '@testing-library/react';

import SkillEditor from '../SkillEditor';

const captured = vi.hoisted(() => ({ onSaved: null, canvasSkill: null, initialValues: null }));
const DEFAULT_MODEL = vi.hoisted(() => ({ name: 'haiku', project_id: 1 }));
const models = vi.hoisted(() => ({ isLoadingModels: false }));

vi.mock('@/[fsd]/features/chat/ui/editors/BaseEditor', () => ({
  default: ({ saveButton, children, initialValues }) => {
    captured.initialValues = initialValues;
    return (
      <>
        {saveButton}
        {children}
      </>
    );
  },
}));
vi.mock('@/[fsd]/features/chat/ui/editors/SkillEditorSaveButton', () => ({
  default: ({ onModelSaved }) => {
    captured.onSaved = onModelSaved;
    return null;
  },
}));
vi.mock('@/[fsd]/features/chat/ui/editors/SkillCanvasModelSelector', () => ({
  default: ({ skill }) => {
    captured.canvasSkill = skill;
    return null;
  },
}));
vi.mock('@/[fsd]/features/skill/api', () => ({ useSkillDetailsQuery: () => ({ data: undefined }) }));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useSkillModels: () => ({ defaultModel: DEFAULT_MODEL, isLoadingModels: models.isLoadingModels }),
}));
vi.mock('@/[fsd]/features/skill/lib/validation', () => ({ SkillValidateSchema: {} }));
vi.mock('@/[fsd]/features/skill/ui', () => ({ CreateSkillForm: () => <div data-testid="skill-form" /> }));
vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 2 }));

const skill = llmSettings => ({
  id: 4,
  entity_name: 'skill',
  entity_meta: { id: 174 },
  entity_settings: { version_id: 8, ...(llmSettings ? { llm_settings: llmSettings } : {}) },
});

describe('SkillEditor initial values', () => {
  afterEach(() => cleanup());

  it('pins the project default model on a version without one', () => {
    render(
      <SkillEditor
        skill={skill()}
        isVisible
      />,
    );

    expect(captured.initialValues.version_details.run_settings.llm_settings).toMatchObject({
      model_name: 'haiku',
      model_project_id: 1,
    });
  });
});

describe('SkillEditor while the models load', () => {
  afterEach(() => {
    cleanup();
    models.isLoadingModels = false;
  });

  it('holds the form back so a late default model cannot reset typed edits', () => {
    models.isLoadingModels = true;
    const { queryByTestId } = render(
      <SkillEditor
        skill={skill()}
        isVisible
      />,
    );

    expect(queryByTestId('skill-form')).toBeNull();
  });
});

describe('SkillEditor save', () => {
  afterEach(() => {
    cleanup();
    captured.onSaved = null;
  });

  it("drops the chat's model so the saved version model takes effect", async () => {
    const onChangeSkillSettings = vi.fn();
    render(
      <SkillEditor
        skill={skill({ model_name: 'sonnet' })}
        isVisible
        onChangeSkillSettings={onChangeSkillSettings}
      />,
    );

    await act(async () => captured.onSaved());

    const [saved, hasBeenChanged] = onChangeSkillSettings.mock.calls[0];
    expect(hasBeenChanged).toBe(true);
    expect(saved.entity_settings).toEqual({ version_id: 8, llm_settings: undefined });
  });

  it('leaves the chat alone when it has no model of its own', async () => {
    const onChangeSkillSettings = vi.fn();
    render(
      <SkillEditor
        skill={skill()}
        isVisible
        onChangeSkillSettings={onChangeSkillSettings}
      />,
    );

    await act(async () => captured.onSaved());

    expect(onChangeSkillSettings).not.toHaveBeenCalled();
  });
});

describe('SkillEditor dirty state', () => {
  afterEach(() => cleanup());

  it('reports clean once closed, not when its callback changes', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = render(
      <SkillEditor
        skill={skill()}
        isVisible
        onDirtyStateChange={first}
      />,
    );
    rerender(
      <SkillEditor
        skill={skill()}
        isVisible
        onDirtyStateChange={second}
      />,
    );
    expect(first).not.toHaveBeenCalledWith(false);

    unmount();

    expect(second).toHaveBeenCalledWith(false);
  });
});
