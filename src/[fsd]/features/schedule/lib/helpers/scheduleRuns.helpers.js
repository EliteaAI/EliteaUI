import { compareRunTimestamp, formatRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import { fmtCost } from '@/[fsd]/features/settings/lib/helpers/analyticsCommon.helpers';
import { ROLES } from '@/common/constants';

const RUN_STARTED_FORMAT = 'd MMM, HH:mm';

// The labels live in the schedule entity, so the run history list can use them too (CR-22)
export { toRunStatusLabel, toWord } from '@/[fsd]/entities/schedule/lib/helpers';

export const formatRunStarted = value => formatRunTimestamp(value, RUN_STARTED_FORMAT);

export const findNewestTestRun = runs =>
  (runs ?? [])
    .filter(run => run.trigger === 'test')
    .reduce(
      (newest, run) => (!newest || compareRunTimestamp(run.started_at, newest.started_at) > 0 ? run : newest),
      undefined,
    );

// Owner CR 2026-10-21 test panel log: the server polls stop once a run leaves these statuses
const ACTIVE_RUN_STATUSES = ['running', 'waiting_for_approval'];
// The level a log line takes when the server sends none
const LOG_KIND_LEVELS = { risk_check: 'warning', paused: 'warning', finished: 'success' };
const APPROVAL_WINDOW_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export const isRunActive = status => ACTIVE_RUN_STATUSES.includes(status);

export const formatRunDuration = durationMs => {
  if (durationMs == null) return '–';
  const seconds = Math.round(durationMs / 1000);
  return seconds < 60
    ? `${seconds} s`
    : `${Math.floor(seconds / 60)} m ${String(seconds % 60).padStart(2, '0')} s`;
};

const MIN_ROUNDED_COST = 0.0001;
const MAX_ROUNDED_COST = 0.01;

// The Analytics format, except that a small cost rounds to the nearest 4th decimal (0.00161 reads $0.0016)
const formatRunCost = costUsd =>
  costUsd >= MIN_ROUNDED_COST && costUsd < MAX_ROUNDED_COST ? `$${costUsd.toFixed(4)}` : fmtCost(costUsd);

export const formatRunSummary = summary =>
  [
    summary?.duration_ms != null && formatRunDuration(summary.duration_ms),
    summary?.tokens != null && `${summary.tokens.toLocaleString('en-US')} tokens`,
    summary?.cost_usd != null && formatRunCost(summary.cost_usd),
  ]
    .filter(Boolean)
    .join(' · ');

export const toLogLevel = event => event.level ?? LOG_KIND_LEVELS[event.kind] ?? 'info';

// lean: headings, emphasis, code, quotes and links only; use a markdown parser if tables or HTML show up
// The text of a chat message: the API keeps it in the `text_message` item, as convertChatConversationMessages
// reads it; an older message has it in `content` (CR-21)
const toMessageText = message =>
  message.message_items?.find(item => item.item_type === 'text_message')?.item_details?.content ||
  message.content;

// The text of the last answer with text in a converted conversation; undefined without one (CR-21)
export const findRunAnswer = messages =>
  messages
    .filter(message => message.role === ROLES.Assistant)
    .map(toMessageText)
    .findLast(Boolean);

export const toPlainText = markdown =>
  (markdown ?? '')
    .replace(/^#+\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\[([^\][]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|`)/g, '')
    // A blank line would fill a line of the clamped preview with nothing (CR-21)
    .replace(/\n\s*\n/g, '\n')
    .trim();

export const formatExpiresIn = (pausedAt, now) => {
  if (!pausedAt) return '';
  const left = Date.parse(pausedAt) + APPROVAL_WINDOW_MS - now;
  if (left <= 0) return 'Expired';
  const minutes = Math.floor(left / MINUTE_MS);
  return `Expires in ${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};
