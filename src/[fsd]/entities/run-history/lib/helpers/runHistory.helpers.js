import { format, fromUnixTime } from 'date-fns';

import { toRunStatusLabel } from '@/[fsd]/entities/schedule/lib/helpers';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';

const RUN_TIMESTAMP_FORMAT = 'dd-MM-yyyy, hh:mm a';
export const RUN_ANALYTICS_TIMESTAMP_FORMAT = 'dd MMM yyyy, hh:mm a';
export const RUN_FULL_TIMESTAMP_FORMAT = 'dd-MM-yyyy, hh:mm:ss a';
// Usage is tagged with `run_id` / `eval_run_id` only from this date; older runs have nothing to show
const RUN_ANALYTICS_AVAILABLE_FROM = Date.UTC(2026, 8, 30);

// Date, Event, Version and Duration tracks; Event takes the leftover width
const FIXED_TRACKS = {
  date: 'minmax(10rem, 1fr)',
  event: 'minmax(7rem, 0.75fr)',
  version: 'minmax(7rem, 1fr)',
  duration: 'minmax(6rem, 1fr)',
};

// Minimum widths that fit each header label with its sort arrow
const LABEL_MIN_WIDTH = {
  schedule: '11rem',
  status: '8.5rem',
  complexity: '8rem',
};

const flexTrack = column => `minmax(${LABEL_MIN_WIDTH[column.id] ?? column.width}, 1fr)`;

// The list keeps 48 rem with the schedule and status columns; any further column adds exactly its own width
const SCHEDULE_LIST_WIDTH_REM = 48;
const sumColumnWidthsRem = columns => columns.reduce((sum, column) => sum + parseFloat(column.width), 0);

export const resolveRunHistoryListWidth = (extraColumns = []) =>
  extraColumns.length
    ? `${SCHEDULE_LIST_WIDTH_REM - sumColumnWidthsRem(SCHEDULE_RUN_COLUMNS) + sumColumnWidthsRem(extraColumns)}rem`
    : '32rem';

export const resolveRunHistoryColumns = (noVersions, hasEvent, extraColumns = []) => {
  if (extraColumns.length) {
    const { date, event, version, duration } = FIXED_TRACKS;
    return [
      date,
      ...(hasEvent ? [event] : []),
      ...extraColumns.map(flexTrack),
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
  ['schedule_manual', 'Manual'],
  ['chat', 'Chat'],
  ['api', 'API'],
  ['mcp', 'MCP'],
  ['webhook', 'Webhook'],
]);

// A missing or unknown type (older runs) renders "-" and the row stays selectable. Older test runs were stored
// as schedule_manual, so the run record's trigger still tells a test apart; a webhook test is its sample-body run
const toEventLabel = row => {
  // Early webhook runs were stored as scheduled; their run record still says webhook
  if (row.schedule_run?.trigger === 'webhook') return EXECUTION_TYPE_LABELS.get('webhook');
  if (row.schedule_run?.trigger !== 'test') return EXECUTION_TYPE_LABELS.get(row.execution_type) ?? '-';
  return row.execution_type === 'webhook' ? 'Webhook (sample)' : 'Test';
};

export const toExecutionTypeRow = row => ({ ...row, event_label: toEventLabel(row) });

// The Schedule and Status columns of Agent and Pipeline Run History; '-' when the row has no run record
export const SCHEDULE_RUN_COLUMNS = [
  {
    id: 'schedule',
    label: 'Schedule/Webhook',
    width: '10rem',
    render: row => row.schedule_run?.schedule_name ?? '-',
  },
  {
    id: 'status',
    label: 'Status',
    width: '9.5rem',
    // A schedule run keeps its own status; other rows use the server's run_status
    render: row => {
      const status = row.schedule_run?.status ?? row.run_status;
      return status ? toRunStatusLabel(status) : '-';
    },
  },
];
