import { useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { useListShareLinksQuery } from '@/[fsd]/features/chat/conversation-list/api/sharedLinksApi';
import { countShareLinks } from '@/[fsd]/features/chat/conversation-list/lib/helpers/shareChat.helpers';
import { useDebounceValue, useUserList } from '@/[fsd]/shared/lib/hooks';
import { ChatParticipantType } from '@/common/constants';

import { USERS_ACCESS_KIND } from '../constants/usersAccess.constants';

// The page size of the Share window, so both read one cached list
const MEMBERS_PAGE_SIZE = 20;
const NO_LINKS = [];
const NO_ROWS = [];
// The debounce of the Share window search
const SEARCH_DEBOUNCE_MS = 300;

// A project member in the shape of a chat participant, so the list and the mention read one shape
const toMemberParticipant = member => ({
  id: `member-${member.id}`,
  entity_name: ChatParticipantType.Users,
  entity_meta: { id: member.id },
  meta: { user_name: member.name || member.email || '', user_avatar: member.avatar },
});

export const useChatUsersAccess = ({ conversation, projectId }) => {
  const userId = useSelector(state => state.user?.id);
  const conversationId = conversation?.id;
  const isPublic = conversation?.is_private === false;
  const isOwner = !!conversationId && userId == conversation?.author_id;

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounceValue(query, SEARCH_DEBOUNCE_MS).trim();
  const {
    data: membersData,
    onLoadMoreUsers,
    isUsersFetching,
  } = useUserList({
    sortBy: 'name',
    sortOrder: 'asc',
    query: debouncedQuery,
    pageSize: MEMBERS_PAGE_SIZE,
    forceSkip: !conversationId || !isPublic,
  });
  // The whole-team count must not shrink while the search filters the list
  const [membersTotal, setMembersTotal] = useState(0);
  if (!debouncedQuery && membersData?.total != null && membersData.total !== membersTotal) {
    setMembersTotal(membersData.total);
  }
  const onQueryChange = useCallback(value => setQuery(value ?? ''), []);
  // The server lists only the links the current user created, so only the owner asks
  const { data: links = NO_LINKS } = useListShareLinksQuery(
    { projectId, conversationId },
    { skip: !conversationId || !projectId || !isOwner },
  );

  const participants = useMemo(
    () => (conversation?.participants || []).filter(item => item.entity_name === ChatParticipantType.Users),
    [conversation?.participants],
  );
  const memberRows = membersData?.rows ?? NO_ROWS;
  // Whole Team: everyone in the project can open the chat, so the list is the project members; a member
  // who already joined keeps the participant entry
  const users = useMemo(() => {
    if (!isPublic) return participants;
    const byUserId = new Map(participants.map(item => [item.entity_meta?.id, item]));
    const members = memberRows.map(member => byUserId.get(member.id) ?? toMemberParticipant(member));
    // The list leads with the owner even when the owner's name is on a later page
    const owner = byUserId.get(conversation?.author_id);
    const hasOwner = members.some(item => item.entity_meta?.id == conversation?.author_id);
    return !debouncedQuery && owner && !hasOwner ? [owner, ...members] : members;
  }, [conversation?.author_id, debouncedQuery, isPublic, memberRows, participants]);

  return useMemo(() => {
    let kind = USERS_ACCESS_KIND.onlyYou;
    if (isPublic) kind = USERS_ACCESS_KIND.team;
    else if (participants.length > 1) kind = USERS_ACCESS_KIND.people;

    const count = kind === USERS_ACCESS_KIND.team ? membersTotal : participants.length;
    const labels = {
      [USERS_ACCESS_KIND.team]: `Whole Team (${count})`,
      [USERS_ACCESS_KIND.people]: `${count} users`,
      [USERS_ACCESS_KIND.onlyYou]: 'Only You',
    };
    // Counted as on the Externally tab: an expired link no longer opens the chat
    const { active, expired } = countShareLinks(links, Date.now());

    return {
      kind,
      label: labels[kind],
      count,
      isOwner,
      ownerId: conversation?.author_id,
      users,
      // Whole Team searches and pages on the server; a private chat filters its participants in place
      search: isPublic
        ? {
            query,
            onQueryChange,
            fetched: memberRows.length,
            queryTotal: membersData?.total ?? 0,
            isFetching: isUsersFetching,
            onLoadMore: onLoadMoreUsers,
          }
        : null,
      linksCount: active,
      expiredLinksCount: expired,
    };
  }, [
    conversation?.author_id,
    isOwner,
    isPublic,
    isUsersFetching,
    links,
    memberRows.length,
    membersData?.total,
    membersTotal,
    onLoadMoreUsers,
    onQueryChange,
    participants.length,
    query,
    users,
  ]);
};
