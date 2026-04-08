import { useCallback, useMemo } from 'react';

import ReactGA from 'react-ga4';
import { useSelector } from 'react-redux';

import { GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants.js';

import { DEV, PUBLIC_PROJECT_ID, VITE_GAID } from './common/constants.js';

export const gaInit = () =>
  VITE_GAID !== undefined &&
  ReactGA.initialize(VITE_GAID, {
    testMode: DEV,
    gaOptions: { cookieFlags: DEV ? 'samesite=none' : 'samesite=none;secure' },
  });

export const trackEvent = (eventName, params = {}) => {
  ReactGA.event(eventName, params);
};

const PROJECT_TYPES = {
  PRIVATE: 'private',
  PUBLIC: 'public',
  TEAM: 'team',
};

export const useTrackEvent = () => {
  const { id: userId, email: userEmail, personal_project_id } = useSelector(state => state.user);
  const { project, projects } = useSelector(state => state.settings);

  const projectId = project?.id || personal_project_id || 'Not Found';
  const projectName = projects?.find(p => project?.id === p.id)?.name || 'Not Found';

  const projectType = useMemo(() => {
    const isPrivate = projectId === personal_project_id;
    const isPublic = projectId === PUBLIC_PROJECT_ID;

    let type = PROJECT_TYPES.TEAM;

    if (isPrivate) type = PROJECT_TYPES.PRIVATE;
    else if (isPublic) type = PROJECT_TYPES.PUBLIC;

    return type;
  }, [projectId, personal_project_id]);

  return useCallback(
    (eventName, params = {}) => {
      ReactGA.event(eventName, {
        [GA_EVENT_PARAMS.PROJECT_ID]: projectId,
        [GA_EVENT_PARAMS.PROJECT_NAME]: projectName,
        [GA_EVENT_PARAMS.PROJECT_TYPE]: projectType,
        [GA_EVENT_PARAMS.USER_ID]: userId || 'unknown',
        [GA_EVENT_PARAMS.USER_EMAIL]: userEmail || 'unknown',
        ...params,
      });
    },
    [projectId, projectName, projectType, userId, userEmail],
  );
};
