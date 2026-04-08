import { useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { useToolkitsDetailsQuery } from '@/api/toolkits.js';
import { buildErrorMessage } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';

export const useAppDetail = () => {
  const { toastError } = useToast();
  const { appId } = useParams();
  const currentProjectId = useSelectedProjectId();
  const mode = useSelector(state => state.settings.mode);
  const [iframeKey, setIframeKey] = useState(0);

  const {
    data: appData = {},
    isFetching,
    isError,
    error,
  } = useToolkitsDetailsQuery(
    { projectId: currentProjectId, toolkitId: appId },
    { skip: !currentProjectId || !appId },
  );

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  const customUIRoute = useMemo(() => {
    return appData?.meta?.custom_ui_route || null;
  }, [appData]);

  // Reload iframe when theme changes
  useEffect(() => {
    if (customUIRoute) {
      setIframeKey(prev => prev + 1);
    }
  }, [mode, customUIRoute]);

  const provider = useMemo(() => {
    return appData?.provider || null;
  }, [appData]);

  const iframeUrl = useMemo(() => {
    if (!customUIRoute || !provider || !currentProjectId || !appId) {
      return null;
    }

    // Build iframe URL: /ui_host/{provider}/{ui_route}/{project_id}/?theme={mode}&toolkit_id={appId}
    const baseUrl = `/ui_host/${provider}/${customUIRoute}/${currentProjectId}/`;
    const params = new URLSearchParams({
      theme: mode,
      toolkit_id: appId,
    });

    return `${baseUrl}?${params.toString()}`;
  }, [customUIRoute, provider, currentProjectId, appId, mode]);

  const appName = useMemo(() => {
    return appData?.name || 'Application';
  }, [appData]);

  return {
    appData,
    appName,
    isFetching,
    isError,
    error,
    iframeUrl,
    iframeKey,
    hasCustomUI: !!iframeUrl,
  };
};
