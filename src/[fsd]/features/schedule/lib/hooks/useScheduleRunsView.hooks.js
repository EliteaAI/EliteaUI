import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useApplicationDetailsQuery } from '@/api/applications';

import { mergeRuns } from '../helpers/scheduleRunsCard.helpers';
import { findWaitingRun } from '../helpers/waitingRun.helpers';
import {
  useDraftTestRuns,
  useScheduleRuns,
  useScheduleRunsLoaded,
  useScheduleRunsTotal,
} from './useScheduleRuns.hooks';

const matches = query => window.matchMedia?.(query).matches === true;
const scrollBehavior = () => (matches('(prefers-reduced-motion: reduce)') ? 'auto' : 'smooth');

/**
 * The state of the Runs card of the schedule pages: the saved schedule's runs and the Test runs of the unsaved
 * form in one list and the one run that is open. A new page has no `scheduleId` yet.
 * Test runs that were already on the server when the page opened stay out of the card (see `mergeRuns`).
 */
export const useScheduleRunsView = (scheduleId, applicationId) => {
  const projectId = useSelectedProjectId();
  const savedRuns = useScheduleRuns(scheduleId);
  const { rows: draftRuns, loaded: draftLoaded } = useDraftTestRuns(applicationId);
  const runsLoaded = useScheduleRunsLoaded(scheduleId);
  const savedTotal = useScheduleRunsTotal(scheduleId);
  // The approval notice links here with the conversation of the waiting run
  const linkedConversationId = useSearchParams()[0].get('history_run_id');
  // undefined: nothing chosen yet, so the notice link decides; null: all cards closed
  const [chosenRunId, setChosenRunId] = useState();
  const cardRef = useRef(null);

  // The draft runs of an earlier visit are not part of this page: the newest id seen at the first load is the
  // baseline for this entity
  const baseline = useRef({ applicationId: null, id: 0 });
  if (draftLoaded && baseline.current.applicationId !== applicationId) {
    baseline.current = { applicationId, id: draftRuns.reduce((max, run) => Math.max(max, run.id), 0) };
  }

  const { currentData: details } = useApplicationDetailsQuery(
    { projectId, applicationId },
    { skip: !projectId || applicationId == null },
  );
  const versionNames = useMemo(
    () => Object.fromEntries((details?.versions ?? []).map(version => [version.id, version.name])),
    [details],
  );

  const runs = useMemo(
    () =>
      mergeRuns(
        savedRuns,
        baseline.current.applicationId === applicationId ? draftRuns : [],
        baseline.current.id,
      ),
    // The baseline is set during render when the draft list loads, so the loaded flag stands for it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedRuns, draftRuns, applicationId, draftLoaded],
  );
  const draftCount = runs.length - savedRuns.length;
  const total = Number.isFinite(savedTotal)
    ? savedTotal + draftCount
    : scheduleId == null
      ? runs.length
      : undefined;

  // The newest run opens by itself, so a fresh Test Run shows its log at once
  const newestRunId = runs[0]?.id;
  const previousNewestId = useRef(newestRunId);
  useEffect(() => {
    if (newestRunId !== previousNewestId.current && newestRunId != null) setChosenRunId(newestRunId);
    previousNewestId.current = newestRunId;
  }, [newestRunId]);

  const linkedRun =
    linkedConversationId != null && runs.find(run => String(run.conversation_id) === linkedConversationId);
  // Nothing chosen yet: the linked run, else the run that waits for a decision
  const expandedRunId = chosenRunId === undefined ? (linkedRun?.id ?? findWaitingRun(runs)?.id) : chosenRunId;

  const onExpand = useCallback(runId => setChosenRunId(current => (current === runId ? null : runId)), []);

  // A #runs or history_run_id link brings the card into view once the runs are there
  const hash = useLocation().hash;
  const handledLink = useRef(null);
  useEffect(() => {
    if (hash !== '#runs' && linkedConversationId == null) {
      handledLink.current = null;
      return;
    }
    const key = `${hash}|${linkedConversationId}`;
    if (!runsLoaded || handledLink.current === key) return;
    handledLink.current = key;
    cardRef.current?.scrollIntoView?.({ behavior: scrollBehavior(), block: 'start' });
    cardRef.current?.focus?.({ preventScroll: true });
  }, [hash, linkedConversationId, runsLoaded]);

  return {
    runs,
    total,
    versionNames,
    expandedRunId,
    onExpand,
    cardRef,
  };
};
