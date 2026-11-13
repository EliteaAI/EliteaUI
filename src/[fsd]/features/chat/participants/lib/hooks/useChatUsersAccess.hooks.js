import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useListShareLinksQuery } from '@/[fsd]/features/chat/conversation-list/api/sharedLinksApi';
import { countShareLinks } from '@/[fsd]/features/chat/conversation-list/lib/helpers/shareChat.helpers';
import { useUserList } from '@/[fsd]/shared/lib/hooks';
import { ChatParticipantType } from '@/common/constants';

import { USERS_ACCESS_KIND } from '../constants/usersAccess.constants';

// The page size of the Share window, so both read one cached list
const MEMBERS_PAGE_SIZE = 20;
const NO_LINKS = [];

export const useChatUsersAccess = ({ conversation, projectId }) => {
  const userId = useSelector(state => state.user?.id);
  const conversationId = conversation?.id;
  const isPublic = conversation?.is_private === false;
  const isOwner = !!conversationId && userId == conversation?.author_id;

  const { data: membersData } = useUserList({
    sortBy: 'name',
    sortOrder: 'asc',
    query: '',
    pageSize: MEMBERS_PAGE_SIZE,
    forceSkip: !conversationId || !isPublic,
  });
  // The server lists only the links the current user created, so only the owner asks
  const { data: links = NO_LINKS } = useListShareLinksQuery(
    { projectId, conversationId },
    { skip: !conversationId || !projectId || !isOwner },
  );

  const users = useMemo(
    () => (conversation?.participants || []).filter(item => item.entity_name === ChatParticipantType.Users),
    [conversation?.participants],
  );

  return useMemo(() => {
    let kind = USERS_ACCESS_KIND.onlyYou;
    if (isPublic) kind = USERS_ACCESS_KIND.team;
    else if (users.length > 1) kind = USERS_ACCESS_KIND.people;

    const labels = {
      [USERS_ACCESS_KIND.team]: `Whole Team (${membersData?.total ?? 0})`,
      [USERS_ACCESS_KIND.people]: `${users.length} users`,
      [USERS_ACCESS_KIND.onlyYou]: 'Only You',
    };
    // Counted as on the Externally tab: an expired link no longer opens the chat
    const { active, expired } = countShareLinks(links, Date.now());

    return {
      kind,
      label: labels[kind],
      isOwner,
      ownerId: conversation?.author_id,
      users,
      linksCount: active,
      expiredLinksCount: expired,
    };
  }, [conversation?.author_id, isOwner, isPublic, links, membersData?.total, users]);
};
