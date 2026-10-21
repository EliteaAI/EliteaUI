import { useCallback, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useApplicationDetailsQuery } from '@/api/applications';

import { useScheduleRuns } from './useScheduleRuns.hooks';

/**
 * The Edit schedule page state shared by the test panel and the Runs section (owner CR 2026-10-21):
 * the run the panel shows, the open state of the Runs section and the scroll targets.
 */
export const useScheduleRunsView = (scheduleId, applicationId) => {
  const projectId = useSelectedProjectId();
  const runs = useScheduleRuns(scheduleId);
  // The approval notice links here with the conversation of the waiting run (US-41 R1.2)
  const linkedConversationId = useSearchParams()[0].get('history_run_id');
  // undefined: nothing chosen yet, so the notice link decides; null: back to the test
  const [chosenRunId, setChosenRunId] = useState();
  const [runsExpanded, setRunsExpanded] = useState(true);
  const runsSectionRef = useRef(null);
  const panelRef = useRef(null);

  // The same args as the form's entity details, so both share one request
  const { currentData: details } = useApplicationDetailsQuery(
    { projectId, applicationId },
    { skip: !projectId || applicationId == null },
  );
  const versionNames = useMemo(
    () => Object.fromEntries((details?.versions ?? []).map(version => [version.id, version.name])),
    [details],
  );

  const viewedRun =
    chosenRunId === undefined
      ? linkedConversationId != null && runs.find(run => String(run.conversation_id) === linkedConversationId)
      : runs.find(run => run.id === chosenRunId);

  // Below xl the panel sits under the form, so Open scrolls to it
  const openRun = useCallback(run => {
    setChosenRunId(run.id);
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);
  const backToTest = useCallback(() => setChosenRunId(null), []);
  const showRunHistory = useCallback(() => {
    setRunsExpanded(true);
    runsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return {
    runs,
    viewedRun: viewedRun || undefined,
    versionNames,
    runsExpanded,
    setRunsExpanded,
    runsSectionRef,
    panelRef,
    openRun,
    backToTest,
    showRunHistory,
  };
};
