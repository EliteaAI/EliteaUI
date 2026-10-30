import { useCallback, useEffect, useRef, useState } from 'react';

import { useCheckScheduleRiskMutation } from '@/[fsd]/entities/schedule';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

import { hasMissingCredential } from '../helpers';

export const CREDENTIAL_CHECK_STATE = { CHECKING: 'checking', MISSING: 'missing', READY: 'ready' };

/**
 * Runs the risk check of the schedule again to see if the credential a waiting run needs exists now.
 * It runs on mount, on `recheck()` and when the window gets focus again, because the owner adds the
 * credential in another tab. `enabled` false skips every check and reports `ready`.
 * A failed check keeps the state `missing`, so the Approve button stays locked.
 */
export const useWaitingRunCredentialCheck = ({ schedule, toolkit, enabled = true }) => {
  const projectId = useSelectedProjectId();
  const [checkRisk] = useCheckScheduleRiskMutation();
  const [state, setState] = useState(CREDENTIAL_CHECK_STATE.CHECKING);
  // Only the latest answer counts
  const latestCall = useRef(0);
  const { id, entity_type, application_id, version_id, approval_rule } = schedule ?? {};

  const recheck = useCallback(async () => {
    const call = ++latestCall.current;
    if (!enabled || !projectId || !application_id || !version_id) return;
    setState(CREDENTIAL_CHECK_STATE.CHECKING);
    try {
      const result = await checkRisk({
        projectId,
        entity_type,
        application_id,
        version_id,
        schedule_id: id,
        ...(approval_rule && { approval_rule }),
      }).unwrap();
      if (call === latestCall.current)
        setState(
          hasMissingCredential(result, toolkit)
            ? CREDENTIAL_CHECK_STATE.MISSING
            : CREDENTIAL_CHECK_STATE.READY,
        );
    } catch {
      if (call === latestCall.current) setState(CREDENTIAL_CHECK_STATE.MISSING);
    }
  }, [checkRisk, enabled, projectId, id, entity_type, application_id, version_id, approval_rule, toolkit]);

  useEffect(() => {
    recheck();
  }, [recheck]);

  useEffect(() => {
    window.addEventListener('focus', recheck);
    return () => window.removeEventListener('focus', recheck);
  }, [recheck]);

  return { state: enabled ? state : CREDENTIAL_CHECK_STATE.READY, recheck };
};
