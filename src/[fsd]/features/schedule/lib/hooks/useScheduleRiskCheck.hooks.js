import { useCallback, useEffect, useRef, useState } from 'react';

import { useCheckScheduleRiskMutation } from '@/[fsd]/entities/schedule';

import { RISK_CHECK_STATUS } from '../constants';

const IDLE_STATE = { status: RISK_CHECK_STATUS.IDLE, result: null };

const statusOf = result => (result.blocking?.length ? RISK_CHECK_STATUS.BLOCKED : RISK_CHECK_STATUS.CLEAR);

/**
 * The dry-run risk check of the schedule form. It runs when the entity type, the
 * entity or the version changes and when the person returns to the tab. `runCheck()` runs it now
 * and resolves to the findings, or null when the check did not run. `applyFindings(data)` takes the
 * findings of a 409 save answer. On an edit, `scheduleId` makes the server scan as the schedule owner
 * and answer `confirmed`.
 */
export const useScheduleRiskCheck = ({ projectId, entityType, applicationId, versionId, scheduleId }) => {
  const [checkRisk] = useCheckScheduleRiskMutation();
  const [state, setState] = useState(IDLE_STATE);
  // Only the answer of the latest call is shown: an older one may name another version
  const latestCall = useRef(0);

  const runCheck = useCallback(async () => {
    const call = ++latestCall.current;
    if (!applicationId || !versionId) {
      setState(IDLE_STATE);
      return null;
    }
    // The findings belong to one entity and version; a failed re-check of the same pair keeps them, with the failed status
    const key = `${entityType}:${applicationId}:${versionId}`;
    setState(prev => ({ ...prev, status: RISK_CHECK_STATUS.CHECKING }));
    try {
      const result = await checkRisk({
        projectId,
        entity_type: entityType,
        application_id: applicationId,
        version_id: versionId,
        ...(scheduleId && { schedule_id: scheduleId }),
      }).unwrap();
      if (call === latestCall.current) setState({ status: statusOf(result), result, key });
      return result;
    } catch {
      // A failed check shows as failed; the findings of the same pair stay for an open review dialog
      if (call === latestCall.current) {
        setState(prev => ({
          status: RISK_CHECK_STATUS.FAILED,
          result: prev.key === key ? prev.result : null,
          key: prev.key,
        }));
      }
      return null;
    }
  }, [checkRisk, projectId, entityType, applicationId, versionId, scheduleId]);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') runCheck();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [runCheck]);

  const applyFindings = useCallback(({ blocking, sensitive, notices, fingerprint }) => {
    setState(prev => {
      const result = {
        ...prev.result,
        ...(blocking && { blocking }),
        ...(sensitive && { sensitive }),
        ...(notices && { notices }),
        ...(fingerprint && { fingerprint }),
      };
      return { ...prev, status: statusOf(result), result };
    });
  }, []);

  return { ...state, runCheck, applyFindings };
};
