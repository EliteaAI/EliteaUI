import { memo, useMemo } from 'react';

import { latestSkillRunVersionId } from '@/[fsd]/entities/run-history/lib/helpers';
import { RunAnalyticsContainer } from '@/[fsd]/features/settings/ui/analytics';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useSkillHistoryEntity } from '@/[fsd]/widgets/skill-run-history/lib/hooks';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const SkillRunAnalyticsView = memo(props => {
  const { isCatalogSkill = false } = props;
  const { skillId, skill, entityProjectId } = useSkillHistoryEntity({ isCatalogSkill });

  const rootEntity = useMemo(
    () =>
      skillId
        ? {
            rootEntityType: ParticipantEntityTypes.Skill,
            rootEntityId: Number(skillId),
            rootEntityProjectId: entityProjectId,
          }
        : undefined,
    [skillId, entityProjectId],
  );

  return (
    <RunAnalyticsContainer
      source={ParticipantEntityTypes.Skill}
      entityDetails={skill}
      entityLabel="Skill"
      breadcrumbs={<Breadcrumbs entityName={skill?.name} />}
      readRunVersionId={latestSkillRunVersionId}
      rootEntity={rootEntity}
    />
  );
});

SkillRunAnalyticsView.displayName = 'SkillRunAnalyticsView';

export default SkillRunAnalyticsView;
