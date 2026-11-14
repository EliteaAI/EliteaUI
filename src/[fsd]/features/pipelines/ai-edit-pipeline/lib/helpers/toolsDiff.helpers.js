/** Normalise a tool from formik's version_details.tools to the shape used for diff matching. */
export const normaliseCurrentTool = t => {
  if (t.type === 'application') {
    return {
      ...t,
      id: t.settings?.application_id ?? t.id,
      entityType: t.agent_type === 'pipeline' ? 'pipeline' : 'agent',
    };
  }
  return {
    ...t,
    entityType: t.entity_type ?? (t.type?.toLowerCase() === 'mcp' ? 'mcp' : 'toolkit'),
  };
};

export const normaliseCurrentTools = tools => (tools || []).map(normaliseCurrentTool);

/** Normalise all suggestion arrays from a draft response into the same diff shape. */
export const normaliseSuggestedTools = draftData => [
  ...(draftData?.suggested_toolkits || []).map(t => ({ ...t, entityType: 'toolkit' })),
  ...(draftData?.suggested_mcp || []).map(t => ({ ...t, entityType: 'mcp' })),
  ...(draftData?.suggested_agents || []).map(a => ({ ...a, entityType: 'agent' })),
  ...(draftData?.suggested_pipelines || []).map(p => ({ ...p, entityType: 'pipeline' })),
  ...(draftData?.suggested_skills || []).map(s => ({ ...s, entityType: 'skill' })),
];

export const toolKey = t => `${t.entityType}:${t.id}`;

export const getAddId = item => item.id;

export const getRemoveId = item => item.id;

const isSuggestionSelected = (item, selections) => {
  const { addToolkitIds, addMcpIds, addAgentIds, addPipelineIds, addSkillIds } = selections;
  if (item.entityType === 'agent') return addAgentIds?.has(item.id);
  if (item.entityType === 'pipeline') return addPipelineIds?.has(item.id);
  if (item.entityType === 'mcp') return addMcpIds?.has(item.id);
  if (item.entityType === 'skill') return addSkillIds?.has(item.id);
  return addToolkitIds?.has(item.id);
};

/** Tools the pipeline ends up with once the Tools & Skills selections are applied. */
export const computeSummaryTools = (currentTools, draftData, selections) => {
  const leftTools = normaliseCurrentTools(currentTools);
  const currentKeys = new Set(leftTools.map(toolKey));
  const removeIds = selections.removeToolRecordIds ?? new Set();

  const kept = leftTools.filter(t => !removeIds.has(getRemoveId(t)));
  const added = normaliseSuggestedTools(draftData).filter(
    t => !currentKeys.has(toolKey(t)) && isSuggestionSelected(t, selections),
  );

  return [...kept, ...added];
};

export const withoutAttachedSkills = (draftData, attachedSkillIds) => ({
  ...draftData,
  suggested_skills: (draftData?.suggested_skills || []).filter(
    skill => skill.project_id || !attachedSkillIds.has(skill.id),
  ),
});

/**
 * Compute the initial add-selection sets when a draft is first generated.
 * Pre-selects suggestions that are not already associated; removes are empty by default.
 */
export const computeInitialSelections = (draftData, currentTools) => {
  const tools = currentTools || [];

  const currentToolkitIds = new Set(
    tools.filter(t => t.type !== 'application' && t.type?.toLowerCase() !== 'mcp').map(t => t.id),
  );
  const currentMcpIds = new Set(tools.filter(t => t.type?.toLowerCase() === 'mcp').map(t => t.id));
  const currentAgentAppIds = new Set(
    tools
      .filter(t => t.type === 'application' && t.agent_type !== 'pipeline')
      .map(t => t.settings?.application_id)
      .filter(Boolean),
  );
  const currentPipelineAppIds = new Set(
    tools
      .filter(t => t.type === 'application' && t.agent_type === 'pipeline')
      .map(t => t.settings?.application_id)
      .filter(Boolean),
  );

  return {
    addToolkitIds: new Set(
      (draftData?.suggested_toolkits || []).filter(t => !currentToolkitIds.has(t.id)).map(t => t.id),
    ),
    addMcpIds: new Set((draftData?.suggested_mcp || []).filter(m => !currentMcpIds.has(m.id)).map(m => m.id)),
    addAgentIds: new Set(
      (draftData?.suggested_agents || []).filter(a => !currentAgentAppIds.has(a.id)).map(a => a.id),
    ),
    addPipelineIds: new Set(
      (draftData?.suggested_pipelines || []).filter(p => !currentPipelineAppIds.has(p.id)).map(p => p.id),
    ),
    addSkillIds: new Set((draftData?.suggested_skills || []).map(s => s.id)),
    removeToolRecordIds: new Set(),
  };
};
