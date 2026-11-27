import { useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { SHARE_MESSAGES } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import { useCopyChatLink } from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import { ChatRightsConstants } from '@/[fsd]/features/chat/lib/constants';
import { useChatRights } from '@/[fsd]/features/chat/lib/hooks';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

import { useChatUsersAccess } from './useChatUsersAccess.hooks';

export const useUsersAccessActions = ({ conversation, onSelectParticipant, onBeforeAction }) => {
  const projectId = useSelectedProjectId();
  const userId = useSelector(state => state.user?.id);
  const access = useChatUsersAccess({ conversation, projectId });
  const copyChatLink = useCopyChatLink();
  const { shareAction } = useChatRights(conversation);
  const { SHARE_ACTIONS } = ChatRightsConstants;

  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleCloseShare = useCallback(() => setIsShareOpen(false), []);

  // The rule of Share in the chat menu: the owner and a manager change access, anyone else copies the link
  const handleShare = useCallback(() => {
    onBeforeAction?.();
    if (shareAction === SHARE_ACTIONS.window) setIsShareOpen(true);
    else copyChatLink(conversation, SHARE_MESSAGES.saved);
  }, [SHARE_ACTIONS.window, conversation, copyChatLink, onBeforeAction, shareAction]);

  const handleMention = useCallback(
    participant => {
      onBeforeAction?.();
      onSelectParticipant?.(participant);
    },
    [onBeforeAction, onSelectParticipant],
  );

  // A private project with external sharing turned off has nothing left to share (#7757)
  const canShare = shareAction !== SHARE_ACTIONS.none;

  return { access, userId, isShareOpen, canShare, handleShare, handleMention, handleCloseShare };
};
