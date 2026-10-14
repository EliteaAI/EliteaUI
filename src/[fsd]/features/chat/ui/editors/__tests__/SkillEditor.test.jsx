// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, render } from '@testing-library/react';

import SkillEditor from '../SkillEditor';

const captured = vi.hoisted(() => ({ onSaved: null, canvasSkill: null }));

vi.mock('@/[fsd]/features/chat/ui/editors/BaseEditor', () => ({
  default: ({ saveButton, children }) => (
    <>
      {saveButton}
      {children}
    </>
  ),
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
vi.mock('@/[fsd]/features/skill/lib/validation', () => ({ SkillValidateSchema: {} }));
vi.mock('@/[fsd]/features/skill/ui', () => ({ CreateSkillForm: () => null }));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 2 }));

const skill = llmSettings => ({
  id: 4,
  entity_name: 'skill',
  entity_meta: { id: 174 },
  entity_settings: { version_id: 8, ...(llmSettings ? { llm_settings: llmSettings } : {}) },
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
