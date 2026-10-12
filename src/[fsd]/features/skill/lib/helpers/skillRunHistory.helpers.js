import { endOfDay, startOfDay } from 'date-fns';

import { SKILL_RUN_STATUS_LABELS } from '@/[fsd]/features/skill/lib/constants';

const NO_VALUE = '—';

const isMissing = value => value === null || value === undefined;
const COST_FRACTION_DIGITS = 4;

const toIsoBoundary = (date, toBoundary) => {
  if (!date || Number.isNaN(date.getTime?.())) return undefined;
  return toBoundary(date).toISOString();
};

export const buildSkillRunHistoryParams = ({ query, dateFrom, dateTo, authorId, versionId, status, model }) =>
  Object.fromEntries(
    Object.entries({
      query: query?.trim() || undefined,
      created_from: toIsoBoundary(dateFrom, startOfDay),
      created_to: toIsoBoundary(dateTo, endOfDay),
      author_id: authorId ?? undefined,
      version_id: versionId ?? undefined,
      status: status || undefined,
      model: model || undefined,
    }).filter(([, value]) => value !== undefined),
  );

export const hasSkillRunHistoryFilters = filters =>
  Object.keys(buildSkillRunHistoryParams(filters)).length > 0;

export const formatRunAuthor = run => run.author?.name || run.author?.email || NO_VALUE;

export const formatRunModels = run => (run.models?.length ? run.models.join(', ') : NO_VALUE);

export const formatRunTokens = run => (isMissing(run.tokens) ? NO_VALUE : run.tokens.toLocaleString());

export const formatRunCost = run =>
  isMissing(run.cost) ? NO_VALUE : `$${run.cost.toFixed(COST_FRACTION_DIGITS)}`;

export const formatRunStatus = run => SKILL_RUN_STATUS_LABELS[run.status] ?? NO_VALUE;

const compareNullableNumbers = (left, right) => {
  if (isMissing(left) && isMissing(right)) return 0;
  if (isMissing(left)) return 1;
  if (isMissing(right)) return -1;
  return left - right;
};

const compareText = format => (a, b) => format(a).localeCompare(format(b));

export const buildSkillRunHistoryColumns = () => [
  {
    type: 'messages',
    label: 'Messages',
    width: '0.8fr',
    getText: run => String(run.message_count ?? 0),
    compare: (a, b) => compareNullableNumbers(a.message_count, b.message_count),
  },
  {
    type: 'user',
    label: 'User',
    width: '1.2fr',
    getText: formatRunAuthor,
    getTooltip: run => run.author?.email ?? '',
    compare: compareText(formatRunAuthor),
  },
  {
    type: 'model',
    label: 'Model',
    width: '1.5fr',
    getText: formatRunModels,
    compare: compareText(formatRunModels),
  },
  {
    type: 'tokens',
    label: 'Tokens',
    width: '0.9fr',
    getText: formatRunTokens,
    compare: (a, b) => compareNullableNumbers(a.tokens, b.tokens),
  },
  {
    type: 'cost',
    label: 'Cost',
    width: '0.9fr',
    getText: formatRunCost,
    compare: (a, b) => compareNullableNumbers(a.cost, b.cost),
  },
  {
    type: 'status',
    label: 'Status',
    width: '0.9fr',
    getText: formatRunStatus,
    compare: compareText(formatRunStatus),
  },
];
