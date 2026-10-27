import { useGetPublicSkillDetailsQuery } from '@/[fsd]/features/skill-hub/api';
import { useSkillDetailsQuery } from '@/[fsd]/features/skill/api';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

export const UNPUBLISHED_SKILL_VERSION_ERROR = Object.freeze({
  message: 'This skill version is no longer published in the catalog',
});

export const useSkillEditorDetails = skill => {
  const selectedProjectId = useSelectedProjectId();
  const skillId = skill?.entity_meta?.id;
  const versionId = skill?.entity_settings?.version_id;
  const isPublic = Number(skill?.entity_meta?.project_id) === PUBLIC_PROJECT_ID;

  const ownSkill = useSkillDetailsQuery(
    { projectId: selectedProjectId, skillId, versionId },
    { skip: isPublic || !selectedProjectId || !skillId },
  );

  // The catalog endpoint addresses versions by name, and the chat participant only keeps the id.
  const latestPublished = useGetPublicSkillDetailsQuery({ skillId }, { skip: !isPublic || !skillId });
  const isPinnedToLatest = !versionId || latestPublished.data?.version_details?.id === versionId;
  const pinnedVersionName = latestPublished.data?.versions?.find(version => version.id === versionId)?.name;
  const pinnedPublished = useGetPublicSkillDetailsQuery(
    { skillId, versionName: pinnedVersionName },
    { skip: !isPublic || isPinnedToLatest || !pinnedVersionName },
  );

  if (!isPublic) return { isPublic, data: ownSkill.data, error: ownSkill.error };
  if (isPinnedToLatest) return { isPublic, data: latestPublished.data, error: latestPublished.error };
  if (latestPublished.data && !pinnedVersionName)
    return { isPublic, data: undefined, error: UNPUBLISHED_SKILL_VERSION_ERROR };
  return { isPublic, data: pinnedPublished.data, error: latestPublished.error || pinnedPublished.error };
};
