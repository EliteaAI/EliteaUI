import { useCallback } from 'react';

import ReactGA from 'react-ga4';
import { useSelector } from 'react-redux';

import { DEV, VITE_GAID } from './common/constants.js';

export const gaInit = () =>
  VITE_GAID !== undefined &&
  ReactGA.initialize(VITE_GAID, {
    testMode: DEV,
    gaOptions: { cookieFlags: DEV ? 'samesite=none' : 'samesite=none;secure' },
  });

export const trackEvent = (eventName, params = {}) => {
  ReactGA.event(eventName, params);
};

export const useTrackEvent = () => {
  const { id: userId, email: userEmail, personal_project_id } = useSelector(state => state.user);
  const { project } = useSelector(state => state.settings);

  const projectId = project?.id || personal_project_id || 'unknown';
  const projectName = project?.name || (personal_project_id ? 'Private' : 'unknown');

  return useCallback(
    (eventName, params = {}) => {
      ReactGA.event(eventName, {
        project_id: projectId,
        project_name: projectName,
        user_id: userId || 'unknown',
        user_email: userEmail || 'unknown',
        ...params,
      });
    },
    [projectId, projectName, userId, userEmail],
  );
};
