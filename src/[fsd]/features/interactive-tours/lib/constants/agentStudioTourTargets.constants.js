import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const AGENT_STUDIO_TOUR_TARGET_IDS = {
  workspace: 'agents-studio-workspace',
  searchAndCategoryFilters: 'agents-studio-search-and-category-filters',
  agentCard: 'agents-studio-agent-card',
  likeButton: 'agents-studio-like-button',
  startConversationButton: 'agents-studio-start-conversation-button',
};

const AGENT_STUDIO_WORKSPACE_SELECTOR = buildTourSelector(AGENT_STUDIO_TOUR_TARGET_IDS.workspace);

export const AGENT_STUDIO_TOUR_TARGETS = {
  workspace: AGENT_STUDIO_WORKSPACE_SELECTOR,
  searchAndCategoryFilters: `${AGENT_STUDIO_WORKSPACE_SELECTOR} [data-category-filter-controls]`,
  agentCard: buildTourSelector(AGENT_STUDIO_TOUR_TARGET_IDS.agentCard),
  likeButton: buildTourSelector(AGENT_STUDIO_TOUR_TARGET_IDS.likeButton),
  startConversationButton: buildTourSelector(AGENT_STUDIO_TOUR_TARGET_IDS.startConversationButton),
};
