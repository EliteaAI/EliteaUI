export const extractAgentCompareData = versionDetail => {
  // getApplicationVersionDetail returns a flat response — fields are at the top level
  const vd = versionDetail ?? {};
  return {
    instructions: vd.instructions ?? '',
    welcome_message: vd.welcome_message ?? '',
    conversation_starters: vd.conversation_starters ?? [],
    tools: (vd.tools ?? []).map(t => ({
      ...t,
      id: t.type === 'application' ? (t.settings?.application_id ?? t.id) : t.id,
      entityType:
        t.type === 'application'
          ? t.agent_type === 'pipeline'
            ? 'pipeline'
            : 'agent'
          : (t.entity_type ?? 'toolkit'),
    })),
    skills: (vd.skills ?? []).map(s => ({ ...s, id: s.skill_id, entityType: 'skill' })),
  };
};

export const extractSkillCompareData = versionDetail => ({
  // skillDetails returns a response with version_details nested
  instructions: versionDetail?.version_details?.instructions ?? '',
});

export const matchDependencies = (leftTools, leftSkills, rightTools, rightSkills) => {
  const allLeft = [...leftTools, ...leftSkills];
  const allRight = [...rightTools, ...rightSkills];

  const key = d => `${d.entityType}:${d.id}`;
  const allKeys = [...new Set([...allLeft.map(key), ...allRight.map(key)])];

  return allKeys.map(k => ({
    left: allLeft.find(d => key(d) === k) ?? null,
    right: allRight.find(d => key(d) === k) ?? null,
  }));
};
