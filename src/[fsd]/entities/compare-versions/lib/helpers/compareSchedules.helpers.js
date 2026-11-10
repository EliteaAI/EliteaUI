import {
  APPROVAL_RULE_LABELS,
  DEFAULT_APPROVAL_RULE,
  RUN_MODE,
  SYSTEM_PAUSE_LABELS,
} from '@/[fsd]/entities/schedule/lib/constants';

// AC-25 words the run mode "Entry point"; the schedule form says "Entrypoint", so the card has its own labels
const RUN_MODE_CARD_LABELS = {
  [RUN_MODE.ENTRY_POINT]: 'Entry point',
  [RUN_MODE.PROMPT]: 'Prompt',
};

/** The status shown for a schedule: active, paused by a person, or paused by the system and why. */
export const getScheduleStatusLabel = row => {
  if (row?.enabled) return 'Active';
  return SYSTEM_PAUSE_LABELS[row?.disabled_reason] ?? 'Paused';
};

export const getRunModeLabel = runMode =>
  RUN_MODE_CARD_LABELS[runMode] ?? RUN_MODE_CARD_LABELS[RUN_MODE.ENTRY_POINT];

// A schedule saved before the rule existed runs with the default rule
export const getApprovalRuleLabel = rule =>
  APPROVAL_RULE_LABELS[rule] ?? APPROVAL_RULE_LABELS[DEFAULT_APPROVAL_RULE];

export const getOwnerLabel = (owner, currentUserId) => {
  if (owner?.id != null && owner.id === currentUserId) return 'You';
  return owner?.name || 'Unknown user';
};

// Fields compared within a pair; each must be a plain value
export const COMPARED_SCHEDULE_FIELDS = ['cron', 'timezone', 'run_mode', 'status', 'owner_id', 'next_run'];

const toComparable = row => ({
  cron: row.cron ?? null,
  timezone: row.timezone ?? null,
  run_mode: row.run_mode ?? null,
  status: getScheduleStatusLabel(row),
  owner_id: row.owner?.id ?? null,
  next_run: row.enabled ? (row.next_run ?? null) : null,
});

const pairKey = row => (row.name ?? '').trim().toLowerCase();

// The list rows carry no creation time; schedule ids grow with creation, so they give the same order
const byCreation = (a, b) => (a.id ?? 0) - (b.id ?? 0);

const groupByName = rows => {
  const groups = new Map();
  [...rows].sort(byCreation).forEach(row => {
    const key = pairKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return groups;
};

const changedFieldsOf = (left, right) => {
  if (!left || !right) return new Set();
  const leftValues = toComparable(left);
  const rightValues = toComparable(right);
  return new Set(COMPARED_SCHEDULE_FIELDS.filter(field => leftValues[field] !== rightValues[field]));
};

/** The approval rule is not in the list rows; it is compared once both details have loaded. */
export const isApprovalRuleChanged = (leftRule, rightRule) =>
  Boolean(leftRule && rightRule) && leftRule !== rightRule;

/**
 * Pairs the schedules of two versions by name (trimmed, case-insensitive), in name order. Repeated names
 * pair in order of creation; the extra ones stay unpaired.
 * @returns {{ key: string, left: object|null, right: object|null, changedFields: Set<string> }[]}
 */
export const pairSchedules = (leftRows = [], rightRows = []) => {
  const leftGroups = groupByName(leftRows);
  const rightGroups = groupByName(rightRows);
  const names = [...new Set([...leftGroups.keys(), ...rightGroups.keys()])].sort((a, b) =>
    a.localeCompare(b),
  );

  return names.flatMap(name => {
    const lefts = leftGroups.get(name) ?? [];
    const rights = rightGroups.get(name) ?? [];
    return Array.from({ length: Math.max(lefts.length, rights.length) }, (_, index) => {
      const left = lefts[index] ?? null;
      const right = rights[index] ?? null;
      return {
        key: `${name}:${index}:${left?.id ?? '-'}:${right?.id ?? '-'}`,
        left,
        right,
        changedFields: changedFieldsOf(left, right),
      };
    });
  });
};
