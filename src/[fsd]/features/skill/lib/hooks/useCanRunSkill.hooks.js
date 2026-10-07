import { useMemo } from 'react';

import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const OWN_SKILL_RUN_PERMISSIONS = [PERMISSIONS.predict.post, PERMISSIONS.skills.details];
const CATALOG_SKILL_RUN_PERMISSIONS = [PERMISSIONS.predict.post, PERMISSIONS.catalog.details];

export const useCanRunSkill = ({ isCatalogSkill = false } = {}) => {
  const { checkPermissions } = useCheckPermission();
  return useMemo(
    () => checkPermissions(isCatalogSkill ? CATALOG_SKILL_RUN_PERMISSIONS : OWN_SKILL_RUN_PERMISSIONS),
    [checkPermissions, isCatalogSkill],
  );
};
