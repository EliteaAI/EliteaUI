import { ChatParticipantType } from '@/common/constants';

export const diffUserParticipants = ({ existingUserParticipants, selectedUsers, initialUserEntityIds }) => {
  const selectedUserIds = new Set(selectedUsers.map(u => u.id));
  const usersToRemove = existingUserParticipants.filter(
    p => p.entity_meta?.id != null && !selectedUserIds.has(p.entity_meta.id),
  );
  const usersToAdd = selectedUsers.filter(u => u.id != null && !initialUserEntityIds.has(u.id));
  return { usersToRemove, usersToAdd };
};

// Re-applies the confirmed restrict-access result on top of a participant list. A details refetch fired
// right after the wizard can resolve with a request that started before the deletes were committed
// (RTK Query reuses in-flight requests), so its participants cannot be trusted on their own.
export const applyParticipantChanges = (
  participants = [],
  { deletedIds = [], addedParticipants = [] } = {},
) => {
  const deletedSet = new Set(deletedIds);
  const kept = participants.filter(p => !deletedSet.has(p.id));
  const keptIds = new Set(kept.map(p => p.id));
  const missingAdded = addedParticipants.filter(p => p?.id != null && !keptIds.has(p.id));
  return [...kept, ...missingAdded];
};

export const buildNewParticipants = ({ usersToAdd, aiToAdd, projectId }) => {
  const newUserParticipants = usersToAdd.map(u => ({
    entity_name: ChatParticipantType.Users,
    entity_meta: { id: u.id },
  }));
  const newAiParticipants = aiToAdd.map(p => ({
    entity_name: p.entity_name ?? ChatParticipantType.Applications,
    entity_meta: { id: p.id, project_id: p.project_id || projectId },
  }));
  return [...newUserParticipants, ...newAiParticipants];
};
