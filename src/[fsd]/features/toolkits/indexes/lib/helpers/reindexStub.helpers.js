import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';

/**
 * Lifecycle decision for the optimistic reindex stub in IndexesContainer.
 *
 * The stub used to expire only on `!serverRow || serverRow.stale`, but the backend
 * reclaim permanently extinguishes `stale` (a reclaimed row is `interrupted`, never
 * `in_progress`), so a session that missed the short stale window kept the stub — and
 * its spinner and action lock — for the life of the view, hiding the Interrupted state
 * from the very user who started the run.
 *
 * Two independent proofs that the dispatch landed unlock terminal-state expiry:
 * - `serverSawRun`: a post-click snapshot caught the row at `in_progress`;
 * - a row `created_on` newer than the clicked row's (`baselineCreatedOn`) — the SDK and
 *   the platform both stamp a fresh `created_on` at every run start, and both sides of
 *   the comparison are backend clocks, so this settles from a single post-run snapshot.
 *   That matters because the 300s poll pauses in a backgrounded tab: a run that starts,
 *   dies and gets reclaimed while the tab is away is only ever seen as `interrupted`.
 *
 * Without either proof a terminal state keeps the stub: a pre-run GET still carries the
 * PREVIOUS run's state — very often `interrupted`, since Reindex-from-Interrupted is the
 * primary recovery flow — and expiring on it would unmount the headless runner mid-run.
 *
 * @param {{observedAt: number|undefined, startedTimeStamp: number|undefined,
 *   fulfilledTimeStamp: number|undefined, serverRow: object|undefined,
 *   baselineCreatedOn: number|undefined, serverSawRun: boolean}} snapshot
 * @returns {'expire' | 'arm' | null} what the container should do with the stub
 */
export const resolveReindexStubAction = ({
  observedAt,
  startedTimeStamp,
  fulfilledTimeStamp,
  serverRow,
  baselineCreatedOn,
  serverSawRun,
}) => {
  if (!observedAt || !startedTimeStamp || !fulfilledTimeStamp) return null;
  if (startedTimeStamp <= observedAt) return null;
  if (fulfilledTimeStamp < startedTimeStamp) return null;
  if (!serverRow || serverRow.stale) return 'expire';
  const createdOn = Number(serverRow.metadata?.created_on);
  const comparable = Number.isFinite(createdOn) && Number.isFinite(baselineCreatedOn);
  const newRunObserved = comparable && createdOn > baselineCreatedOn;
  if (serverRow.metadata?.state === IndexStatuses.progress) {
    // An in_progress row with the clicked row's own created_on is the previous run
    // (reindex over a stale in_progress row) — latching onto it would let that run's
    // reclaim expire the stub while ours is still starting.
    return newRunObserved || !comparable ? 'arm' : null;
  }
  return serverSawRun || newRunObserved ? 'expire' : null;
};
