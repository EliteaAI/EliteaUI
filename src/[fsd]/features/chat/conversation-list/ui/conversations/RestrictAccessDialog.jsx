import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import {
  useAddParticipantIntoConversationMutation,
  useConversationDetailsQuery,
  useConversationEditMutation,
  useDeleteParticipantFromConversationMutation,
} from '@/[fsd]/features/chat/api';
import {
  buildNewParticipants,
  diffAiParticipants,
  diffUserParticipants,
  hasParticipantChanges,
  mapAiParticipantToSelectItem,
  mapUserParticipantToSelectItem,
} from '@/[fsd]/features/chat/conversation-list/lib/helpers';
import { Autocomplete, Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { ChatParticipantType } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { useUserList } from '@/hooks/useUserList';

const AI_PARTICIPANT_TYPES = [
  ChatParticipantType.Applications,
  ChatParticipantType.Pipelines,
  ChatParticipantType.Models,
];

const RestrictAccessDialog = memo(props => {
  const { conversation = {}, onClose, onSuccess } = props;

  const projectId = useSelectedProjectId();
  const { toastError } = useToast();

  const conversationId = conversation?.id;

  const { data: conversationDetails } = useConversationDetailsQuery(
    { projectId, id: conversationId },
    { skip: !conversationId },
  );

  const authorId = conversationDetails?.author_id ?? conversation?.author_id;
  const isAlreadyPrivate = !!(conversationDetails?.is_private ?? conversation?.is_private);
  const allParticipants = useMemo(
    () => conversationDetails?.participants ?? [],
    [conversationDetails?.participants],
  );
  const hasSharedLinks = !!(conversationDetails?.has_shared_links ?? conversation?.has_shared_links);

  const existingUserParticipants = useMemo(
    () => allParticipants.filter(p => p.entity_name === ChatParticipantType.Users),
    [allParticipants],
  );
  const existingAiParticipants = useMemo(
    () => allParticipants.filter(p => AI_PARTICIPANT_TYPES.includes(p.entity_name)),
    [allParticipants],
  );

  const initialSelectedUsers = useMemo(
    () => existingUserParticipants.map(mapUserParticipantToSelectItem),
    [existingUserParticipants],
  );

  const initialUserEntityIds = useMemo(
    () => new Set(existingUserParticipants.map(p => p.entity_meta?.id).filter(Boolean)),
    [existingUserParticipants],
  );

  const initialSelectedAiParticipants = useMemo(
    () => existingAiParticipants.map(mapAiParticipantToSelectItem),
    [existingAiParticipants],
  );

  const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);
  const [selectedAiParticipants, setSelectedAiParticipants] = useState(initialSelectedAiParticipants);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    onLoadMoreUsers,
    data: usersData,
    isUsersFetching,
  } = useUserList({ sortBy: 'name', sortOrder: 'asc', query: '', pageSize: 20 });

  const { rows: users = [], total: usersTotal = 0 } = usersData || {};

  const usersList = useMemo(() => users.map(u => ({ ...u, name: u.name || u.email || '' })), [users]);

  const [conversationEdit] = useConversationEditMutation();
  const [addParticipant] = useAddParticipantIntoConversationMutation();
  const [deleteParticipant] = useDeleteParticipantFromConversationMutation();

  useEffect(() => {
    if (!conversationDetails) return;
    setSelectedUsers(initialSelectedUsers);
    setSelectedAiParticipants(initialSelectedAiParticipants);
  }, [conversationDetails, initialSelectedUsers, initialSelectedAiParticipants]);

  const handleLoadMore = useCallback(() => {
    if (usersTotal > users.length && !isUsersFetching) onLoadMoreUsers();
  }, [usersTotal, users.length, isUsersFetching, onLoadMoreUsers]);

  const handleScroll = useCallback(
    event => {
      const el = event.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) handleLoadMore();
    },
    [handleLoadMore],
  );

  // Prevent the creator from being deselected
  const handleChangeUsers = useCallback(
    newSelected => {
      const creatorKept = newSelected.some(u => u.id === authorId);
      if (!creatorKept) {
        const creator = selectedUsers.find(u => u.id === authorId);
        if (creator) {
          setSelectedUsers([...newSelected, creator]);
          return;
        }
      }
      setSelectedUsers(newSelected);
    },
    [authorId, selectedUsers],
  );

  const isValid = selectedUsers.length + selectedAiParticipants.length >= 1;

  const hasChanges = useMemo(
    () =>
      hasParticipantChanges({
        isAlreadyPrivate,
        initialSelectedUsers,
        selectedUsers,
        initialSelectedAiParticipants,
        selectedAiParticipants,
      }),
    [
      isAlreadyPrivate,
      initialSelectedUsers,
      selectedUsers,
      initialSelectedAiParticipants,
      selectedAiParticipants,
    ],
  );

  const handleClose = useCallback(
    (_, reason) => {
      if (reason === 'backdropClick') return;
      onClose();
    },
    [onClose],
  );

  const handleConfirm = useCallback(async () => {
    if (!isValid || !hasChanges) return;
    setIsSubmitting(true);
    try {
      const { usersToRemove, usersToAdd } = diffUserParticipants({
        existingUserParticipants,
        selectedUsers,
        initialUserEntityIds,
      });
      const { aiToRemove, aiToAdd } = diffAiParticipants({ existingAiParticipants, selectedAiParticipants });

      const allToDelete = [...usersToRemove.map(p => p.id), ...aiToRemove.map(p => p.id)];

      if (allToDelete.length > 0) {
        await Promise.all(
          allToDelete.map(id => deleteParticipant({ projectId, conversationId, id }).unwrap()),
        );
      }

      const allToAdd = buildNewParticipants({ usersToAdd, aiToAdd, projectId });

      if (allToAdd.length > 0) {
        await addParticipant({ projectId, id: conversationId, participants: allToAdd }).unwrap();
      }

      if (!isAlreadyPrivate) {
        await conversationEdit({ projectId, id: conversationId, is_private: true }).unwrap();
      }

      onSuccess?.(conversationId);
      onClose();
    } catch {
      toastError('Failed to restrict access. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isValid,
    hasChanges,
    isAlreadyPrivate,
    selectedUsers,
    existingUserParticipants,
    initialUserEntityIds,
    selectedAiParticipants,
    existingAiParticipants,
    deleteParticipant,
    addParticipant,
    conversationEdit,
    projectId,
    conversationId,
    onClose,
    onSuccess,
    toastError,
  ]);

  const styles = restrictAccessDialogStyles();

  const conversationName = conversationDetails?.name ?? conversation?.name;

  const content = (
    <Box sx={styles.content}>
      {conversationName && (
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          {conversationName}
        </Typography>
      )}
      <Typography
        variant="bodySmall"
        sx={styles.description}
      >
        Restrict access to selected participants? Project members who are not selected will no longer be able
        to open this conversation. Existing selected participants will retain access.
      </Typography>

      {hasSharedLinks && (
        <Box sx={styles.warningBanner}>
          <Typography
            variant="bodySmall"
            sx={styles.warningText}
          >
            This conversation has been shared externally. Restricting access will not revoke existing external
            shares or copies.
          </Typography>
        </Box>
      )}

      <Box sx={styles.section}>
        <Autocomplete.ParticipantSearchSelect
          selectedParticipants={selectedAiParticipants}
          onChangeParticipants={setSelectedAiParticipants}
          projectId={projectId}
          label="AI participants"
          slotProps={{
            listBox: { style: { maxHeight: '12rem', overflowY: 'auto' } },
          }}
        />
      </Box>

      <Box sx={styles.section}>
        <Autocomplete.UserSearchSelect
          userList={usersList}
          selectedUsers={selectedUsers}
          onChangeUsers={handleChangeUsers}
          slotProps={{
            listBox: {
              onScroll: handleScroll,
              style: { maxHeight: '12rem', overflowY: 'auto' },
            },
          }}
          label="User participants"
        />
      </Box>

      {!isValid && (
        <Typography
          variant="bodySmall"
          sx={styles.validationError}
        >
          At least one participant must retain access.
        </Typography>
      )}
    </Box>
  );

  const actions = (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={onClose}
        disabled={isSubmitting}
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        loading={isSubmitting}
        onClick={handleConfirm}
        disabled={!isValid || !hasChanges || isSubmitting}
      >
        Restrict access
      </Button.BaseBtn>
    </>
  );

  return (
    <Modal.BaseModal
      open={!!conversationId}
      onClose={handleClose}
      title="Restrict access"
      content={content}
      actions={actions}
      sx={styles.modal}
    />
  );
});

RestrictAccessDialog.displayName = 'RestrictAccessDialog';

/** @type {MuiSx} */
const restrictAccessDialogStyles = () => ({
  modal: {
    width: '31.25rem',
    maxWidth: '31.25rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  description: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  warningBanner: ({ palette }) => ({
    padding: '0.75rem',
    borderRadius: '0.375rem',
    backgroundColor: palette.background.warning || 'rgba(255, 193, 7, 0.12)',
    border: `0.0625rem solid ${palette.warning.main}`,
  }),
  warningText: ({ palette }) => ({
    color: palette.warning.dark || palette.warning.main,
  }),
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  validationError: ({ palette }) => ({
    color: palette.error.main,
  }),
});

export default RestrictAccessDialog;
