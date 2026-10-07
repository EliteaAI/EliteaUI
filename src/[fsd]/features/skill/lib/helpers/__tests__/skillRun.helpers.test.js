import { describe, expect, it } from 'vitest';

import {
  SKILL_RUN_MATCH,
  SKILL_RUN_SOURCE,
  buildSkillRunConversation,
  buildSkillRunParticipant,
  findSkillParticipant,
  matchSkillRun,
} from '@/[fsd]/features/skill/lib/helpers/skillRun.helpers';
import { hasUnsavedRunChanges } from '@/[fsd]/features/skill/lib/helpers/skillRunSettings.helpers';

const formValues = (versionDetails, rest = {}) => ({
  name: 'Reviewer',
  description: 'Reviews code',
  ...rest,
  version_details: { instructions: 'Review it.', tags: [], run_settings: null, ...versionDetails },
});

describe('hasUnsavedRunChanges', () => {
  const saved = formValues({
    run_settings: {
      llm_settings: { model_name: 'gpt-4.1', temperature: 0.3 },
      ignore_project_context: false,
    },
  });

  it('stays in Run mode for name, description, tag and icon edits', () => {
    const edited = formValues(
      { ...saved.version_details, tags: [{ name: 'new' }], meta: { icon_meta: { url: 'x.png' } } },
      { name: 'Renamed', description: 'Other' },
    );
    expect(hasUnsavedRunChanges(edited, saved)).toBe(false);
  });

  it('switches to Test mode when the instructions change', () => {
    expect(hasUnsavedRunChanges(formValues({ ...saved.version_details, instructions: 'New.' }), saved)).toBe(
      true,
    );
  });

  it('switches to Test mode when a run setting changes', () => {
    const edited = formValues({
      ...saved.version_details,
      run_settings: { ...saved.version_details.run_settings, ignore_project_context: true },
    });
    expect(hasUnsavedRunChanges(edited, saved)).toBe(true);
  });

  it('ignores key order and unset fields in the saved settings', () => {
    const reordered = formValues({
      ...saved.version_details,
      run_settings: {
        ignore_project_context: false,
        llm_settings: { temperature: 0.3, reasoning_effort: null, model_name: 'gpt-4.1' },
      },
    });
    expect(hasUnsavedRunChanges(reordered, saved)).toBe(false);
  });

  it('treats never-configured settings like an explicit empty configuration', () => {
    const never = formValues({ run_settings: null });
    const empty = formValues({ run_settings: { ignore_project_context: false, llm_settings: {} } });
    expect(hasUnsavedRunChanges(empty, never)).toBe(false);
  });
});

describe('skill run conversation', () => {
  const participant = buildSkillRunParticipant({
    skillId: 10,
    skillName: 'Reviewer',
    projectId: 2,
    versionId: 100,
    iconMeta: { url: 'i.png' },
  });

  it('pins the skill version on the participant', () => {
    expect(participant).toEqual({
      entity_name: 'skill',
      entity_meta: { id: 10, project_id: 2 },
      entity_settings: { version_id: 100 },
      meta: { name: 'Reviewer', icon_meta: { url: 'i.png' } },
    });
  });

  it('leaves the version to the server when none is chosen', () => {
    expect(buildSkillRunParticipant({ skillId: 10, skillName: 'R', projectId: 1 }).entity_settings).toEqual(
      {},
    );
  });

  it('creates a private skill-sourced conversation with the skill as its single participant', () => {
    const conversation = buildSkillRunConversation({ projectId: 2, skillName: 'Reviewer', participant });
    const sent = {
      entity_name: 'skill',
      entity_meta: { id: 10, project_id: 2 },
      entity_settings: { version_id: 100 },
    };
    expect(conversation).toEqual({
      projectId: 2,
      name: 'Run Reviewer',
      is_private: true,
      source: SKILL_RUN_SOURCE,
      meta: { single_participant: sent },
      participants: [sent],
    });
    expect(SKILL_RUN_SOURCE).toBe('skill');
  });

  it('finds the skill participant among the conversation participants', () => {
    const skill = { id: 7, entity_name: 'skill' };
    expect(findSkillParticipant({ participants: [{ id: 1, entity_name: 'user' }, skill] })).toBe(skill);
    expect(findSkillParticipant({ participants: [{ id: 1, entity_name: 'dummy' }] })).toBeUndefined();
  });
});

describe('matchSkillRun', () => {
  const page = { skillId: '10', projectId: 2, versionId: 100 };
  const run = (id, projectId, versionId) => ({
    entity_name: 'skill',
    entity_meta: { id, project_id: projectId },
    entity_settings: { version_id: versionId },
  });

  it('reopens a run of the version on screen', () => {
    expect(matchSkillRun(run(10, 2, 100), page)).toBe(SKILL_RUN_MATCH.sameVersion);
  });

  it('asks to show the pinned version when the run used another one', () => {
    expect(matchSkillRun(run(10, 2, 101), page)).toBe(SKILL_RUN_MATCH.otherVersion);
  });

  it('refuses runs of another skill, a Catalog skill with the same id, or no skill at all', () => {
    expect(matchSkillRun(run(11, 2, 100), page)).toBe(SKILL_RUN_MATCH.otherSkill);
    expect(matchSkillRun(run(10, 1, 100), page)).toBe(SKILL_RUN_MATCH.otherSkill);
    expect(matchSkillRun(undefined, page)).toBe(SKILL_RUN_MATCH.otherSkill);
  });
});
