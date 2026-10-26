// The API stores the pause for a person's answer as waiting_for_approval; the owner calls it "Waiting for input".
// In the entities layer, so the run history list can label a schedule run.
const RUN_STATUS_LABELS = {
  waiting_for_approval: 'Waiting for input',
  waiting_for_input: 'Waiting for input',
};

export const toWord = value => (value ? `${value[0].toUpperCase()}${value.slice(1).replace(/_/g, ' ')}` : '');

export const toRunStatusLabel = status => RUN_STATUS_LABELS[status] ?? toWord(status);
