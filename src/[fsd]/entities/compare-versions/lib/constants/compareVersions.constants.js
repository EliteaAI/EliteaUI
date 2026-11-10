export const AGENT_COMPARE_STEPS = [
  { key: 'instructions', label: 'Instructions' },
  { key: 'user-interaction', label: 'User Interaction' },
  { key: 'tools-skills', label: 'Tools & Skills' },
];

export const SKILL_COMPARE_STEPS = [
  { key: 'instructions', label: 'Instructions' },
  { key: 'run-settings', label: 'Run settings' },
];

export const PIPELINE_COMPARE_STEPS = [
  { key: 'pipeline-yaml', label: 'Pipeline YAML' },
  { key: 'user-interaction', label: 'User Interaction' },
  { key: 'tools', label: 'Tools' },
  { key: 'run-settings-schedules', label: 'Run settings & Schedules' },
];

export const COMPARE_ENTITY_TYPES = {
  agent: 'agent',
  pipeline: 'pipeline',
  skill: 'skill',
};

export const COMPARE_STEPS_BY_ENTITY = {
  [COMPARE_ENTITY_TYPES.agent]: AGENT_COMPARE_STEPS,
  [COMPARE_ENTITY_TYPES.pipeline]: PIPELINE_COMPARE_STEPS,
  [COMPARE_ENTITY_TYPES.skill]: SKILL_COMPARE_STEPS,
};

export const YAML_DIFF = {
  // Lines kept visible next to a change when an unchanged block collapses
  COLLAPSE_MARGIN: 3,
  // An unchanged block of 6 lines or fewer never collapses
  MAX_UNCOLLAPSED_LINES: 6,
  // The counters, node summary and validation follow the text this long after the last key press
  DEBOUNCE_MS: 500,
  // Above this, either side is shown as plain text without a diff
  MAX_LINES: 10000,
};

export const COMPARE_MESSAGES = {
  noDifferences: 'No differences in this section.',
  editorDirty: 'You have unsaved changes in the editor. Compare uses the saved versions.',
  editorDirtySave: 'Save or discard your changes in the editor first.',
  yamlTooLarge: 'This YAML is too large to compare side by side. Showing the text without highlights.',
  noPipelineTools: 'No toolkits, MCPs, agents or pipelines attached',
  noAgentTools: 'No tools, agents, pipelines or skills attached',
  toolNotAvailable: 'Not available',
  noSchedules: 'No schedules run this version.',
  onlyYourSchedules: 'Only your schedules are shown.',
  schedulesFailed: 'Failed to load schedules.',
  legacySchedule: 'Legacy schedule (cron)',
  legacyScheduleNote: 'Not editable. Create a new schedule in the Schedules section.',
};
