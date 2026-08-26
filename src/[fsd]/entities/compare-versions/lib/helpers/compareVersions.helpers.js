import { buildVersionOption } from '@/[fsd]/entities/version';

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
});

export const matchDependencies = (leftTools, rightTools) => {
  const key = d => `${d.entityType}:${d.id}`;
  const allKeys = [...new Set([...leftTools.map(key), ...rightTools.map(key)])];
  return allKeys.map(k => ({
    key: k,
    left: leftTools.find(d => key(d) === k) ?? null,
    right: rightTools.find(d => key(d) === k) ?? null,
  }));
};

export const formatVersionMeta = version => {
  if (!version) return null;
  const parts = [];
  if (version.created_at) {
    const d = new Date(version.created_at);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    parts.push(`${month} ${day}, ${year}, ${hours}:${minutes}`);
  }
  if (version.author?.name) parts.push(`by ${version.author.name}`);
  return parts.length ? parts.join(' · ') : null;
};

export const buildCompareVersionOption = version => {
  const base = buildVersionOption({ enableVersionListAvatar: true })(version);
  const description = formatVersionMeta(version);
  return { ...base, description: description ?? '' };
};
