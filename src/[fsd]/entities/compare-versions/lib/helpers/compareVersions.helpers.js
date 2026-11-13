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

/**
 * A public version and a fork never share a tool id: the public version links its sub-agents to copies that live in
 * the public project, and keeps its toolkits as definitions. So tools are matched by what the user sees: an agent or
 * a pipeline by its name, a toolkit by its type and name.
 */
export const buildPublicCompareKey = tool =>
  tool.type === 'application'
    ? `${tool.agent_type === 'pipeline' ? 'pipeline' : 'agent'}:${tool.name}`
    : `toolkit:${tool.type}:${tool.name}`;

/** A version of this agent, shaped to be compared with a public version. Skills are left out on both sides. */
export const extractAgentCompareDataForPublic = versionDetail => {
  const data = extractAgentCompareData({ ...versionDetail, skills: [] });
  return { ...data, tools: data.tools.map(tool => ({ ...tool, matchKey: buildPublicCompareKey(tool) })) };
};

const toPublicCompareTool = tool => ({
  name: tool.name,
  type: tool.type,
  description: tool.description,
  agent_type: tool.agent_type,
  entityType:
    tool.type === 'application' ? (tool.agent_type === 'pipeline' ? 'pipeline' : 'agent') : 'toolkit',
  // A sub-agent of a public version is a copy in the public project: no id of this project, so it cannot be opened
  settings: {},
  matchKey: buildPublicCompareKey(tool),
});

/**
 * A published version of a public agent. Publishing keeps its toolkits as definitions in `meta.fork_toolkits` (without
 * credentials), not in `tools`; only the sub-agents are in `tools`.
 */
export const extractPublicAgentCompareData = versionDetail => {
  const vd = versionDetail ?? {};
  const toolkits = Array.isArray(vd.meta?.fork_toolkits) ? vd.meta.fork_toolkits : [];
  return {
    instructions: vd.instructions ?? '',
    welcome_message: vd.welcome_message ?? '',
    conversation_starters: vd.conversation_starters ?? [],
    tools: [...(vd.tools ?? []), ...toolkits].map(toPublicCompareTool),
  };
};

const sameList = (left = [], right = []) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const sortedToolKeys = tools => (tools ?? []).map(tool => tool.matchKey).sort();

/** One sub-agent (an agent or pipeline attached as a tool) in the nested comparison. */
export const NESTED_STATUS = {
  same: 'same',
  changed: 'changed',
  onlyLeft: 'only-left',
  onlyRight: 'only-right',
};

export const getNestedAgentStatus = (left, right) => {
  if (!left) return NESTED_STATUS.onlyRight;
  if (!right) return NESTED_STATUS.onlyLeft;
  const same =
    left.instructions === right.instructions &&
    left.welcome_message === right.welcome_message &&
    sameList(left.conversation_starters, right.conversation_starters) &&
    sameList(sortedToolKeys(left.tools), sortedToolKeys(right.tools));
  return same ? NESTED_STATUS.same : NESTED_STATUS.changed;
};

/**
 * Pairs the sub-agents of both sides by their key, and their own sub-agents the same way. An entry looks like
 * `{ key, name, entityType, data, unavailable, children }`; `data` is what the compare steps read and is null when the
 * sub-agent could not be loaded. A row is "changed" when its own content differs or any sub-agent below it does.
 */
export const matchNestedAgents = (leftEntries = [], rightEntries = []) => {
  const keys = [...new Set([...leftEntries.map(e => e.key), ...rightEntries.map(e => e.key)])];
  return keys.map(key => {
    const left = leftEntries.find(e => e.key === key) ?? null;
    const right = rightEntries.find(e => e.key === key) ?? null;
    const children = matchNestedAgents(left?.children ?? [], right?.children ?? []);
    let ownStatus;
    if (!left) ownStatus = NESTED_STATUS.onlyRight;
    else if (!right) ownStatus = NESTED_STATUS.onlyLeft;
    // A sub-agent that could not be read cannot be shown as equal
    else if (left.unavailable || right.unavailable) ownStatus = NESTED_STATUS.changed;
    else ownStatus = getNestedAgentStatus(left.data, right.data);
    const status =
      ownStatus === NESTED_STATUS.same && children.some(child => child.status !== NESTED_STATUS.same)
        ? NESTED_STATUS.changed
        : ownStatus;
    return {
      key,
      name: left?.name ?? right?.name,
      entityType: left?.entityType ?? right?.entityType,
      left,
      right,
      children,
      // What this sub-agent itself differs in, and what it differs in together with everything below it
      ownStatus,
      status,
    };
  });
};

// Agents nest at most this deep (the platform's tier limit); a branch stops there
export const MAX_NESTED_DEPTH = 3;

/**
 * Loads the sub-agents of a version, and theirs in turn. `fetchChild(tool)` resolves to `{ data, tools }`: what the
 * compare steps read, and the raw tools to go on with. A sub-agent that cannot be read, or that links back to one
 * of its own parents, is kept as `unavailable` so it is never shown as equal.
 */
export const loadNestedAgents = async ({ tools, fetchChild, depth = 1, path = [] }) => {
  if (depth > MAX_NESTED_DEPTH) return [];
  const entries = await Promise.all(
    getNestedAgentTools(tools).map(async tool => {
      const entry = {
        key: buildPublicCompareKey(tool),
        name: tool.name,
        entityType: tool.agent_type === 'pipeline' ? 'pipeline' : 'agent',
        data: null,
        unavailable: true,
        children: [],
      };
      const link = `${tool.settings.application_id}:${tool.settings.application_version_id ?? ''}`;
      if (path.includes(link)) return entry;
      try {
        const { data, tools: childTools } = await fetchChild(tool);
        const children = await loadNestedAgents({
          tools: childTools,
          fetchChild,
          depth: depth + 1,
          path: [...path, link],
        });
        return { ...entry, data, unavailable: false, children };
      } catch {
        return entry;
      }
    }),
  );
  return entries;
};

/** How many sub-agents differ in themselves, counting every level (a parent is not counted for its children). */
export const countChangedNestedAgents = rows =>
  (rows ?? []).reduce(
    (total, row) =>
      total + (row.ownStatus === NESTED_STATUS.same ? 0 : 1) + countChangedNestedAgents(row.children),
    0,
  );

/** The tools of a version that are sub-agents or pipelines, with the ids needed to load them. */
export const getNestedAgentTools = tools =>
  (tools ?? []).filter(tool => tool.type === 'application' && tool.settings?.application_id);

/**
 * The public agent a fork came from: the newest version of the agent that records a parent in the public project.
 * The open version is looked at first, as the other versions of a fork usually carry the same parent.
 */
export const findPublicParentApplicationId = ({ versionMeta, versions = [], publicProjectId }) => {
  const parentOf = meta =>
    meta?.parent_entity_id && Number(meta?.parent_project_id) === Number(publicProjectId)
      ? Number(meta.parent_entity_id)
      : null;
  const fromOpenVersion = parentOf(versionMeta);
  if (fromOpenVersion) return fromOpenVersion;
  const newestFirst = [...versions].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  for (const version of newestFirst) {
    const parent = parentOf(version.meta);
    if (parent) return parent;
  }
  return null;
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
  const key = d => d.matchKey ?? `${d.entityType}:${d.id}`;
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
