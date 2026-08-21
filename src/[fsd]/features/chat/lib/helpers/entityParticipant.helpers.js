/**
 * Builds the participant object shape expected by editor open-handlers
 * from a raw agent_entity_created payload.
 */
export const buildEntityParticipant = ({ entity_id, entity_name, version_id, is_mcp, projectId }) => ({
  id: entity_id,
  name: entity_name,
  isMCP: !!is_mcp,
  meta: { name: entity_name, mcp: !!is_mcp },
  entity_meta: { id: entity_id, project_id: projectId },
  entity_settings: { version_id },
});
