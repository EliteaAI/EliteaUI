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
  // A saved schedule has no Test Run on its page, so its page never asks for the draft runs
  const {
    rows: draftRuns,
    loaded: draftLoaded,
    failed: draftFailed,
    settled: draftSettled,
  } = useDraftTestRuns(applicationId, scheduleId != null);
  const runsLoaded = useScheduleRunsLoaded(scheduleId);
  const savedTotal = useScheduleRunsTotal(scheduleId);
  // The approval notice links here with the conversation of the waiting run
  const linkedConversationId = useSearchParams()[0].get('history_run_id');
  // undefined: nothing chosen yet, so the notice link decides; null: all cards closed
  const [chosenRunId, setChosenRunId] = useState();
  const cardRef = useRef(null);

  // The draft runs of an earlier visit are not part of this page: the newest id seen at the first load is the
  // baseline for this entity
  const [baseline, setBaseline] = useState({ applicationId: null, id: 0 });
  useEffect(() => {
    // A failed first list counts as an empty one, so every later run is new
    if (!draftLoaded && !draftFailed) return;
    setBaseline(current =>
      current.applicationId === applicationId
        ? current
        : { applicationId, id: draftRuns.reduce((max, run) => Math.max(max, run.id), 0) },
    );
  }, [applicationId, draftLoaded, draftFailed, draftRuns]);

  const { currentData: details } = useApplicationDetailsQuery(
    { projectId, applicationId },
    { skip: !projectId || applicationId == null },
  );
  const versionNames = useMemo(
    () => Object.fromEntries((details?.versions ?? []).map(version => [version.id, version.name])),
    [details],
  );

  const runs = useMemo(
    () => mergeRuns(savedRuns, baseline.applicationId === applicationId ? draftRuns : [], baseline.id),
    [savedRuns, draftRuns, applicationId, baseline],
  );
  const draftCount = runs.length - savedRuns.length;
  const total = Number.isFinite(savedTotal)
    ? savedTotal + draftCount
    : scheduleId == null
      ? runs.length
      : undefined;

  // A run the user starts (Test Run, Run Now) opens by itself, so its log shows at once. A scheduled run that
  // starts meanwhile must not close the card the user reads.
  const newestRunId = runs[0]?.id;
  const previousNewestId = useRef(newestRunId);
  const expectingRun = useRef(false);
  const expectRun = useCallback(() => {
    expectingRun.current = true;
  }, []);
  // A start that failed must not leave the card waiting for a run
  const cancelExpectRun = useCallback(() => {
    expectingRun.current = false;
  }, []);
  useEffect(() => {
    if (newestRunId !== previousNewestId.current && newestRunId != null && expectingRun.current) {
      expectingRun.current = false;
      setChosenRunId(newestRunId);
    }
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
    expectRun,
    cancelExpectRun,
    draftSettled,
    cardRef,
  };
};
