import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import RouteDefinitions from '@/routes';

// The schedule form opens nested in the editor of its agent or pipeline
const ENTITY_ROUTES = {
  agent: {
    editor: RouteDefinitions.ApplicationsDetail,
    create: RouteDefinitions.ApplicationsCreateSchedule,
    detail: RouteDefinitions.ApplicationsScheduleDetail,
    history: RouteDefinitions.ApplicationsRunHistory,
  },
  pipeline: {
    editor: RouteDefinitions.PipelineDetail,
    create: RouteDefinitions.PipelineCreateSchedule,
    detail: RouteDefinitions.PipelineScheduleDetail,
    history: RouteDefinitions.PipelineRunHistory,
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

// Open run history: the edit form with its Runs section open. Without an entity, the Schedules page form.
export const buildScheduleRunsLink = ({ entityType, entityId, tab, scheduleId }) => ({
  pathname: entityType
    ? buildScheduleFormLink({ entityType, entityId, tab, scheduleId })
    : `${RouteDefinitions.Schedules}/${scheduleId}`,
  hash: '#runs',
});

export const buildSchedulesListLink = ({ entityType, entityId }) => {
  const query = new URLSearchParams({ entityType, entityId }).toString();
  return `${RouteDefinitions.Schedules}?${query}`;
};

// The agent or pipeline Run History filtered to one schedule
export const buildScheduleHistoryLink = schedule => {
  const base = NavigationHelpers.buildRoute(ENTITY_ROUTES[schedule.entity_type].history, {
    tab: DEFAULT_TAB,
    agentId: schedule.application_id,
  });
  const query = new URLSearchParams({ schedule_id: schedule.id }).toString();
  return `${base}?${query}`;
};
