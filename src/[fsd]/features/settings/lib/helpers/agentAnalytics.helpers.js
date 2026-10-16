import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { SearchParams } from '@/common/constants';
import RouteDefinitions from '@/routes';

import { hasValue, pickEntityRoutePattern } from './analyticsCommon.helpers.js';

const NO_MODEL_VALUE = '—';

const { AGENT_MODEL_UNKNOWN_LABEL, ENTITY_DETAIL_TAB, ENTITY_KIND_LABELS } = AnalyticsCommonConstants;

export const formatAgentEntityLabel = kind => ENTITY_KIND_LABELS[kind] ?? ENTITY_KIND_LABELS.agent;

export const formatAgentModelLabel = model =>
  model?.display_name || model?.model_name || AGENT_MODEL_UNKNOWN_LABEL;

export const formatAgentRunModels = models =>
  models?.length ? models.map(formatAgentModelLabel).join(', ') : NO_MODEL_VALUE;

export const formatAgentUserLabel = row => row.user_email || `User ${row.user_id}`;

const isNavigableEntity = ({ kind, entityProjectId, projectId }) =>
  hasValue(kind) && String(entityProjectId) === String(projectId);

export const buildAgentRunAnalyticsPath = (entity, run) => {
  if (!isNavigableEntity(entity) || !hasValue(run?.run_id)) return null;

  const pattern = pickEntityRoutePattern(entity.kind, {
    agentRoute: RouteDefinitions.ApplicationsRunAnalytics,
    pipelineRoute: RouteDefinitions.PipelineRunAnalytics,
  });
  const route = NavigationHelpers.buildRoute(pattern, { tab: ENTITY_DETAIL_TAB, agentId: entity.agentId });
  const params = new URLSearchParams({ [SearchParams.UsageRunId]: String(run.run_id) });
  if (hasValue(run.conversation_id)) params.set(SearchParams.HistoryRunId, String(run.conversation_id));

  return `${route}?${params.toString()}`;
};

export const buildAgentRunAnalyticsUrl = (entity, run) => {
  const path = buildAgentRunAnalyticsPath(entity, run);

  return path ? NavigationHelpers.buildAbsoluteAppUrl(entity.projectId, path) : '';
};
