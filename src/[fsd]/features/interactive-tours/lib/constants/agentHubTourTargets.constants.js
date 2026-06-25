import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const AGENT_HUB_TOUR_TARGET_IDS = {
  workspace: 'agent-hub-workspace',
  searchAndCategoryFilters: 'agent-hub-search-and-category-filters',
  agentCard: 'agent-hub-agent-card',
  likeButton: 'agent-hub-like-button',
  startConversationButton: 'agent-hub-start-conversation-button',
};

const AGENT_HUB_WORKSPACE_SELECTOR = buildTourSelector(AGENT_HUB_TOUR_TARGET_IDS.workspace);

export const AGENT_HUB_TOUR_TARGETS = {
  workspace: AGENT_HUB_WORKSPACE_SELECTOR,
  searchAndCategoryFilters: `${AGENT_HUB_WORKSPACE_SELECTOR} [data-category-filter-controls]`,
  agentCard: buildTourSelector(AGENT_HUB_TOUR_TARGET_IDS.agentCard),
  likeButton: buildTourSelector(AGENT_HUB_TOUR_TARGET_IDS.likeButton),
  startConversationButton: buildTourSelector(AGENT_HUB_TOUR_TARGET_IDS.startConversationButton),
};
