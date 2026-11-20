import { useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { OPEN_BUILD_WITH_AI_STATE_KEY } from '@/[fsd]/features/pipelines/ai-edit-pipeline/lib/constants/aiEditPipeline.constants';

// True once when the page was opened with the flag; the flag is dropped so Back or a reload do not reopen it
export const useOpenBuildWithAiOnArrival = (enabled = true) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [shouldOpen] = useState(() => enabled && Boolean(location.state?.[OPEN_BUILD_WITH_AI_STATE_KEY]));

  useEffect(() => {
    if (!enabled || !location.state?.[OPEN_BUILD_WITH_AI_STATE_KEY]) return;
    const restState = { ...location.state };
    delete restState[OPEN_BUILD_WITH_AI_STATE_KEY];
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: restState },
    );
  }, [enabled, location.hash, location.pathname, location.search, location.state, navigate]);

  return shouldOpen;
};
