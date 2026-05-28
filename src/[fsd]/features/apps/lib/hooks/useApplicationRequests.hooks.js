import { useCallback, useEffect, useState } from 'react';

import { useCreateModerationRequestMutation, useLazyModerationStatusQuery } from '@/api/admin';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { APPLICATION_CATALOG, REQUEST_STATUS } from '../constants/applicationCatalog.constants';

export const useApplicationRequests = () => {
  const projectId = useSelectedProjectId();

  const [triggerModerationStatus] = useLazyModerationStatusQuery();
  const [createModerationRequest] = useCreateModerationRequestMutation();

  const [moderationData, setModerationData] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    setIsFetching(true);

    Promise.all(
      APPLICATION_CATALOG.map(async app => {
        try {
          const result = await triggerModerationStatus({ projectId, entityId: app.type }).unwrap();

          return [app.type, result];
        } catch {
          return [app.type, null];
        }
      }),
    ).then(entries => {
      setModerationData(Object.fromEntries(entries));
      setIsFetching(false);
    });
  }, [projectId, triggerModerationStatus]);

  const submitRequest = useCallback(
    async (appType, description, label) => {
      if (!projectId) return;

      setIsSubmitting(true);

      try {
        const result = await createModerationRequest({
          projectId,
          entityId: appType,
          issue_type: label ?? 'Application Access Request',
          description,
          status: 'pending',
          meta: {},
        }).unwrap();

        setModerationData(prev => ({
          ...prev,
          [appType]: result,
        }));
      } finally {
        setIsSubmitting(false);
      }
    },
    [projectId, createModerationRequest],
  );

  const getRequestStatus = useCallback(
    appType => {
      const data = moderationData[appType];

      if (!data) return REQUEST_STATUS.NONE;

      if (Array.isArray(data.rows)) return data.rows[0]?.status || REQUEST_STATUS.NONE;

      return data.status || REQUEST_STATUS.NONE;
    },
    [moderationData],
  );

  const getModerationRecord = useCallback(
    appType => {
      const data = moderationData[appType];

      if (!data) return null;

      return Array.isArray(data.rows) ? data.rows[0] || null : data;
    },
    [moderationData],
  );

  return { getRequestStatus, getModerationRecord, submitRequest, isSubmitting, isFetching };
};
