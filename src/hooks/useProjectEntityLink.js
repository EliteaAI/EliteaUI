import { usePageDetails } from '@/hooks/usePageDetails.js';
import useViewMode from '@/hooks/useViewMode';
import { getBasename } from '@/routes.js';

export const useProjectEntityLink = ({ isRelative, versionId } = {}) => {
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const basename = getBasename();
  const { details } = usePageDetails();
  const viewMode = useViewMode();
  const projectPath = details?.projectPath;
  const versionSuffix = versionId ? `/${versionId}` : '';
  const projectEntityLink = details
    ? `${isRelative ? '' : baseUrl}${basename}${projectPath}${versionSuffix}${details?.search || `?viewMode=${viewMode}`}`
    : '';

  return {
    projectEntityLink,
  };
};
