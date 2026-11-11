import { useCallback, useEffect, useRef, useState } from 'react';

import { useCheckScheduleConnectionsMutation } from '@/[fsd]/entities/schedule';

import { CONNECTIONS_CHECK_STATUS } from '../constants';

const IDLE_STATE = { status: CONNECTIONS_CHECK_STATUS.IDLE, rows: [] };

// The Connections check (#7401): can each toolkit run with no one signed in; re-runs on a version change and tab focus.
// `applyRows(rows)` takes the rows of a 409 save; with `scheduleId` the server checks as the trigger's owner.
export const useScheduleConnections = ({
  projectId,
  entityType,
  applicationId,
  versionId,
  scheduleId,
  isWebhook,
}) => {
  const [checkConnections] = useCheckScheduleConnectionsMutation();
  const [state, setState] = useState(IDLE_STATE);
  // Only the answer of the latest call is shown: an older one may name another version
  const latestCall = useRef(0);
  // The rows belong to one entity and version; another pair never shows them, not even while it is checked
  const versionKey = `${entityType}:${applicationId}:${versionId}`;
  const shownKey = useRef(versionKey);

  const recheck = useCallback(async () => {
    const call = ++latestCall.current;
    if (!applicationId || !versionId) {
      setState(IDLE_STATE);
      return null;
    }
    const sameVersion = shownKey.current === versionKey;
    shownKey.current = versionKey;
    setState(prev => ({ status: CONNECTIONS_CHECK_STATUS.CHECKING, rows: sameVersion ? prev.rows : [] }));
    try {
      const result = await checkConnections({
        projectId,
        entity_type: entityType,
        application_id: applicationId,
        version_id: versionId,
        trigger_kind: isWebhook ? 'webhook' : 'cron',
        ...(scheduleId && { schedule_id: scheduleId }),
      }).unwrap();
      if (call === latestCall.current)
        setState({ status: CONNECTIONS_CHECK_STATUS.ANSWERED, rows: result.rows });
      return result;
    } catch {
      if (call === latestCall.current)
        setState(prev => ({ ...prev, status: CONNECTIONS_CHECK_STATUS.FAILED }));
      return null;
    }
  }, [checkConnections, projectId, entityType, applicationId, versionId, scheduleId, isWebhook, versionKey]);

  useEffect(() => {
    recheck();
  }, [recheck]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') recheck();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [recheck]);

  // A 409 save answer is newer than any check still in flight
  const applyRows = useCallback(rows => {
    if (!Array.isArray(rows)) return false;
    latestCall.current += 1;
    setState({ status: CONNECTIONS_CHECK_STATUS.ANSWERED, rows });
    return true;
  }, []);

  return { ...state, recheck, applyRows };
};
