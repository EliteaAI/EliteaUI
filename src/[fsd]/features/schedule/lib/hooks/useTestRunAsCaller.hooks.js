import { useCallback, useState } from 'react';

import { APPROVAL_RULE, useStartDraftTestRunMutation } from '@/[fsd]/entities/schedule';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';

import { buildEditValues, toCreateBody } from '../helpers';
import { DRAFT_TEST_ERROR, TEST_RUN_UNAVAILABLE } from './useScheduleSave.hooks';

// Server text reaches the page for 400 and 409 only (the project does not allow the approval rule, or a Test run
// is active). The unavailable-server code gets a fixed text, as the Test Run of the form does.
const testRunErrorText = error => {
  if (error?.status === 503 && error?.data?.code === DRAFT_TEST_ERROR.UNAVAILABLE)
    return TEST_RUN_UNAVAILABLE;
  if ([400, 409].includes(error?.status) && error.data?.error) return error.data.error;
  return 'Failed to start the test run';
};

/**
 * Starts a Test run of a saved schedule as the viewer. The body is the Save body of the schedule with the rule
 * `pause_and_ask` and no `enabled`, so the server runs it as a run with no schedule row. It acts as the caller,
 * and a run that waits on the schedule does not block it. `start()` resolves true when the run started, false after a failure (a toast names it).
 */
export const useTestRunAsCaller = schedule => {
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const [startDraftTestRun] = useStartDraftTestRunMutation();
  const [pending, setPending] = useState(false);

  const start = useCallback(async () => {
    setPending(true);
    try {
      // The owner's consent to run without asking and the enabled flag stay behind: the caller's run always asks
      const values = {
        ...buildEditValues(schedule).values,
        approval_rule: APPROVAL_RULE.PAUSE_AND_ASK,
        enabled: undefined,
      };
      await startDraftTestRun({ projectId, ...toCreateBody(values) }).unwrap();
      toastSuccess('Test run started as you');
      return true;
    } catch (error) {
      toastError(testRunErrorText(error));
      return false;
    } finally {
      setPending(false);
    }
  }, [schedule, projectId, startDraftTestRun, toastError, toastSuccess]);

  return { start, pending };
};
