import { TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';

// A ~name mention applies a skill without any tool call, so nothing reaches the
// execution trace. These helpers synthesize the same chip presentationally from
// meta.invoked_skills / agent_start data; the DB keeps only real calls.

const MENTION_SKILL_ID_PREFIX = 'mention-skill-';

const parseInputs = inputs => {
  if (typeof inputs !== 'string') return inputs;
  try {
    return JSON.parse(inputs);
  } catch {
    return null;
  }
};

const skillNameOfAction = action => {
  if (action?.toolMeta?.toolkit_name !== 'skills') return null;
  const inputs = parseInputs(action?.toolInputs);
  if (typeof inputs?.skill === 'string') return inputs.skill;
  return typeof action?.toolMeta?.loaded_skill === 'string' ? action.toolMeta.loaded_skill : null;
};

const hasSkillAction = (toolActions, name) => {
  const key = name.trim().toLowerCase();
  return (toolActions || []).some(action => (skillNameOfAction(action) || '').trim().toLowerCase() === key);
};

// Trace rows written before the loaded_skill stamp resolve to no name, so any
// meta entry might belong to one of them — synthesizing next to one duplicates it.
export const hasUnresolvedSkillAction = toolActions =>
  (toolActions || []).some(
    action => action?.toolMeta?.toolkit_name === 'skills' && skillNameOfAction(action) === null,
  );

const buildMentionSkillAction = (skill, createdAt) => ({
  name: 'load_skill',
  id: `${MENTION_SKILL_ID_PREFIX}${skill.name.trim().toLowerCase()}`,
  status: ToolActionStatus.complete,
  toolInputs: { skill: skill.name },
  // meta records identity, not provenance — never claim a ~mention here.
  toolOutputs: `Skill "${skill.name}" was applied to this turn.`,
  toolMeta: {
    toolkit_name: 'skills',
    toolkit_type: 'internal',
    display_name: 'Skills',
    icon_meta: skill.icon_meta,
    loaded_skill: skill.name,
  },
  created_at: createdAt,
  timestamp: createdAt,
  content: '',
  type: TOOL_ACTION_TYPES.Tool,
});

export const mentionSkillActions = (toolActions, skills, createdAt) =>
  (skills || [])
    .filter(skill => typeof skill?.name === 'string' && skill.name.trim())
    .filter(skill => !hasSkillAction(toolActions, skill.name))
    .map(skill => buildMentionSkillAction(skill, createdAt));

// A real load_skill call supersedes the synthesized chip for the same skill.
export const supersedeMentionSkillAction = (toolActions, rawInputs) => {
  const inputs = parseInputs(rawInputs);
  const name = typeof inputs?.skill === 'string' ? inputs.skill.trim().toLowerCase() : '';
  if (!name) return toolActions;
  return toolActions.filter(
    action => !(typeof action?.id === 'string' && action.id === `${MENTION_SKILL_ID_PREFIX}${name}`),
  );
};
