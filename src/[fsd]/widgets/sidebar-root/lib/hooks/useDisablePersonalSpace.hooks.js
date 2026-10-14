import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

export const useDisablePersonalSpace = () => {
  const { personal_project_id: privateProjectId } = useSelector(state => state.user);
  const selectProjectId = useSelectedProjectId();
  const shouldDisablePersonalSpace = useMemo(
    () => !privateProjectId && selectProjectId == PUBLIC_PROJECT_ID,
    [privateProjectId, selectProjectId],
  );
  return { shouldDisablePersonalSpace };
};
