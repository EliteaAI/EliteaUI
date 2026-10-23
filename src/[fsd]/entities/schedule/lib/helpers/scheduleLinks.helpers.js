import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import RouteDefinitions from '@/routes';

// The schedule form opens nested in the editor of its agent or pipeline (owner CR 2026-10-21)
const ENTITY_ROUTES = {
  agent: {
    editor: RouteDefinitions.ApplicationsDetail,
    create: RouteDefinitions.ApplicationsCreateSchedule,
    detail: RouteDefinitions.ApplicationsScheduleDetail,
  },
  pipeline: {
    editor: RouteDefinitions.PipelineDetail,
    create: RouteDefinitions.PipelineCreateSchedule,
    detail: RouteDefinitions.PipelineScheduleDetail,
  },
};

const DEFAULT_TAB = 'all';

export const buildEntityEditorLink = ({ entityType, entityId, tab = DEFAULT_TAB }) =>
  NavigationHelpers.buildRoute(ENTITY_ROUTES[entityType].editor, { tab, agentId: entityId });

export const buildScheduleFormLink = ({ entityType, entityId, tab = DEFAULT_TAB, scheduleId }) => {
  const routes = ENTITY_ROUTES[entityType];

  return NavigationHelpers.buildRoute(scheduleId ? routes.detail : routes.create, {
    tab,
    agentId: entityId,
    scheduleId,
  });
};

export const buildSchedulesListLink = ({ entityType, entityId }) => {
  const query = new URLSearchParams({ entityType, entityId }).toString();
  return `${RouteDefinitions.Schedules}?${query}`;
};
