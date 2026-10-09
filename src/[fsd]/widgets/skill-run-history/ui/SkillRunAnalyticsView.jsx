import { memo, useMemo } from 'react';

import { RunAnalyticsContainer } from '@/[fsd]/features/settings/ui/analytics';
import { findSkillParticipant } from '@/[fsd]/features/skill/lib/helpers';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useSkillHistoryEntity } from '@/[fsd]/widgets/skill-run-history/lib/hooks';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const readSkillRunVersionId = runDetails => findSkillParticipant(runDetails)?.entity_settings?.version_id;

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
      readRunVersionId={readSkillRunVersionId}
      rootEntity={rootEntity}
    />
  );
});

SkillRunAnalyticsView.displayName = 'SkillRunAnalyticsView';

export default SkillRunAnalyticsView;
