import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { SearchParams, SkillsTabs } from '@/common/constants';
import RouteDefinitions from '@/routes';

import { hasValue, pickEntityRoutePattern } from './analyticsCommon.helpers.js';

const { SKILL_SOURCE_LABELS, ENTITY_DETAIL_TAB } = AnalyticsCommonConstants;

export const skillSourceLabel = source => SKILL_SOURCE_LABELS[source] || source || 'Unknown';

export const skillDisplayName = skill => (skill.deleted ? `${skill.skill_name} (deleted)` : skill.skill_name);

const isCatalogSkill = (skill, projectId) => String(skill.skill_project_id) !== String(projectId);

export const skillRunAnalyticsPath = (skill, run, projectId) => {
  if (!skill || skill.deleted || !hasValue(run?.conversation_id)) return null;

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
  hasValue(agent.entity_project_id) && String(agent.entity_project_id) !== String(projectId);

export const skillAgentPath = (agent, projectId) => {
  if (!agent || agent.deleted || !hasValue(agent.entity_id) || isOtherProjectAgent(agent, projectId))
    return null;

  const pattern = pickEntityRoutePattern(agent.kind, {
    agentRoute: RouteDefinitions.ApplicationsDetail,
    pipelineRoute: RouteDefinitions.PipelineDetail,
  });
  return NavigationHelpers.buildRoute(pattern, { tab: ENTITY_DETAIL_TAB, agentId: agent.entity_id });
};
