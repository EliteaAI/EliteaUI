import { memo } from 'react';

import { SkillRunHistoryView } from '@/[fsd]/widgets/skill-run-history';

const SkillRunHistory = memo(props => {
  const { isCatalogSkill = false } = props;

  return <SkillRunHistoryView isCatalogSkill={isCatalogSkill} />;
});

SkillRunHistory.displayName = 'SkillRunHistory';

export default SkillRunHistory;
