import { compareRunTimestamp } from '@/[fsd]/entities/run-history';

import { describeRunDuration, formatRunCost } from './scheduleRuns.helpers';

export const ALL_FILTER = '';

// The stored trigger `cron` reads "Scheduled" everywhere the user sees it
export const TRIGGER_LABELS = { cron: 'Scheduled', manual: 'Manual', test: 'Test' };
export const TRIGGER_FILTER_OPTIONS = [
  { label: 'All', value: ALL_FILTER },
  ...Object.entries(TRIGGER_LABELS).map(([value, label]) => ({ label, value })),
];

export const toTriggerLabel = trigger => TRIGGER_LABELS[trigger] ?? trigger;

const newestFirst = (a, b) => compareRunTimestamp(b.started_at, a.started_at);

/**
 * The rows of the Runs card: the saved schedule's runs and the Test runs of the unsaved form, newest first.
 * The draft belongs to the owner and the agent or pipeline, not to one schedule, so draft runs that were
 * already there when the page opened (`baselineDraftId`) stay out of this card; Run History holds them.
 */
export const mergeRuns = (savedRuns, draftRuns, baselineDraftId) =>
  [...savedRuns, ...draftRuns.filter(run => run.id > baselineDraftId)].sort(newestFirst);

export const filterRuns = (runs, { trigger, status }) =>
  runs.filter(run => (!trigger || run.trigger === trigger) && (!status || run.status === status));

// Statuses of the rows in view, so the Status filter lists only values that can match
export const toStatusOptions = (runs, toLabel) => [
  { label: 'All', value: ALL_FILTER },
  ...[...new Set(runs.map(run => run.status))].map(value => ({ label: toLabel(value), value })),
];

// "base · 10 s · 1,704 tokens · $0.0024": the facts of a run in one line; a missing figure is left out
export const describeRunFacts = run =>
  [
    run.version_label,
    describeRunDuration(run),
    run.tokens != null && `${run.tokens.toLocaleString('en-US')} tokens`,
    run.cost_usd != null && formatRunCost(run.cost_usd),
  ]
    .filter(Boolean)
    .join(' · ');
