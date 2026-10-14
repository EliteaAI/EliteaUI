import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { SearchParams, SkillsTabs } from '@/common/constants';
import RouteDefinitions from '@/routes';

import { triggerSourceLabel } from './analyticsCommon.helpers.js';

const MANUAL_TRIGGER = 'manual';
const ENTITY_KIND_PIPELINE = 'pipeline';
const ENTITY_DETAIL_TAB = 'all';

const { SKILL_SOURCE_LABELS, VERSION_UNKNOWN_LABEL } = AnalyticsCommonConstants;

const hasValue = value => value !== undefined && value !== null;

export const skillTriggerLabel = source =>
  source === MANUAL_TRIGGER ? 'Manual' : triggerSourceLabel(source);

export const skillSourceLabel = source => SKILL_SOURCE_LABELS[source] || source || 'Unknown';

export const skillVersionLabel = versionName => versionName || VERSION_UNKNOWN_LABEL;

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

  const pattern =
    agent.kind === ENTITY_KIND_PIPELINE
      ? RouteDefinitions.PipelineDetail
      : RouteDefinitions.ApplicationsDetail;
  return NavigationHelpers.buildRoute(pattern, { tab: ENTITY_DETAIL_TAB, agentId: agent.entity_id });
};
