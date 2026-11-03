const POLLING_INTERVAL_MS = 10000;

// Refetch the list while any row shows a Running last run
export const getPollingInterval = rows =>
  rows?.some(row => row.last_run_status === 'running') ? POLLING_INTERVAL_MS : 0;

// #7254: an admin sees another owner's schedule (change_owner) but never runs it. The owner's own schedule with a
// version always has `run`, so without it and with a version this viewer is not the owner: the hint, else null
export const ownerOnlyRunHint = schedule => {
  const allowed = schedule?.allowed_actions ?? [];
  if (allowed.includes('run') || !allowed.includes('change_owner') || schedule.version_id == null)
    return null;
  const name = schedule.owner?.name;
  return name ? `Only the schedule owner, ${name}, can run it.` : 'Only the schedule owner can run it.';
};
