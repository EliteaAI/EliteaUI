import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { SearchParams, ViewMode } from '@/common/constants';
import RouteDefinitions from '@/routes';

// A webhook is a schedule row of another trigger kind; cron stays the default everywhere
export const TRIGGER_KIND = { cron: 'cron', webhook: 'webhook' };

export const isWebhookRow = row => row?.trigger_kind === TRIGGER_KIND.webhook;

// "webhook" or "schedule", for the texts both kinds share
export const toKindNoun = kind => (kind === TRIGGER_KIND.webhook ? 'webhook' : 'schedule');

// The list page of each kind; its create and edit pages hang from it
const LIST_ROUTES = {
  [TRIGGER_KIND.cron]: RouteDefinitions.Schedules,
  [TRIGGER_KIND.webhook]: RouteDefinitions.Webhooks,
};

// An unknown or missing kind is a cron row: rows from before #7406 carry none
export const getListRoute = kind => LIST_ROUTES[kind] ?? LIST_ROUTES[TRIGGER_KIND.cron];

export const TOOLKIT_INDEX_TYPE = 'toolkit_index';

// The schedule form opens nested in the editor of its agent or pipeline, or in the page of its toolkit index
const ENTITY_ROUTES = {
  agent: {
    editor: RouteDefinitions.ApplicationsDetail,
    create: RouteDefinitions.ApplicationsCreateSchedule,
    detail: RouteDefinitions.ApplicationsScheduleDetail,
    webhookCreate: RouteDefinitions.ApplicationsCreateWebhook,
    webhookDetail: RouteDefinitions.ApplicationsWebhookDetail,
    history: RouteDefinitions.ApplicationsRunHistory,
  },
  pipeline: {
    editor: RouteDefinitions.PipelineDetail,
    create: RouteDefinitions.PipelineCreateSchedule,
    detail: RouteDefinitions.PipelineScheduleDetail,
    webhookCreate: RouteDefinitions.PipelineCreateWebhook,
    webhookDetail: RouteDefinitions.PipelineWebhookDetail,
    history: RouteDefinitions.PipelineRunHistory,
  },
  // A toolkit index has no webhooks: only cron schedules hang from its page
  [TOOLKIT_INDEX_TYPE]: {
    editor: RouteDefinitions.ToolkitIndex,
    create: RouteDefinitions.ToolkitIndexCreateSchedule,
    detail: RouteDefinitions.ToolkitIndexScheduleDetail,
    history: RouteDefinitions.ToolkitIndexHistory,
  },
};

// The route params of the entity: a toolkit index is named by its toolkit id and its index name
const toEntityParams = ({ entityType, entityId, indexName, tab = DEFAULT_TAB }) =>
  entityType === TOOLKIT_INDEX_TYPE ? { tab, toolkitId: entityId, indexName } : { tab, agentId: entityId };

const DEFAULT_TAB = 'all';

// The entity pages fall back to the public mode without the owner view mode, so every link into them adds it
export const buildOwnerViewModeParams = (params = {}) =>
  new URLSearchParams({ ...params, [SearchParams.ViewMode]: ViewMode.Owner });

export const buildEntityEditorLink = ({ entityType, entityId, indexName, tab = DEFAULT_TAB }) =>
  NavigationHelpers.buildRoute(ENTITY_ROUTES[entityType].editor, {
    ...toEntityParams({ entityType, entityId, indexName, tab }),
  });

export const buildScheduleFormLink = ({
  entityType,
  entityId,
  indexName,
  tab = DEFAULT_TAB,
  scheduleId,
  kind = TRIGGER_KIND.cron,
}) => {
  const routes = ENTITY_ROUTES[entityType];
  const webhook = kind === TRIGGER_KIND.webhook;
  const create = webhook ? routes.webhookCreate : routes.create;
  const detail = webhook ? routes.webhookDetail : routes.detail;

  return NavigationHelpers.buildRoute(scheduleId ? detail : create, {
    ...toEntityParams({ entityType, entityId, indexName, tab }),
    scheduleId,
  });
};

// Open run history: the edit form with its Runs section open. Without an entity, the Schedules page form.
// Inside an entity the owner view mode is needed, or the editor falls back to the public mode.
export const buildScheduleRunsLink = ({ entityType, entityId, indexName, tab, scheduleId, kind }) =>
  entityType
    ? {
        pathname: buildScheduleFormLink({ entityType, entityId, indexName, tab, scheduleId, kind }),
        search: `?${buildOwnerViewModeParams()}`,
        hash: '#runs',
      }
    : { pathname: `${getListRoute(kind)}/${scheduleId}`, hash: '#runs' };

export const buildSchedulesListLink = ({ entityType, entityId, indexName, kind }) => {
  const query = new URLSearchParams({
    entityType,
    entityId,
    ...(indexName ? { indexName } : {}),
  }).toString();
  return `${getListRoute(kind)}?${query}`;
};

// The agent or pipeline Run History filtered to one schedule. The owner view mode travels with it, because
// the breadcrumb copies the search and the entity page falls back to the public mode without it.
// A Test run of an unsaved form has no schedule id: the link then filters by the extra params instead.
export const buildScheduleHistoryLink = (schedule, extraParams = {}) => {
  const base = NavigationHelpers.buildRoute(
    ENTITY_ROUTES[schedule.entity_type].history,
    schedule.entity_type === TOOLKIT_INDEX_TYPE
      ? toEntityParams({
          entityType: TOOLKIT_INDEX_TYPE,
          entityId: schedule.toolkit_id,
          indexName: schedule.index_name,
        })
      : { tab: DEFAULT_TAB, agentId: schedule.application_id },
  );
  // The index Run History is not filtered by schedule
  if (schedule.entity_type === TOOLKIT_INDEX_TYPE) return base;
  const params = schedule.id == null ? extraParams : { schedule_id: schedule.id, ...extraParams };
  return `${base}?${buildOwnerViewModeParams(params).toString()}`;
};
