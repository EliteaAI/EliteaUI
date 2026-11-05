// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLazySkillDetailsQuery, useUpdateSkillRelationMutation } from '@/[fsd]/features/skill/api';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { act, renderHook } from '@testing-library/react';

import { useAttachPendingSkills } from '../useAttachPendingSkills.hooks';

vi.mock('@/[fsd]/features/skill/api', () => ({
  useLazySkillDetailsQuery: vi.fn(),
  useUpdateSkillRelationMutation: vi.fn(),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: vi.fn(() => 6),
  useToast: vi.fn(),
}));

const toastWarning = vi.fn();
const fetchSkill = vi.fn();
const updateRelation = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useToast).mockReturnValue({ toastWarning });
  vi.mocked(useLazySkillDetailsQuery).mockReturnValue([fetchSkill]);
  vi.mocked(useUpdateSkillRelationMutation).mockReturnValue([updateRelation]);
  fetchSkill.mockResolvedValue({ data: { version_details: { id: 900 } } });
  updateRelation.mockReturnValue({ unwrap: () => Promise.resolve({}) });
});

const run = async (skills, versionId) => {
  const { result } = renderHook(() => useAttachPendingSkills());
  await act(async () => {
    await result.current(skills, versionId);
  });
};

describe('useAttachPendingSkills', () => {
  it('attaches each skill to the new version, using the catalog project when given', async () => {
    await run([{ id: 3 }, { id: 4, project_id: 1 }], 55);

    expect(fetchSkill).toHaveBeenCalledWith({ projectId: 6, skillId: 3 });
    expect(fetchSkill).toHaveBeenCalledWith({ projectId: 1, skillId: 4 });
    expect(updateRelation).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 1,
        skillId: 4,
        entity_version_id: 55,
        skill_version_id: 900,
        has_relation: true,
      }),
    );
    expect(toastWarning).not.toHaveBeenCalled();
  });

  it('does nothing without skills or a version', async () => {
    await run([], 55);
    await run([{ id: 3 }], undefined);
    expect(fetchSkill).not.toHaveBeenCalled();
  });

  it('warns when a skill could not be attached', async () => {
    fetchSkill.mockResolvedValueOnce({ data: {} });
    await run([{ id: 3 }, { id: 4 }], 55);
    expect(toastWarning).toHaveBeenCalledWith(expect.stringContaining('1 suggested skill'));
  });
});
