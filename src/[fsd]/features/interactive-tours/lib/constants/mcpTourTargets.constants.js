import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const MCP_TOUR_TARGET_IDS = {
  connectionStatus: 'mcp-connection-status',
};

export const MCP_TOUR_TARGETS = {
  connectionStatus: buildTourSelector(MCP_TOUR_TARGET_IDS.connectionStatus),
};
