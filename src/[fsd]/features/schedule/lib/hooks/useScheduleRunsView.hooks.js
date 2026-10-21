import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

import { compareRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useApplicationDetailsQuery } from '@/api/applications';

import { formatRunStarted, toRunStatusLabel } from '../helpers/scheduleRuns.helpers';
import { useScheduleRuns, useScheduleRunsLoaded } from './useScheduleRuns.hooks';

// From xl the panel and the list are both in view, so the page scrolls only below it
const matches = query => window.matchMedia?.(query).matches === true;
const isWide = () => matches('(min-width: 1536px)');
const scrollBehavior = () => (matches('(prefers-reduced-motion: reduce)') ? 'auto' : 'smooth');
const byNewest = (a, b) => compareRunTimestamp(b.started_at, a.started_at);

/**
 * The Edit schedule page state shared by the test panel and the Runs section (owner CR 2026-10-21):
 * the run the panel shows, the open state of the Runs section and the scroll targets.
 */
export const useScheduleRunsView = (scheduleId, applicationId) => {
  const projectId = useSelectedProjectId();
  const runs = useScheduleRuns(scheduleId);
  const runsLoaded = useScheduleRunsLoaded(scheduleId);
  // The approval notice links here with the conversation of the waiting run (US-41 R1.2)
  const linkedConversationId = useSearchParams()[0].get('history_run_id');
  // undefined: nothing chosen yet, so the notice link decides; null: back to the test
  const [chosenRunId, setChosenRunId] = useState();
  const [runsExpanded, setRunsExpanded] = useState(true);
  // A request to show the runs ({ runId } or { conversationId }) waits for the section to mount and the runs to load
  const [request, setRequest] = useState(null);
  const [runNotFound, setRunNotFound] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  // A callback ref: the section may mount after the schedule, and the request waits for it
  const [sectionElement, setSectionElement] = useState(null);
  const runsSectionRef = useCallback(node => setSectionElement(node), []);
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

  // Below xl the panel sits under the form, so Open scrolls to it; at xl both are in view
  const openRun = useCallback(run => {
    setChosenRunId(run.id);
    if (!isWide()) panelRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }, []);
  const backToTest = useCallback(() => setChosenRunId(null), []);
  // Run History (CR-21): open the Runs section and select the run when one is named. The effect below
  // scrolls and focuses once the section and the runs are there. The arg may be a click event.
  const showRunHistory = useCallback(arg => {
    const runId = arg?.runId;
    if (runId != null) setChosenRunId(runId);
    setRunsExpanded(true);
    setRequest({ runId });
  }, []);

  useEffect(() => {
    if (!request || !sectionElement || !runsExpanded || !runsLoaded) return;
    const named = request.runId != null || request.conversationId != null;
    const run = named
      ? runs.find(item =>
          request.runId != null
            ? item.id === request.runId
            : String(item.conversation_id) === request.conversationId,
        )
      : [...runs].sort(byNewest)[0];
    const row = run && sectionElement.querySelector(`[data-run-id="${run.id}"]`);
    sectionElement.scrollIntoView({ behavior: scrollBehavior(), block: isWide() ? 'nearest' : 'start' });
    row?.scrollIntoView?.({ block: 'nearest' });
    (row || sectionElement).focus?.({ preventScroll: true });
    setRunNotFound(named && !run);
    setAnnouncement(
      named && run
        ? `Showing run ${formatRunStarted(run.started_at)}, ${run.trigger}, ${toRunStatusLabel(run.status)}`
        : 'Showing the runs of this schedule',
    );
    setRequest(null);
  }, [request, sectionElement, runsExpanded, runsLoaded, runs]);

  // A #runs or history_run_id link shows the runs once the page has its schedule. A new hash asks again.
  const hash = useLocation().hash;
  const handledLink = useRef(null);
  useEffect(() => {
    if (hash !== '#runs' && linkedConversationId == null) {
      handledLink.current = null;
      return;
    }
    const key = `${hash}|${linkedConversationId}`;
    if (scheduleId == null || handledLink.current === key) return;
    handledLink.current = key;
    setRunsExpanded(true);
    setRequest({ conversationId: linkedConversationId ?? undefined });
  }, [hash, linkedConversationId, scheduleId]);

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
    announcement,
    runNotFound,
  };
};
