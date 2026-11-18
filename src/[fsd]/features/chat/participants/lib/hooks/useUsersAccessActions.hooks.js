import { useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { SHARE_MESSAGES } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import { useCopyChatLink } from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

import { useChatUsersAccess } from './useChatUsersAccess.hooks';

export const useUsersAccessActions = ({ conversation, onSelectParticipant, onBeforeAction }) => {
  const projectId = useSelectedProjectId();
  const userId = useSelector(state => state.user?.id);
  const access = useChatUsersAccess({ conversation, projectId });
  const copyChatLink = useCopyChatLink();

  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleCloseShare = useCallback(() => setIsShareOpen(false), []);

  // The rule of Share in the chat menu: only the owner changes access, and the Public project has none to change
  const handleShare = useCallback(() => {
    onBeforeAction?.();
    if (access.isOwner && projectId != PUBLIC_PROJECT_ID) setIsShareOpen(true);
    else copyChatLink(conversation, SHARE_MESSAGES.saved);
  }, [access.isOwner, conversation, copyChatLink, onBeforeAction, projectId]);

  const handleMention = useCallback(
    participant => {
      onBeforeAction?.();
      onSelectParticipant?.(participant);
    },
    [onBeforeAction, onSelectParticipant],
  );

  return { access, userId, isShareOpen, handleShare, handleMention, handleCloseShare };
};
