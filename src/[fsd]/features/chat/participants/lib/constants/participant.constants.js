import { ChatParticipantType, PERMISSIONS } from '@/common/constants';

export const ParticipantEntityTypes = {
  Agent: 'agent',
  Application: 'application',
  Pipeline: 'pipeline',
  Toolkit: 'toolkit',
  MCP: 'mcp',
};

export const ParticipantCreationPermissionMap = {
  [ParticipantEntityTypes.Agent]: PERMISSIONS.applications.create,
  [ParticipantEntityTypes.Pipeline]: PERMISSIONS.applications.create,
  [ParticipantEntityTypes.Toolkit]: PERMISSIONS.toolkits.create,
  [ParticipantEntityTypes.MCP]: PERMISSIONS.toolkits.create,
};

export const ParticipantEditPermissionMap = {
  [ChatParticipantType.Applications]: PERMISSIONS.applications.update,
  [ChatParticipantType.Pipelines]: PERMISSIONS.applications.update,
  [ChatParticipantType.Toolkits]: PERMISSIONS.toolkits.update,
};

/**
 * Allowed tools for attachment participants
 * Restricts which tools are available when a toolkit is used as an attachment manager
 * This ensures security and controlled access to artifact operations
 */
export const ATTACHMENT_ALLOWED_TOOLS = [
  'index_data',
  'search_index',
  'stepback_search_index',
  'stepback_summary_index',
  'listFiles',
  'createFile',
  'readFile',
  'appendData',
  'overwriteData',
  'read_file_chunk',
  'read_multiple_files',
  'search_file',
  'edit_file',
];
