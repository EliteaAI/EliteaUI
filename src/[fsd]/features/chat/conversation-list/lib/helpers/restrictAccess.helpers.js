import { ChatParticipantType } from '@/common/constants';

export const mapUserParticipantToSelectItem = p => ({
  id: p.entity_meta?.id,
  name: p.meta?.user_name || p.entity_meta?.name || `User ${p.entity_meta?.id}`,
  _participantRowId: p.id,
});

export const mapAiParticipantToSelectItem = p => ({
  id: p.entity_meta?.id,
  name: p.entity_meta?.name || p.meta?.name || '',
  project_id: p.entity_meta?.project_id,
  entity_name: p.entity_name,
  _participantRowId: p.id,
});

export const diffUserParticipants = ({ existingUserParticipants, selectedUsers, initialUserEntityIds }) => {
  const selectedUserIds = new Set(selectedUsers.map(u => u.id));
  const usersToRemove = existingUserParticipants.filter(
    p => p.entity_meta?.id != null && !selectedUserIds.has(p.entity_meta.id),
  );
  const usersToAdd = selectedUsers.filter(u => u.id != null && !initialUserEntityIds.has(u.id));
  return { usersToRemove, usersToAdd };
};

export const diffAiParticipants = ({ existingAiParticipants, selectedAiParticipants }) => {
  const selectedAiIds = new Set(selectedAiParticipants.map(p => p.id));
  const aiToRemove = existingAiParticipants.filter(
    p => p.entity_meta?.id != null && !selectedAiIds.has(p.entity_meta.id),
  );
  const existingAiEntityIds = new Set(existingAiParticipants.map(p => p.entity_meta?.id).filter(Boolean));
  const aiToAdd = selectedAiParticipants.filter(p => p.id != null && !existingAiEntityIds.has(p.id));
  return { aiToRemove, aiToAdd };
};

export const hasParticipantChanges = ({
  isAlreadyPrivate,
  initialSelectedUsers,
  selectedUsers,
  initialSelectedAiParticipants,
  selectedAiParticipants,
}) => {
  if (!isAlreadyPrivate) return true;
  const initialUserIds = new Set(initialSelectedUsers.map(u => u.id));
  const currentUserIds = new Set(selectedUsers.map(u => u.id));
  const usersChanged =
    currentUserIds.size !== initialUserIds.size || [...currentUserIds].some(id => !initialUserIds.has(id));
  const initialAiIds = new Set(initialSelectedAiParticipants.map(p => p.id).filter(Boolean));
  const currentAiIds = new Set(selectedAiParticipants.map(p => p.id).filter(Boolean));
  const aiChanged =
    currentAiIds.size !== initialAiIds.size || [...currentAiIds].some(id => !initialAiIds.has(id));
  return usersChanged || aiChanged;
};

export const buildNewParticipants = ({ usersToAdd, aiToAdd, projectId }) => {
  const newUserParticipants = usersToAdd.map(u => ({
    entity_name: ChatParticipantType.Users,
    entity_meta: { id: u.id },
  }));
  const newAiParticipants = aiToAdd.map(p => ({
    entity_name: ChatParticipantType.Applications,
    entity_meta: { id: p.id, project_id: p.project_id || projectId },
  }));
  return [...newUserParticipants, ...newAiParticipants];
};
