import { memo } from 'react';

import { Navigate, useParams } from 'react-router-dom';

import { SkillHubConstants } from '@/[fsd]/features/skill-hub/lib/constants';
import RouteDefinitions from '@/routes';

const CatalogSkillRedirect = memo(() => {
  const { skillId } = useParams();

  return (
    <Navigate
      replace
      to={`${RouteDefinitions.EliteaCatalog}?tab=skills&${SkillHubConstants.SKILL_ID}=${skillId}`}
    />
  );
});

CatalogSkillRedirect.displayName = 'CatalogSkillRedirect';

export default CatalogSkillRedirect;
