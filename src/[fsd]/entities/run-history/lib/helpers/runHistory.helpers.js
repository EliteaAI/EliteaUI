import { format, fromUnixTime } from 'date-fns';

import { toRunStatusLabel } from '@/[fsd]/entities/schedule/lib/helpers';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';

const RUN_TIMESTAMP_FORMAT = 'dd-MM-yyyy, hh:mm a';
export const RUN_ANALYTICS_TIMESTAMP_FORMAT = 'dd MMM yyyy, hh:mm a';
export const RUN_FULL_TIMESTAMP_FORMAT = 'dd-MM-yyyy, hh:mm:ss a';
// Usage is tagged with `run_id` / `eval_run_id` only from this date; older runs have nothing to show
const RUN_ANALYTICS_AVAILABLE_FROM = Date.UTC(2026, 8, 30);

// With extra columns the tracks are fixed rem widths: Date, extras, Execution type, Version, Duration.
// From live measures at 16 px per rem: a row grid has 736 px (a 768 px list minus 2 x 16 px of row
// padding; the row menu is absolute and takes no track). A sortable header needs its label plus 57 px (padding,
// sort icon, gap, border) and a plain one its label plus 33 px: Date 91, Schedule 99, Status 78, Execution type
// 163, Version 110 and Duration 119 px. The minimum sum is 732 px. Dates up to 145 px stay cut, with a tooltip.
const FIXED_TRACKS = {
  date: '7.5rem',
  event: '10.5rem',
  version: '7rem',
  duration: 'minmax(7.5rem, 1fr)',
};

export const resolveRunHistoryColumns = (noVersions, hasEvent, extraColumns = []) => {
  if (extraColumns.length) {
    const { date, event, version, duration } = FIXED_TRACKS;
    return [
      date,
      ...extraColumns.map(column => column.width),
      ...(hasEvent ? [event] : []),
      ...(noVersions ? [] : [version]),
      duration,
    ].join(' ');
  }

  const date = '1.5fr';
  const event = hasEvent ? ['1.5fr'] : [];
  const version = noVersions ? [] : ['1.5fr'];
  const duration = hasEvent || !noVersions ? '1fr' : '1.5fr';

  return [date, ...event, ...version, duration].join(' ');
};

export const compareRunDuration = (a, b) => {
  if (a.duration == null && b.duration == null) return 0;
  if (a.duration == null) return 1;
  if (b.duration == null) return -1;

  return a.duration - b.duration;
};

// Conversations serialize as "…+00:00Z" — an offset AND a trailing Z, which Date rejects outright.
const toRunDate = value => {
  if (typeof value === 'number') return fromUnixTime(value);

  const raw = String(value).replace(/([+-]\d{2}:?\d{2})Z$/, '$1');
  const carriesZone = /(Z|[+-]\d{2}:?\d{2})$/.test(raw);

  return new Date(carriesZone ? raw : `${raw}Z`);
};

export const parseRunTimestamp = value => {
  if (value === null || value === undefined || value === '') return NaN;

  return toRunDate(value).getTime();
};

// Sortable columns are negated for descending, which would invert any ±1 sink and float an
// unreadable row to the top. Leaving it in place is the only direction-neutral answer.
export const compareRunTimestamp = (a, b) => {
  const left = parseRunTimestamp(a);
  const right = parseRunTimestamp(b);

  if (Number.isNaN(left) || Number.isNaN(right)) return 0;

  return left - right;
};

export const byNewestRunFirst = (a, b) => {
  const left = parseRunTimestamp(a.created_at);
  const right = parseRunTimestamp(b.created_at);

  if (Number.isNaN(left) && Number.isNaN(right)) return 0;
  if (Number.isNaN(left)) return 1;
  if (Number.isNaN(right)) return -1;

  return right - left;
};

export const formatRunTimestamp = (value, pattern = RUN_TIMESTAMP_FORMAT) => {
  if (value === null || value === undefined || value === '') return '—';

  const date = toRunDate(value);
  if (Number.isNaN(date.getTime())) return '—';

  return format(date, pattern);
};

export const toRunISOString = value => {
  const time = parseRunTimestamp(value);

  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
};

// Restoring and re-running a chat bumps `updated_at`, so it wins over `created_at`. A missing or
// unparseable timestamp is NaN, which never passes the cutoff.
export const hasRunAnalytics = run =>
  parseRunTimestamp(run?.updated_at || run?.created_at) >= RUN_ANALYTICS_AVAILABLE_FROM;

const isSameEntity = (entityMeta, entityId, entityProjectId) =>
  Number(entityMeta?.id) === Number(entityId) &&
  (entityProjectId == null || Number(entityMeta?.project_id) === Number(entityProjectId));

const isRootEntity = (entityName, entityMeta, rootEntity) =>
  entityName === rootEntity?.rootEntityType &&
  isSameEntity(entityMeta, rootEntity.rootEntityId, rootEntity.rootEntityProjectId);

export const isSkillChatRun = (conversation, rootEntity) => {
  const { ParticipantEntityTypes } = ParticipantEntityConstants;
  const runPanelEntity = conversation?.meta?.single_participant;

  return (
    rootEntity?.rootEntityType === ParticipantEntityTypes.Skill &&
    Boolean(conversation) &&
    !isRootEntity(runPanelEntity?.entity_name, runPanelEntity?.entity_meta, rootEntity)
  );
};

const findRootEntityParticipant = (conversation, rootEntity) =>
  conversation?.participants?.find(participant =>
    isRootEntity(participant.entity_name, participant.entity_meta, rootEntity),
  );

const rootEntityRepliesByTime = (conversation, rootEntity) => {
  const participant = findRootEntityParticipant(conversation, rootEntity);
  if (!participant) return [];

  return (conversation.message_groups ?? [])
    .filter(group => group.author_participant_id === participant.id)
    .sort((a, b) => compareRunTimestamp(a.created_at, b.created_at));
};

export const firstRootEntityReplyAt = (conversation, rootEntity) =>
  rootEntityRepliesByTime(conversation, rootEntity)[0]?.created_at;

export const latestSkillRunVersionId = (conversation, rootEntity) =>
  rootEntityRepliesByTime(conversation, rootEntity)
    .map(group => group.meta?.skill_run?.skill_version_id)
    .findLast(versionId => versionId != null) ??
  findRootEntityParticipant(conversation, rootEntity)?.entity_settings?.version_id;

// One label per trigger source of the shared run enum; `manual` stays for older runs
const EXECUTION_TYPE_LABELS = new Map([
  ['manual', 'Manual (legacy)'],
  ['scheduled', 'Scheduled'],
  ['schedule_manual', 'Run now'],
  ['chat', 'Chat'],
  ['api', 'API'],
  ['mcp', 'MCP'],
  ['webhook', 'Webhook'],
]);

// A missing or unknown type (older runs) renders "-" and the row stays selectable. Run now and Test run both store
// schedule_manual, so the run record's trigger tells a test apart
export const toExecutionTypeRow = row => ({
  ...row,
  event_label:
    row.schedule_run?.trigger === 'test' ? 'Test' : (EXECUTION_TYPE_LABELS.get(row.execution_type) ?? '-'),
});

// The Schedule and Status columns of Agent and Pipeline Run History; '-' without a run record
export const SCHEDULE_RUN_COLUMNS = [
  {
    id: 'schedule',
    label: 'Schedule',
    width: '7.5rem',
    render: row => row.schedule_run?.schedule_name ?? '-',
  },
  {
    id: 'status',
    label: 'Status',
    width: '5.75rem',
    render: row => (row.schedule_run ? toRunStatusLabel(row.schedule_run.status) : '-'),
  },
];
