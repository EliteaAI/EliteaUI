// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useAttachSuggestedSkills } from '../useAttachSuggestedSkills.hooks';

const api = vi.hoisted(() => ({
  fetchSkillDetails: vi.fn(),
  updateSkillRelation: vi.fn(),
  fetchPublicSkillDetails: vi.fn(),
  attachPublicSkill: vi.fn(),
}));

vi.mock('@/[fsd]/features/skill', () => ({
  useLazySkillDetailsQuery: () => [api.fetchSkillDetails],
  useUpdateSkillRelationMutation: () => [api.updateSkillRelation],
}));
vi.mock('@/[fsd]/features/skill-hub/api', () => ({
  useLazyGetPublicSkillDetailsQuery: () => [api.fetchPublicSkillDetails],
  useAttachPublicSkillMutation: () => [api.attachPublicSkill],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 2 }));

const unwrapping = value => ({ unwrap: () => Promise.resolve(value) });

const attach = async (skills, versionId = 325) => {
  const { result } = renderHook(() => useAttachSuggestedSkills());
  let outcome;
  await act(async () => {
    outcome = await result.current(skills, versionId);
  });
  return outcome;
};

describe('useAttachSuggestedSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchSkillDetails.mockResolvedValue({ data: { version_details: { id: 11 } } });
    api.updateSkillRelation.mockReturnValue(unwrapping({ ok: true }));
    api.fetchPublicSkillDetails.mockResolvedValue({ data: { version_details: { id: 204 } } });
    api.attachPublicSkill.mockReturnValue(unwrapping({ results: [{ agent_version_id: 325, ok: true }] }));
  });

  it('attaches a project skill through the skill relation in the current project', async () => {
    const [outcome] = await attach([{ id: 180, name: 'own' }]);
    expect(outcome.status).toBe('fulfilled');
    expect(api.fetchSkillDetails).toHaveBeenCalledWith({ projectId: 2, skillId: 180 });
    expect(api.updateSkillRelation).toHaveBeenCalledWith({
      projectId: 2,
      skillId: 180,
      entity_version_id: 325,
      skill_version_id: 11,
      has_relation: true,
    });
    expect(api.attachPublicSkill).not.toHaveBeenCalled();
  });

  it('attaches a catalog skill through the public attach in the agent project', async () => {
    const [outcome] = await attach([{ id: 180, name: 'catalog', project_id: 1 }]);
    expect(outcome.status).toBe('fulfilled');
    expect(api.fetchPublicSkillDetails).toHaveBeenCalledWith({ skillId: 180 });
    expect(api.attachPublicSkill).toHaveBeenCalledWith({
      projectId: 2,
      publicSkillId: 180,
      publicVersionId: 204,
      agentVersionIds: [325],
    });
    expect(api.updateSkillRelation).not.toHaveBeenCalled();
  });

  it('reports a catalog attach the server refused as rejected', async () => {
    api.attachPublicSkill.mockReturnValue(
      unwrapping({ results: [{ agent_version_id: 325, ok: false, error: 'already attached' }] }),
    );
    const [outcome] = await attach([{ id: 180, name: 'catalog', project_id: 1 }]);
    expect(outcome.status).toBe('rejected');
    expect(outcome.reason.message).toBe('already attached');
  });

  it('reports a catalog skill without a published version as rejected', async () => {
    api.fetchPublicSkillDetails.mockResolvedValue({ data: {} });
    const [outcome] = await attach([{ id: 180, name: 'catalog', project_id: 1 }]);
    expect(outcome.status).toBe('rejected');
    expect(api.attachPublicSkill).not.toHaveBeenCalled();
  });
});
