import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { PUBLIC_PROJECT_ACCESS_PERMISSION } from '@/[fsd]/features/project/lib/constants';

export const usePublicProjectAccessCheck = () => {
  const { publicPermissions } = useSelector(state => state.user);
  const hasPublicProjectAccess = useMemo(
    () => publicPermissions?.includes(PUBLIC_PROJECT_ACCESS_PERMISSION),
    [publicPermissions],
  );
  return hasPublicProjectAccess;
};
