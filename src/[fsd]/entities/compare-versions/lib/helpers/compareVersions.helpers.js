import { buildVersionOption, formatVersionMeta } from '@/[fsd]/entities/version';

export { formatVersionMeta };

const resolveToolEntityType = tool => {
  if (tool.type !== 'application') return tool.entity_type ?? 'toolkit';
  if (tool.agent_type === 'pipeline') return 'pipeline';
  return 'agent';
};

const resolveToolId = tool => {
  if (tool.type === 'application') return tool.settings?.application_id ?? tool.id;
  return tool.id;
};

// A linked agent or pipeline is gone, or not visible, when the version API found no version for it:
// it then sends no agent_type. A toolkit or MCP is gone when the version carries no tool id.
const isToolAvailable = tool =>
  tool.type === 'application' ? Boolean(tool.settings?.application_id && tool.agent_type) : tool.id != null;

const toCompareTool = tool => ({
  ...tool,
  id: resolveToolId(tool),
  entityType: resolveToolEntityType(tool),
  isAvailable: isToolAvailable(tool),
});

export const extractAgentCompareData = versionDetail => {
  const vd = versionDetail ?? {};
  return {
    instructions: vd.instructions ?? '',
    welcome_message: vd.welcome_message ?? '',
    conversation_starters: vd.conversation_starters ?? [],
    tools: [
      ...(vd.tools ?? []).map(t => ({ ...t, id: resolveToolId(t), entityType: resolveToolEntityType(t) })),
      ...(vd.skills ?? []).map(s => ({ ...s, id: s.skill_id, entityType: 'skill' })),
    ],
  };
};

/** Pipeline version fields the compare wizard shows; `instructions` holds the pipeline YAML. */
export const extractPipelineCompareData = versionDetail => {
  const vd = versionDetail ?? {};
  return {
    instructions: vd.instructions ?? '',
    welcome_message: vd.welcome_message ?? '',
    conversation_starters: vd.conversation_starters ?? [],
    tools: (vd.tools ?? []).map(toCompareTool),
    run_settings: {
      step_limit: vd.meta?.step_limit ?? null,
      ignore_project_context: Boolean(vd.meta?.ignore_project_context),
    },
    // A cron trigger kept on the version until the schedule migration; read only
    legacy_trigger: vd.pipeline_settings?.trigger?.cron ? vd.pipeline_settings.trigger : null,
  };
};

export const extractSkillCompareData = versionDetail => ({
  instructions: versionDetail?.version_details?.instructions ?? '',
  run_settings: versionDetail?.version_details?.run_settings ?? null,
});

const describeRunModel = llmSettings => {
  if (llmSettings?.selection?.mode === 'auto') return 'Auto';
  return llmSettings?.model_name || 'Project default';
};

const describeSetting = value => (value === null || value === undefined ? 'Default' : String(value));

const describeProjectContext = ignoreProjectContext => (ignoreProjectContext ? 'Excluded' : 'Included');

export const buildRunSettingsRows = runSettings => {
  const llmSettings = runSettings?.llm_settings;
  return [
    { key: 'model', label: 'Model', value: describeRunModel(llmSettings) },
    { key: 'temperature', label: 'Temperature', value: describeSetting(llmSettings?.temperature) },
    {
      key: 'reasoning_effort',
      label: 'Reasoning effort',
      value: describeSetting(llmSettings?.reasoning_effort),
    },
    { key: 'max_tokens', label: 'Max tokens', value: describeSetting(llmSettings?.max_tokens) },
    {
      key: 'project_context',
      label: 'Project context',
      value: describeProjectContext(runSettings?.ignore_project_context),
    },
  ];
};

export const buildPipelineRunSettingsRows = runSettings => [
  {
    key: 'step_limit',
    label: 'Step limit',
    value: runSettings?.step_limit === '' ? 'Default' : describeSetting(runSettings?.step_limit),
  },
  {
    key: 'project_context',
    label: 'Project context',
    value: describeProjectContext(runSettings?.ignore_project_context),
  },
];

/** Keys of the rows whose value differs between the two sides (rows are in the same order). */
export const getChangedRowKeys = (leftRows, rightRows) =>
  new Set(leftRows.filter((row, index) => row.value !== rightRows[index]?.value).map(row => row.key));

export const matchDependencies = (leftTools, rightTools) => {
  const key = d => `${d.entityType}:${d.id}`;
  const allKeys = [...new Set([...leftTools.map(key), ...rightTools.map(key)])];
  return allKeys.map(k => ({
    key: k,
    left: leftTools.find(d => key(d) === k) ?? null,
    right: rightTools.find(d => key(d) === k) ?? null,
  }));
};

export const buildCompareVersionOption = version => {
  const base = buildVersionOption({ enableVersionListAvatar: true })(version);
  const description = formatVersionMeta(version);
  return { ...base, description: description ?? '' };
};
