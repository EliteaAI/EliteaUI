import { memo } from 'react';

import { SkillRunAnalyticsView } from '@/[fsd]/widgets/skill-run-history';

const SkillRunAnalytics = memo(props => {
  const { isCatalogSkill = false } = props;

  return <SkillRunAnalyticsView isCatalogSkill={isCatalogSkill} />;
});

SkillRunAnalytics.displayName = 'SkillRunAnalytics';

export default SkillRunAnalytics;
