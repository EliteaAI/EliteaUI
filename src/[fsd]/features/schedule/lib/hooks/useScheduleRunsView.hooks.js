import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

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
  // Run History (CR-21): open the Runs section, select the run when one is named, scroll and focus
  const showRunHistory = useCallback(({ runId } = {}) => {
    if (runId != null) setChosenRunId(runId);
    setRunsExpanded(true);
    runsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    runsSectionRef.current?.focus?.({ preventScroll: true });
  }, []);

  // A #runs link opens on the Runs section, once the page has its schedule and so its section
  const hash = useLocation().hash;
  const scrolledToHash = useRef(false);
  useEffect(() => {
    if (hash !== '#runs' || scheduleId == null || scrolledToHash.current) return;
    scrolledToHash.current = true;
    showRunHistory();
  }, [hash, scheduleId, showRunHistory]);

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
