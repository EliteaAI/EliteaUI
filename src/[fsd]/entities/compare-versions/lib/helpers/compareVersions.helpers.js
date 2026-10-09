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

export const extractSkillCompareData = versionDetail => ({
  instructions: versionDetail?.version_details?.instructions ?? '',
  run_settings: versionDetail?.version_details?.run_settings ?? null,
});

const describeRunModel = llmSettings => {
  if (llmSettings?.selection?.mode === 'auto') return 'Auto';
  return llmSettings?.model_name || 'Project default';
};

const describeSetting = value => (value === null || value === undefined ? 'Default' : String(value));

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
      value: runSettings?.ignore_project_context ? 'Excluded' : 'Included',
    },
  ];
};

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
