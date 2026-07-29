import { useCallback } from 'react';

import { useLazySkillDetailsQuery } from '@/[fsd]/features/skill/api';
import { useLazyForkedFromApplicationDetailsQuery } from '@/api/applications';

const APPLICATION_ENTITIES = ['agents', 'pipelines'];

const PREFER_CACHED_RESULT = true;

const PLACEHOLDER_SOURCE_NAMES = {
  agents: 'Original agent',
  pipelines: 'Original pipeline',
  skills: 'Original skill',
};

export const useForkedFromSourceName = (type, meta) => {
  const parentProjectId = meta?.parent_project_id;
  const parentEntityId = meta?.parent_entity_id;

  const [fetchApplication, applicationResult] = useLazyForkedFromApplicationDetailsQuery();
  const [fetchSkill, skillResult] = useLazySkillDetailsQuery();

  const isSkill = type === 'skills';
  const isApplication = APPLICATION_ENTITIES.includes(type);

  const loadSourceName = useCallback(() => {
    if (!parentProjectId || !parentEntityId) {
      return;
    }
    if (isSkill) {
      fetchSkill({ projectId: parentProjectId, skillId: parentEntityId }, PREFER_CACHED_RESULT);
    } else if (isApplication) {
      fetchApplication({ projectId: parentProjectId, applicationId: parentEntityId }, PREFER_CACHED_RESULT);
    }
  }, [fetchApplication, fetchSkill, isApplication, isSkill, parentEntityId, parentProjectId]);

  const sourceName = isSkill ? skillResult.data?.name : applicationResult.data?.name;

  return {
    sourceName: sourceName || PLACEHOLDER_SOURCE_NAMES[type] || 'Original entity',
    loadSourceName,
  };
};
