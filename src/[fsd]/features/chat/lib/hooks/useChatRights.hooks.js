import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

import { getChatRights, getShareAction, isExternalChatSharingEnabled } from '../helpers/chatRights.helpers';

export const useChatRights = conversation => {
  const projectId = useSelectedProjectId();
  const { id: userId, personal_project_id: personalProjectId } = useSelector(state => state.user);
  const { checkPermission } = useCheckPermission();
  const canManageShared = checkPermission(PERMISSIONS.chat.manageShared);

  return useMemo(() => {
    const rights = getChatRights({
      conversation,
      userId,
      canManageShared,
      isExternalSharingEnabled: isExternalChatSharingEnabled(),
    });
    return { ...rights, shareAction: getShareAction({ rights, projectId, personalProjectId }) };
  }, [canManageShared, conversation, personalProjectId, projectId, userId]);
};
