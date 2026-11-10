import { isWebhookRow } from '@/[fsd]/entities/schedule';

const POLLING_INTERVAL_MS = 10000;

// Refetch the list while any row shows a Running last run
export const getPollingInterval = rows =>
  rows?.some(row => row.last_run_status === 'running') ? POLLING_INTERVAL_MS : 0;

// A viewer who manages a schedule (`change_owner`) but has no `run` in `allowed_actions` cannot run it. The owner's
// own schedule with a version always has `run`, so without it and with a version the hint tells why: the text, else null
export const runDeniedHint = schedule => {
  const allowed = schedule?.allowed_actions ?? [];
  // A webhook never runs from the UI, so nobody gets the hint
  if (isWebhookRow(schedule)) return null;
  if (allowed.includes('run') || !allowed.includes('change_owner') || schedule.version_id == null)
    return null;
  const name = schedule.owner?.name;
  return name
    ? `You do not have the right to run this schedule. The owner is ${name}.`
    : 'You do not have the right to run this schedule.';
};

export const RUN_AS_ADMIN_HINT = 'Runs as you, with your credentials. It pauses before sensitive actions.';

// A project admin who runs a schedule owned by someone else starts a run that acts as the admin, not as the owner.
// The text shows only to that viewer: an owner, an admin who owns the schedule and a viewer without `run` get null.
// A schedule whose owner is unknown gets null too, because the viewer cannot be told apart from the owner.
export const runAsAdminHint = (schedule, { isAdmin, userId }) => {
  if (!isAdmin || isWebhookRow(schedule) || !schedule?.allowed_actions?.includes('run')) return null;
  const ownerId = schedule.owner?.id;
  return ownerId == null || ownerId === userId ? null : RUN_AS_ADMIN_HINT;
};
