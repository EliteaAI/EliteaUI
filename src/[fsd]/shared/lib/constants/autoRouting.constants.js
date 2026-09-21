export const AUTO_MODEL_ID = '__elitea_auto__';
export const AUTO_DEFAULT_VALUE = '__elitea_auto_default__';
export const AUTO_MODEL_LABEL = 'Auto';
export const AUTO_SELECTION_MODE = 'auto';
export const AUTO_SCOPE_MODE = 'task_episode';
export const AUTO_REASONING_MODE = { auto: 'auto', explicit: 'explicit' };
export const MODEL_SURFACES = { chat: 'chat', agent: 'agent', pipeline: 'pipeline' };
export const AUTO_REASONING_OPTIONS = [
  { value: AUTO_REASONING_MODE.auto, label: AUTO_MODEL_LABEL },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
export const AUTO_REASONING_HELP =
  'Auto chooses the effort. An explicit effort limits selection to qualified models supporting that preset.';
export const AUTO_OUTPUT_HELP =
  'Auto selects a validated output allowance for the selected model. Custom limits are checked by the service.';
