import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const AGENT_TOUR_TARGET_IDS = {
  workspace: 'agent-workspace',
  instructions: 'agent-instructions',
  tools: 'agent-tools',
  conversationStarters: 'agent-conversation-starters',
  advancedSettings: 'agent-advanced-settings',
  welcomeMessage: 'agent-welcome-message',
  versions: 'agent-versions',
  publish: 'agent-publish',
  testChat: 'agent-test-chat',
};

export const AGENT_TOUR_TARGETS = {
  workspace: buildTourSelector(AGENT_TOUR_TARGET_IDS.workspace),
  instructions: buildTourSelector(AGENT_TOUR_TARGET_IDS.instructions),
  tools: buildTourSelector(AGENT_TOUR_TARGET_IDS.tools),
  conversationStarters: buildTourSelector(AGENT_TOUR_TARGET_IDS.conversationStarters),
  advancedSettings: buildTourSelector(AGENT_TOUR_TARGET_IDS.advancedSettings),
  welcomeMessage: buildTourSelector(AGENT_TOUR_TARGET_IDS.welcomeMessage),
  versions: buildTourSelector(AGENT_TOUR_TARGET_IDS.versions),
  publish: buildTourSelector(AGENT_TOUR_TARGET_IDS.publish),
  testChat: buildTourSelector(AGENT_TOUR_TARGET_IDS.testChat),
};
