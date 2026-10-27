// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { renderHook } from '@testing-library/react';

import { UNPUBLISHED_SKILL_VERSION_ERROR, useSkillEditorDetails } from '../useSkillEditorDetails.hooks';

const SELECTED_PROJECT_ID = PUBLIC_PROJECT_ID + 1;

const api = vi.hoisted(() => ({
  ownCalls: [],
  publicCalls: [],
  ownResult: {},
  publicResultByVersion: {},
}));

vi.mock('@/[fsd]/features/skill/api', () => ({
  useSkillDetailsQuery: (args, options) => {
    api.ownCalls.push({ args, options });
    return options.skip ? {} : api.ownResult;
  },
}));
vi.mock('@/[fsd]/features/skill-hub/api', () => ({
  useGetPublicSkillDetailsQuery: (args, options) => {
    api.publicCalls.push({ args, options });
    return options.skip ? {} : api.publicResultByVersion[args.versionName ?? 'latest'] || {};
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => SELECTED_PROJECT_ID }));

const participant = (projectId, versionId) => ({
  entity_name: 'skill',
  entity_meta: { id: 178, project_id: projectId },
  entity_settings: versionId ? { version_id: versionId } : {},
});

const publishedSkill = (versionId, versionName, versions) => ({
  id: 178,
  name: 'e2e-7029-skill-pub',
  versions,
  version_details: {
    id: versionId,
    name: versionName,
    status: 'published',
    run_settings: { llm_settings: { model_name: `model-of-${versionName}` } },
  },
});

const TWO_VERSIONS = [
  { id: 202, name: 'v2' },
  { id: 150, name: 'v1' },
];

const activeCalls = calls => calls.filter(call => !call.options.skip).map(call => call.args);

describe('useSkillEditorDetails', () => {
  afterEach(() => {
    api.ownCalls = [];
    api.publicCalls = [];
    api.ownResult = {};
    api.publicResultByVersion = {};
  });

  it("loads a catalog skill from the catalog, never from the user's project", () => {
    api.publicResultByVersion.latest = { data: publishedSkill(202, 'v2', TWO_VERSIONS) };

    const { result } = renderHook(() => useSkillEditorDetails(participant(PUBLIC_PROJECT_ID, 202)));

    expect(activeCalls(api.ownCalls)).toEqual([]);
    expect(activeCalls(api.publicCalls)).toEqual([{ skillId: 178 }]);
    expect(result.current.isPublic).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data.version_details.run_settings.llm_settings.model_name).toBe('model-of-v2');
  });

  it('loads the pinned catalog version by its name when it is not the latest', () => {
    api.publicResultByVersion.latest = { data: publishedSkill(202, 'v2', TWO_VERSIONS) };
    api.publicResultByVersion.v1 = { data: publishedSkill(150, 'v1', TWO_VERSIONS) };

    const { result } = renderHook(() => useSkillEditorDetails(participant(PUBLIC_PROJECT_ID, 150)));

    expect(activeCalls(api.publicCalls)).toContainEqual({ skillId: 178, versionName: 'v1' });
    expect(result.current.data.version_details.id).toBe(150);
  });

  it('reports a pinned catalog version that is no longer published instead of showing another one', () => {
    api.publicResultByVersion.latest = { data: publishedSkill(202, 'v2', TWO_VERSIONS) };

    const { result } = renderHook(() => useSkillEditorDetails(participant(PUBLIC_PROJECT_ID, 999)));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(UNPUBLISHED_SKILL_VERSION_ERROR);
  });

  it('surfaces a catalog request failure', () => {
    const error = { status: 404, data: { error: 'No skill found' } };
    api.publicResultByVersion.latest = { error };

    const { result } = renderHook(() => useSkillEditorDetails(participant(PUBLIC_PROJECT_ID, 202)));

    expect(result.current.error).toBe(error);
  });

  it("keeps loading the user's own skill version from the selected project", () => {
    api.ownResult = { data: { id: 178, version_details: { id: 8 } } };

    const { result } = renderHook(() => useSkillEditorDetails(participant(SELECTED_PROJECT_ID, 8)));

    expect(activeCalls(api.publicCalls)).toEqual([]);
    expect(activeCalls(api.ownCalls)).toEqual([
      { projectId: SELECTED_PROJECT_ID, skillId: 178, versionId: 8 },
    ]);
    expect(result.current.isPublic).toBe(false);
    expect(result.current.data.version_details.id).toBe(8);
  });

  it('fetches nothing without a skill', () => {
    renderHook(() => useSkillEditorDetails(null));

    expect(activeCalls(api.ownCalls)).toEqual([]);
    expect(activeCalls(api.publicCalls)).toEqual([]);
  });
});
