import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';

const isFromRequestIssuedAfter = ({ observedAt, startedTimeStamp, fulfilledTimeStamp }) =>
  Boolean(observedAt && startedTimeStamp && fulfilledTimeStamp) &&
  startedTimeStamp > observedAt &&
  fulfilledTimeStamp >= startedTimeStamp;

const describesNewerRunThan = (serverRow, baselineCreatedOn) => {
  const createdOn = Number(serverRow.metadata?.created_on);
  if (!Number.isFinite(createdOn) || !Number.isFinite(baselineCreatedOn)) return null;
  return createdOn > baselineCreatedOn;
};

/**
 * Lifecycle decision for the optimistic reindex stub in IndexesContainer.
 *
 * A hard-killed run emits no terminal trace, so the stub needs a server-side signal to
 * end it. Staleness alone is not that signal: a reclaimed row reports none, and the
 * poll can miss the window where it does while the tab is unfocused. So a terminal
 * state ends the stub only once the new run is known to exist — either seen in
 * progress, or evidenced by a `created_on` newer than the row the user clicked, both
 * stamped by the backend at every run start.
 *
 * Absent that evidence a terminal state is assumed to be the PREVIOUS run's, which
 * Reindex-from-Interrupted makes the common case, and ending the stub there would
 * unmount the runner mid-run.
 *
 * @returns {'expire' | 'arm' | null}
 */
export const resolveReindexStubAction = ({
  observedAt,
  startedTimeStamp,
  fulfilledTimeStamp,
  serverRow,
  baselineCreatedOn,
  serverSawRun,
}) => {
  if (!isFromRequestIssuedAfter({ observedAt, startedTimeStamp, fulfilledTimeStamp })) return null;
  if (!serverRow || serverRow.stale) return 'expire';

  const newerRun = describesNewerRunThan(serverRow, baselineCreatedOn);
  if (serverRow.metadata?.state === IndexStatuses.progress) {
    return newerRun === false ? null : 'arm';
  }
  return serverSawRun || newerRun === true ? 'expire' : null;
};
