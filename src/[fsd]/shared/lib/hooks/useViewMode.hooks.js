import { useLocation } from 'react-router-dom';

import { PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';

import { useViewModeFromUrl } from './useSearchParamValue.hooks';
import { useSelectedProjectId } from './useSelectedProject.hooks';

export const useViewMode = () => {
  const viewModeFromUrl = useViewModeFromUrl();
  const { state } = useLocation();
  const projectId = useSelectedProjectId();
  const { viewMode: viewModeFromState } = state ?? {};

  return (
    viewModeFromUrl ||
    viewModeFromState ||
    (projectId == PUBLIC_PROJECT_ID ? ViewMode.Public : ViewMode.Owner)
  );
};
