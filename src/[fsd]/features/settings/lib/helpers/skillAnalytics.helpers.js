import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { SearchParams, SkillsTabs } from '@/common/constants';
import RouteDefinitions from '@/routes';

import { triggerSourceLabel } from './analyticsCommon.helpers.js';

const MANUAL_TRIGGER = 'manual';
const ENTITY_KIND_PIPELINE = 'pipeline';
const ENTITY_DETAIL_TAB = 'all';

export const SKILL_SOURCE_LABELS = {
  load_skill: 'Loaded by the agent',
  mention: 'Mentioned in a message',
};

export const VERSION_UNKNOWN_LABEL = 'Version unknown';

export const skillTriggerLabel = source =>
  source === MANUAL_TRIGGER ? 'Manual' : triggerSourceLabel(source);

export const skillSourceLabel = source => SKILL_SOURCE_LABELS[source] || source || 'Unknown';

export const skillVersionLabel = versionName => versionName || VERSION_UNKNOWN_LABEL;

const isCatalogSkill = (skill, projectId) => String(skill.skill_project_id) !== String(projectId);

export const skillRunAnalyticsPath = (skill, run, projectId) => {
  if (!skill || skill.deleted || run?.conversation_id == null) return null;

  const route = isCatalogSkill(skill, projectId)
    ? NavigationHelpers.buildRoute(RouteDefinitions.CatalogSkillRunAnalytics, { skillId: skill.skill_id })
    : NavigationHelpers.buildRoute(RouteDefinitions.SkillsRunAnalytics, {
        tab: SkillsTabs[0],
        skillId: skill.skill_id,
      });
  const params = new URLSearchParams({ [SearchParams.HistoryRunId]: String(run.conversation_id) });
  return `${route}?${params.toString()}`;
};

const isOtherProjectAgent = (agent, projectId) =>
  agent.entity_project_id != null && String(agent.entity_project_id) !== String(projectId);

export const skillAgentPath = (agent, projectId) => {
  if (!agent || agent.deleted || agent.entity_id == null || isOtherProjectAgent(agent, projectId))
    return null;

  const pattern =
    agent.kind === ENTITY_KIND_PIPELINE
      ? RouteDefinitions.PipelineDetail
      : RouteDefinitions.ApplicationsDetail;
  return NavigationHelpers.buildRoute(pattern, { tab: ENTITY_DETAIL_TAB, agentId: agent.entity_id });
};
