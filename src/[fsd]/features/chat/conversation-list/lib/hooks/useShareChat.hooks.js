import { useCallback, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import {
  useAddParticipantIntoConversationMutation,
  useConversationDetailsQuery,
  useConversationEditMutation,
  useConversationExportSummaryQuery,
  useDeleteParticipantFromConversationMutation,
} from '@/[fsd]/features/chat/api';
import {
  useCreateShareLinkMutation,
  useListShareLinksQuery,
  useRevokeShareLinkMutation,
} from '@/[fsd]/features/chat/conversation-list/api/sharedLinksApi';
import { SHARE_MODES } from '@/[fsd]/features/chat/conversation-list/lib/constants/shareChat.constants';
import {
  buildNewParticipants,
  diffUserParticipants,
} from '@/[fsd]/features/chat/conversation-list/lib/helpers/restrictAccess.helpers';
import {
  buildCreateLinkBody,
  buildSavedAccess,
  hasWholeTeam,
  toMemberItem,
} from '@/[fsd]/features/chat/conversation-list/lib/helpers/shareChat.helpers';
import { useSelectedProjectId, useUserList } from '@/[fsd]/shared/lib/hooks';
import { ChatParticipantType } from '@/common/constants';

const MEMBERS_PAGE_SIZE = 20;
const NO_LINKS = [];

export const useShareChat = ({ conversation, query = '', isExternallyShown = false }) => {
  const projectId = useSelectedProjectId();
  const user = useSelector(state => state.user);
  const conversationId = conversation?.id;
  const isPersonal = projectId == user?.personal_project_id;

  // A cached entry can predate the last access change, so Save waits for one fetched after opening
  const openedAt = useRef(Date.now());
  const { data: details, fulfilledTimeStamp } = useConversationDetailsQuery(
    { projectId, id: conversationId },
    { skip: !conversationId, refetchOnMountOrArgChange: true },
  );
  const isDetailsFresh = !!details && (fulfilledTimeStamp ?? 0) >= openedAt.current;

  const {
    data: membersData,
    onLoadMoreUsers,
    isUsersFetching,
  } = useUserList({
    sortBy: 'name',
    sortOrder: 'asc',
    query,
    pageSize: MEMBERS_PAGE_SIZE,
    forceSkip: isPersonal,
  });
  // The whole-team count must not shrink while the search filters the list
  const [membersTotal, setMembersTotal] = useState(0);
  if (!query && membersData?.total != null && membersData.total !== membersTotal) {
    setMembersTotal(membersData.total);
  }

  const {
    data: links = NO_LINKS,
    isFetching: isLinksFetching,
    isSuccess: isLinksLoaded,
    isError: isLinksError,
    refetch: refetchLinks,
  } = useListShareLinksQuery({ projectId, conversationId }, { skip: !conversationId });
  // Only the Externally content shows the file count
  const { data: summary, isSuccess: isFilesLoaded } = useConversationExportSummaryQuery(
    { projectId, conversationId },
    { skip: !conversationId || !(isPersonal || isExternallyShown) },
  );

  const [conversationEdit] = useConversationEditMutation();
  const [addParticipant] = useAddParticipantIntoConversationMutation();
  const [deleteParticipant] = useDeleteParticipantFromConversationMutation();
  const [createShareLink, { isLoading: isCreatingLink }] = useCreateShareLinkMutation();
  const [revokeShareLink] = useRevokeShareLinkMutation();

  const ownerId = details?.author_id ?? conversation?.author_id;
  const isPrivate = !!(details?.is_private ?? conversation?.is_private);
  const participants = useMemo(() => details?.participants ?? [], [details?.participants]);
  const userParticipants = useMemo(
    () => participants.filter(item => item.entity_name === ChatParticipantType.Users),
    [participants],
  );

  const owner = useMemo(() => {
    const participant = userParticipants.find(item => item.entity_meta?.id == ownerId);
    return {
      id: ownerId,
      name: participant?.meta?.user_name || (ownerId == user?.id ? user?.name : '') || '',
      avatar: participant?.meta?.user_avatar || '',
    };
  }, [ownerId, user?.id, user?.name, userParticipants]);

  const savedAccess = useMemo(
    () => (isDetailsFresh ? buildSavedAccess({ isPrivate, participants, ownerId }) : []),
    [isDetailsFresh, isPrivate, ownerId, participants],
  );

  const members = useMemo(
    () => (membersData?.rows ?? []).filter(item => item.id != ownerId).map(toMemberItem),
    [membersData?.rows, ownerId],
  );

  const authorNames = useMemo(
    () =>
      Object.fromEntries(participants.map(item => [item.id, item.meta?.user_name || item.meta?.name || ''])),
    [participants],
  );

  // Resolves with what the server confirmed even when a later call fails, so the chat list stays in step
  const saveAccess = useCallback(
    async list => {
      const changes = { isPrivate, deletedIds: [], addedParticipants: [], failed: false };
      try {
        if (hasWholeTeam(list)) {
          if (isPrivate)
            await conversationEdit({ projectId, id: conversationId, is_private: false }).unwrap();
          changes.isPrivate = false;
          return changes;
        }
        const others = userParticipants.filter(item => item.entity_meta?.id != ownerId);
        const { usersToRemove, usersToAdd } = diffUserParticipants({
          existingUserParticipants: others,
          selectedUsers: list,
          initialUserEntityIds: new Set(others.map(item => item.entity_meta?.id).filter(Boolean)),
        });
        if (!isPrivate) await conversationEdit({ projectId, id: conversationId, is_private: true }).unwrap();
        changes.isPrivate = true;
        const toAdd = buildNewParticipants({ usersToAdd, aiToAdd: [], projectId });
        if (toAdd.length) {
          const result = await addParticipant({
            projectId,
            id: conversationId,
            participants: toAdd,
          }).unwrap();
          changes.addedParticipants = Array.isArray(result) ? result : [];
        }
        const results = await Promise.allSettled(
          usersToRemove.map(item => deleteParticipant({ projectId, conversationId, id: item.id }).unwrap()),
        );
        changes.deletedIds = usersToRemove
          .filter((_, index) => results[index].status === 'fulfilled')
          .map(item => item.id);
        changes.failed = results.some(item => item.status === 'rejected');
      } catch {
        changes.failed = true;
      }
      return changes;
    },
    [
      addParticipant,
      conversationEdit,
      conversationId,
      deleteParticipant,
      isPrivate,
      ownerId,
      projectId,
      userParticipants,
    ],
  );

  const createLink = useCallback(
    form => createShareLink({ projectId, conversationId, ...buildCreateLinkBody(form) }).unwrap(),
    [conversationId, createShareLink, projectId],
  );

  const revokeLink = useCallback(
    token => revokeShareLink({ projectId, token, conversationId }).unwrap(),
    [conversationId, projectId, revokeShareLink],
  );

  return {
    mode: isPersonal ? SHARE_MODES.personal : SHARE_MODES.owner,
    projectId,
    chatName: details?.name ?? conversation?.name,
    isReady: isDetailsFresh,
    owner,
    members,
    membersTotal,
    membersFetched: membersData?.rows?.length ?? 0,
    membersQueryTotal: membersData?.total ?? 0,
    isMembersFetching: isUsersFetching,
    onLoadMoreMembers: onLoadMoreUsers,
    savedAccess,
    links,
    isLinksFetching,
    isLinksLoaded,
    isLinksError,
    refetchLinks,
    isCreatingLink,
    filesTotal: summary?.attachments_count ?? 0,
    isFilesLoaded,
    authorNames,
    saveAccess,
    createLink,
    revokeLink,
  };
};
