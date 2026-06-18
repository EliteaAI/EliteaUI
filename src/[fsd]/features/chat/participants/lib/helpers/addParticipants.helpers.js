import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_REASONING_EFFORT,
  DEFAULT_TEMPERATURE,
} from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';

import { getChatParticipantUniqueId } from './participants.helpers';

export const isParticipantOKForChat = participant =>
  participant.entity_name === ChatParticipantType.Users ||
  participant.entity_name === ChatParticipantType.Toolkits ||
  participant.entity_name === ChatParticipantType.Applications ||
  participant.entity_name === ChatParticipantType.Pipelines;

export const canParticipantBeActiveInChat = participant =>
  participant.entity_name === ChatParticipantType.Users ||
  participant.entity_name === ChatParticipantType.Applications ||
  participant.entity_name === ChatParticipantType.Pipelines;

export const transformParticipant = (participantType, participant, variables) => {
  if (participantType !== ChatParticipantType.Models)
    return {
      entity_name: participant.agent_type === 'pipeline' ? ChatParticipantType.Applications : participantType,
      entity_meta: {
        id: participant.id,
        name: participant.name,
        project_id: participant.project_id || undefined,
      },
      entity_settings: {
        variables:
          variables ||
          participant.entity_settings?.variables ||
          (participantType === ChatParticipantType.Applications
            ? participant.version_details?.variables
            : undefined) ||
          [],
        icon_meta:
          participantType !== ChatParticipantType.Toolkits
            ? {
                ...(participant.entity_settings?.icon_meta ||
                  participant.meta?.icon_meta ||
                  participant.icon_meta ||
                  {}),
              }
            : {},
        toolkit_type: participant.type,
        agent_type: participant.agent_type,
        // Preserve version_id if it exists
        ...(participant.entity_settings?.version_id && {
          version_id: participant.entity_settings.version_id,
        }),
        mcp_server_url: participant.settings?.url || participant.entity_settings?.mcp_server_url || undefined,
        // For newly created agents, preserve version_id from version_details if entity_settings doesn't have it
        ...(participantType === ChatParticipantType.Applications &&
          participant.version_details?.id &&
          !participant.entity_settings?.version_id && { version_id: participant.version_details.id }),
        // Include llm_settings override for published agents/pipelines from public project
        ...((participantType === ChatParticipantType.Applications ||
          participantType === ChatParticipantType.Pipelines) &&
          participant.entity_meta?.project_id === PUBLIC_PROJECT_ID &&
          (participant.entity_settings?.llm_settings || participant.version_details?.llm_settings) && {
            llm_settings:
              participant.entity_settings?.llm_settings || participant.version_details?.llm_settings,
          }),
      },
      meta: {
        mcp: participant.meta?.mcp || undefined,
      },
    };

  return {
    entity_name: ChatParticipantType.Models,
    entity_meta: {
      integration_uid: participant.integration_uid,
      model_name: participant.model_name,
    },
    entity_settings: {
      max_tokens: participant.max_tokens || DEFAULT_MAX_TOKENS,
      temperature: participant.temperature || DEFAULT_TEMPERATURE,
      reasoning_effort: participant.reasoning_effort || DEFAULT_REASONING_EFFORT,
    },
  };
};

// Use unique participant IDs that include project_id to distinguish between public and custom entities
export const isParticipantsEqual = (a, b, type, idFieldName) => {
  // For models, we still use the old logic since they don't have project conflicts
  if (type === ChatParticipantType.Models) {
    return (
      a.entity_name === b.entity_name &&
      a.entity_meta[idFieldName] === b.entity_meta[idFieldName] &&
      a.entity_meta.integration_uid === b.entity_meta.integration_uid
    );
  }

  // For all other types, use unique IDs to distinguish between public and custom entities
  return getChatParticipantUniqueId(a) === getChatParticipantUniqueId(b);
};
