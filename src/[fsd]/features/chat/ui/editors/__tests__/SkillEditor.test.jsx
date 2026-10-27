// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, render } from '@testing-library/react';

import SkillEditor from '../SkillEditor';

const captured = vi.hoisted(() => ({
  onSaved: null,
  onCreated: null,
  onCreatingChange: null,
  formDisabled: null,
  canvasSkill: null,
  initialValues: null,
  title: null,
  isPublic: null,
  error: null,
}));
const DEFAULT_MODEL = vi.hoisted(() => ({ name: 'haiku', project_id: 1 }));
const models = vi.hoisted(() => ({ isLoadingModels: false }));
const details = vi.hoisted(() => ({ data: undefined, error: undefined, isPublic: false }));

vi.mock('@/[fsd]/features/chat/ui/editors/BaseEditor', () => ({
  default: ({ saveButton, children, initialValues, title, isPublic, error }) => {
    captured.initialValues = initialValues;
    captured.title = title;
    captured.isPublic = isPublic;
    captured.error = error;
    return (
      <>
        {!isPublic && saveButton}
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
vi.mock('@/[fsd]/features/chat/ui/editors/SkillEditorCreateButton', () => ({
  default: ({ onSkillCreated, onCreatingChange }) => {
    captured.onCreated = onSkillCreated;
    captured.onCreatingChange = onCreatingChange;
    return <div data-testid="skill-create-button" />;
  },
}));
vi.mock('@/[fsd]/features/chat/ui/editors/SkillCanvasModelSelector', () => ({
  default: ({ skill }) => {
    captured.canvasSkill = skill;
    return <div data-testid="skill-canvas-model-selector" />;
  },
}));
vi.mock('@/[fsd]/features/chat/lib/hooks/useSkillEditorDetails.hooks', () => ({
  useSkillEditorDetails: () => ({ data: details.data, error: details.error, isPublic: details.isPublic }),
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useSkillModels: () => ({ defaultModel: DEFAULT_MODEL, isLoadingModels: models.isLoadingModels }),
  useSkillValidationSchema: () => undefined,
}));
vi.mock('@/[fsd]/features/skill/ui', () => ({
  CreateSkillForm: ({ disabled }) => {
    captured.formDisabled = disabled;
    return <div data-testid="skill-form" />;
  },
}));

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

describe('SkillEditor create mode', () => {
  afterEach(() => {
    cleanup();
    captured.onCreated = null;
  });

  it('starts from a blank skill pinned to the default model', () => {
    render(
      <SkillEditor
        isCreateMode
        isVisible
      />,
    );

    expect(captured.title).toBe('Create New Skill');
    expect(captured.initialValues).toMatchObject({ id: null, name: '', description: '' });
    expect(captured.initialValues.version_details.run_settings.llm_settings).toMatchObject({
      model_name: 'haiku',
    });
  });

  it('saves through the create button and reports the created skill', () => {
    const onSkillCreated = vi.fn();
    const { getByTestId, queryByTestId } = render(
      <SkillEditor
        isCreateMode
        isVisible
        onSkillCreated={onSkillCreated}
      />,
    );

    expect(getByTestId('skill-create-button')).toBeTruthy();
    expect(queryByTestId('skill-canvas-model-selector')).toBeNull();
    expect(captured.onCreated).toBe(onSkillCreated);
  });
});

describe('SkillEditor locks the form across the create-to-edit transition', () => {
  afterEach(() => {
    cleanup();
    details.data = undefined;
  });

  const createdSkill = {
    entity_name: 'skill',
    entity_meta: { id: 42 },
    entity_settings: { version_id: 900 },
  };

  it('keeps edits out while the create request is pending', () => {
    render(
      <SkillEditor
        isCreateMode
        isVisible
      />,
    );
    expect(captured.formDisabled).toBe(false);

    act(() => captured.onCreatingChange(true));
    expect(captured.formDisabled).toBe(true);

    act(() => captured.onCreatingChange(false));
    expect(captured.formDisabled).toBe(false);
  });

  it('keeps edits out until the saved skill details arrive', () => {
    const { rerender } = render(
      <SkillEditor
        isCreateMode
        isVisible
      />,
    );

    rerender(
      <SkillEditor
        skill={createdSkill}
        isVisible
      />,
    );
    expect(captured.formDisabled).toBe(true);

    details.data = { id: 42, name: 'triage', version_details: { id: 900 } };
    rerender(
      <SkillEditor
        skill={{ ...createdSkill }}
        isVisible
      />,
    );
    expect(captured.formDisabled).toBe(false);
    expect(captured.initialValues.name).toBe('triage');
  });
});

describe('SkillEditor for a catalog skill', () => {
  afterEach(() => {
    cleanup();
    details.data = undefined;
    details.error = undefined;
    details.isPublic = false;
  });

  const catalogSkill = {
    entity_name: 'skill',
    entity_meta: { id: 178, project_id: 1 },
    entity_settings: { version_id: 202 },
  };
  const publishedDetails = {
    id: 178,
    name: 'e2e-7029-skill-pub',
    version_details: {
      id: 202,
      status: 'published',
      run_settings: { llm_settings: { model_name: 'sonnet', model_project_id: 1, max_tokens: 4096 } },
    },
  };

  it('shows the published model settings and keeps the skill itself read-only', () => {
    details.isPublic = true;
    details.data = publishedDetails;
    const { getByTestId } = render(
      <SkillEditor
        skill={catalogSkill}
        isVisible
      />,
    );

    expect(captured.isPublic).toBe(true);
    expect(captured.error).toBeUndefined();
    expect(captured.formDisabled).toBe(true);
    expect(captured.initialValues.version_details.run_settings.llm_settings).toMatchObject({
      model_name: 'sonnet',
      max_tokens: 4096,
    });
    expect(getByTestId('skill-canvas-model-selector')).toBeTruthy();
  });

  it('offers no save that would write the catalog skill into the selected project', () => {
    details.isPublic = true;
    details.data = publishedDetails;
    captured.onSaved = null;
    render(
      <SkillEditor
        skill={catalogSkill}
        isVisible
      />,
    );

    expect(captured.onSaved).toBeNull();
  });

  it('keeps an own skill editable once its details arrive', () => {
    details.data = { id: 174, version_details: { id: 8 } };
    render(
      <SkillEditor
        skill={skill()}
        isVisible
      />,
    );

    expect(captured.isPublic).toBe(false);
    expect(captured.formDisabled).toBe(false);
  });
});
