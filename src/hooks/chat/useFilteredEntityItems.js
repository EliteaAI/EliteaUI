import { useMemo } from 'react';

import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import { getChatParticipantUniqueId } from '@/common/utils';

const transformEntityItemToParticipant = (entityItem, participantType) => {
  const entity_name =
    participantType === ChatParticipantType.Pipelines ? ChatParticipantType.Applications : participantType;

  return {
    entity_name,
    entity_meta: {
      id: entityItem.data?.id,
      project_id: entityItem.data?.project_id,
    },
    entity_settings: {
      agent_type: participantType === ChatParticipantType.Pipelines ? 'pipeline' : undefined,
    },
  };
};

const convertPublicEntityItem = item => ({
  ...item,
  isPublic: item.data?.project_id == PUBLIC_PROJECT_ID,
});

const sortEntityItemsByPublicStatus = (a, b) => {
  if (a.isPublic !== b.isPublic) {
    return a.isPublic ? 1 : -1;
  }
  return a.label.localeCompare(b.label);
};

const filterItemsBySearch = search => item =>
  item.label && item.label.toLowerCase().includes(search.toLowerCase());

export default function useFilteredEntityItems(entityItems, participants, participantType, search) {
  const existingEntityIds = useMemo(() => {
    switch (participantType) {
      case ChatParticipantType.Applications:
        return new Set(
          participants
            .filter(
              p =>
                p.entity_name === ChatParticipantType.Applications &&
                p?.entity_settings?.agent_type !== 'pipeline',
            )
            .map(p => getChatParticipantUniqueId(p))
            .filter(Boolean),
        );
      case ChatParticipantType.Pipelines:
        return new Set(
          participants
            .filter(
              p =>
                p.entity_name === ChatParticipantType.Applications &&
                p?.entity_settings?.agent_type === 'pipeline',
            )
            .map(p => getChatParticipantUniqueId(p))
            .filter(Boolean),
        );
      case ChatParticipantType.Toolkits:
        return new Set(
          participants
            .filter(p => p.entity_name === ChatParticipantType.Toolkits)
            .map(p => getChatParticipantUniqueId(p))
            .filter(Boolean),
        );
      default: //Pipelines
        return new Set();
    }
  }, [participantType, participants]);

  // Filter functions for each dropdown
  const filteredEntityItems = useMemo(() => {
    switch (participantType) {
      case ChatParticipantType.Applications:
        return entityItems
          .filter(agent => {
            const participantLike = transformEntityItemToParticipant(agent, participantType);
            return !existingEntityIds.has(getChatParticipantUniqueId(participantLike));
          })
          .map(convertPublicEntityItem)
          .filter(filterItemsBySearch(search))
          .sort(sortEntityItemsByPublicStatus);
      case ChatParticipantType.Pipelines:
        return entityItems
          .filter(pipeline => {
            const participantLike = transformEntityItemToParticipant(pipeline, participantType);
            return !existingEntityIds.has(getChatParticipantUniqueId(participantLike));
          })
          .map(convertPublicEntityItem)
          .filter(filterItemsBySearch(search))
          .sort(sortEntityItemsByPublicStatus);
      case ChatParticipantType.Toolkits:
        return entityItems
          .filter(toolkit => {
            const participantLike = transformEntityItemToParticipant(toolkit, participantType);
            return !existingEntityIds.has(getChatParticipantUniqueId(participantLike));
          })
          .filter(toolkit => {
            const searchLower = search.toLowerCase();
            const nameMatch = toolkit.label && toolkit.label.toLowerCase().includes(searchLower);
            const typeMatch = toolkit.data?.type && toolkit.data.type.toLowerCase().includes(searchLower);
            // Also search in the toolkit's title fields
            const titleMatch =
              toolkit.data?.settings?.elitea_title &&
              toolkit.data.settings.elitea_title.toLowerCase().includes(searchLower);
            const configTitleMatch =
              toolkit.data?.settings?.configuration_title &&
              toolkit.data.settings.configuration_title.toLowerCase().includes(searchLower);
            return nameMatch || typeMatch || titleMatch || configTitleMatch;
          })
          .sort((a, b) => a.label.localeCompare(b.label));
      default:
        return [];
    }
  }, [entityItems, existingEntityIds, participantType, search]);

  return filteredEntityItems;
}
