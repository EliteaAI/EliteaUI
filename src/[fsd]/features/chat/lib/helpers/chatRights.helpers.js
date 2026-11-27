import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { getEnvVar } from '@/utils/env';

import { SHARE_ACTIONS } from '../constants/chatRights.constants';

// Features › Chat › Chat Sharing in the admin; a missing setting means enabled
export const isExternalChatSharingEnabled = () => getEnvVar('chat_sharing', {})?.external_enabled !== false;

// The owner may do everything; someone the chat is shared with manages it only with manage_shared (#7757)
export const getChatRights = ({ conversation, userId, canManageShared, isExternalSharingEnabled }) => {
  const authorId = conversation?.author_id;
  const isOwner = !!conversation?.isNew || authorId == null || authorId == userId;
  const canManage = isOwner || !!canManageShared;
  return {
    isOwner,
    canManage,
    canShareExternally: canManage && !!isExternalSharingEnabled,
    canDelete: isOwner,
    canMoveToFolder: isOwner,
  };
};

// The Public project has no team to share with; a private project has only external links
export const getShareAction = ({ rights, projectId, personalProjectId }) => {
  if (projectId == PUBLIC_PROJECT_ID) return SHARE_ACTIONS.copyLink;
  if (projectId == personalProjectId)
    return rights.canShareExternally ? SHARE_ACTIONS.window : SHARE_ACTIONS.none;
  return rights.canManage ? SHARE_ACTIONS.window : SHARE_ACTIONS.copyLink;
};
