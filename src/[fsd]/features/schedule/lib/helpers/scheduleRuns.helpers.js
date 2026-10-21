import { compareRunTimestamp, formatRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';

// The run row trigger (SAD section 7): cron, manual (Run now) or test
const RUN_TRIGGER_LABELS = { test: 'Test', cron: 'Scheduled', manual: 'Run now' };
// The API stores the pause for a person's answer as waiting_for_approval; the owner calls it "Waiting for input"
const RUN_STATUS_LABELS = {
  waiting_for_approval: 'Waiting for input',
  waiting_for_input: 'Waiting for input',
};
const RUN_STARTED_FORMAT = 'd MMM, HH:mm';

export const toWord = value => (value ? `${value[0].toUpperCase()}${value.slice(1).replace(/_/g, ' ')}` : '');

export const toRunTriggerLabel = trigger => RUN_TRIGGER_LABELS[trigger] ?? toWord(trigger);

export const toRunStatusLabel = status => RUN_STATUS_LABELS[status] ?? toWord(status);

export const formatRunStarted = value => formatRunTimestamp(value, RUN_STARTED_FORMAT);

export const findNewestTestRun = runs =>
  (runs ?? [])
    .filter(run => run.trigger === 'test')
    .reduce(
      (newest, run) => (!newest || compareRunTimestamp(run.started_at, newest.started_at) > 0 ? run : newest),
      undefined,
    );
