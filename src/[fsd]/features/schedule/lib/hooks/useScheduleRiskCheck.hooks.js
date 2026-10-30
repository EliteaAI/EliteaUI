import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCheckScheduleRiskMutation } from '@/[fsd]/entities/schedule';

import { RISK_CHECK_STATUS } from '../constants';
import { splitRiskFindings } from '../helpers';

// The state keeps the phase of the request. The blocked and clear status come from the findings
// and the rule, so they have no second copy in the state.
const ANSWERED = 'answered';
const IDLE_STATE = { phase: RISK_CHECK_STATUS.IDLE, result: null };

const statusOf = (result, approvalRule) =>
  splitRiskFindings(result, approvalRule).blocking.length
    ? RISK_CHECK_STATUS.BLOCKED
    : RISK_CHECK_STATUS.CLEAR;

/**
 * The dry-run risk check of the schedule form. It runs when the entity type, the
 * entity or the version changes and when the person returns to the tab. `runCheck()` runs it now
 * and resolves to the findings, or null when the check did not run. `approvalRule` is the rule of the form:
 * under "Pause and ask me" a missing credential or a personal sign-in is `waiting`, not `blocking`. `applyFindings(data)` takes the
 * findings of a 409 save answer. On an edit, `scheduleId` makes the server scan as the schedule owner
 * and answer `confirmed`.
 */
export const useScheduleRiskCheck = ({
  projectId,
  entityType,
  applicationId,
  versionId,
  scheduleId,
  approvalRule,
}) => {
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
    setState(prev => ({ ...prev, phase: RISK_CHECK_STATUS.CHECKING }));
    try {
      const result = await checkRisk({
        projectId,
        entity_type: entityType,
        application_id: applicationId,
        version_id: versionId,
        ...(scheduleId && { schedule_id: scheduleId }),
      }).unwrap();
      if (call === latestCall.current) setState({ phase: ANSWERED, result, key });
      return result;
    } catch {
      // A failed check shows as failed; the findings of the same pair stay for an open review dialog
      if (call === latestCall.current) {
        setState(prev => ({
          phase: RISK_CHECK_STATUS.FAILED,
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

  const applyFindings = useCallback(({ blocking, warnings, sensitive, notices, fingerprint }) => {
    setState(prev => {
      const result = {
        ...prev.result,
        ...(blocking && { blocking }),
        ...(warnings && { warnings }),
        ...(sensitive && { sensitive }),
        ...(notices && { notices }),
        ...(fingerprint && { fingerprint }),
      };
      return { ...prev, phase: ANSWERED, result };
    });
  }, []);

  // The rule can change after the answer came, so the findings are split again for the current rule
  // without a new request
  const { phase, result, key } = state;
  const findings = useMemo(() => splitRiskFindings(result, approvalRule), [result, approvalRule]);
  const status = phase === ANSWERED ? statusOf(result, approvalRule) : phase;

  return { status, result, key, ...findings, runCheck, applyFindings };
};
