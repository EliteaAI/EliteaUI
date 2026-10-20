export const toWord = value => (value ? `${value[0].toUpperCase()}${value.slice(1).replace(/_/g, ' ')}` : '');

// "Success, test": the status as text, then how the run started
const toEventLabel = ({ status, trigger }) =>
  [toWord(status), trigger === 'cron' ? 'scheduled' : trigger?.replace(/_/g, ' ')].filter(Boolean).join(', ');

const toDuration = ({ started_at, finished_at }) => {
  const seconds = (new Date(finished_at) - new Date(started_at)) / 1000;
  return finished_at && seconds >= 0 ? seconds : null;
};

const toRunRow = run => {
  const eventLabel = toEventLabel(run);

  return {
    id: `schedule-run:${run.id}`,
    created_at: run.started_at,
    name: eventLabel,
    event_label: eventLabel,
    event_tooltip: run.reason ? `${eventLabel} — ${run.reason}` : eventLabel,
    duration: toDuration(run),
    version_id: null,
    hasConversation: false,
    entry: run,
  };
};

export const toHistoryRows = runs => (runs ?? []).filter(run => run.conversation_id === null).map(toRunRow);

export const buildScheduleRowDecorator = runs => {
  const labelByConversation = new Map(
    (runs ?? [])
      .filter(run => run.conversation_id !== null)
      .map(run => [run.conversation_id, toEventLabel(run)]),
  );

  return row =>
    labelByConversation.has(row.id) ? { ...row, event_label: labelByConversation.get(row.id) } : row;
};
