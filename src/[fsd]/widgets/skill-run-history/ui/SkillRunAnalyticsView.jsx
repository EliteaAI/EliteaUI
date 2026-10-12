import { memo } from 'react';

import { RunAnalyticsContainer } from '@/[fsd]/features/settings/ui/analytics';
import { findSkillParticipant } from '@/[fsd]/features/skill/lib/helpers';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useSkillHistoryEntity } from '@/[fsd]/widgets/skill-run-history/lib/hooks';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const readSkillRunVersionId = runDetails => findSkillParticipant(runDetails)?.entity_settings?.version_id;

const SkillRunAnalyticsView = memo(props => {
  const { isCatalogSkill = false } = props;
  const { skill } = useSkillHistoryEntity({ isCatalogSkill });

  return (
    <RunAnalyticsContainer
      source={ParticipantEntityTypes.Skill}
      entityDetails={skill}
      entityLabel="Skill"
      breadcrumbs={<Breadcrumbs entityName={skill?.name} />}
      readRunVersionId={readSkillRunVersionId}
    />
  );
});

SkillRunAnalyticsView.displayName = 'SkillRunAnalyticsView';

export default SkillRunAnalyticsView;
