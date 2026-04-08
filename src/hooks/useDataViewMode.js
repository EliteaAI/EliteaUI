import { useMemo } from 'react';

import { ViewMode } from '@/common/constants';

import { useSelectedProjectId } from './useSelectedProject';

export default function useDataViewMode(pageViewMode, { owner_id: ownerId }) {
  const selectedProjectId = useSelectedProjectId();

  const dataViewMode = useMemo(() => {
    if (pageViewMode === ViewMode.Owner) {
      return ownerId == selectedProjectId || !ownerId ? pageViewMode : ViewMode.Public;
    }
    return pageViewMode;
  }, [ownerId, pageViewMode, selectedProjectId]);

  return dataViewMode;
}
