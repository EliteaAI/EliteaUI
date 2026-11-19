import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { ChatHistory } from '@/[fsd]/features/chat/conversation-list/ui';
import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { useSidebarNavigation } from '@/[fsd]/widgets/sidebar-root/lib/hooks';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import RouteDefinitions from '@/routes';

const CHAT_BREADCRUMB = 'Chat';

const SidebarChatsArea = memo(() => {
  const { checkPermission } = useCheckPermission();
  const { navigateToPage } = useSidebarNavigation();

  // Away from the chat page a chat opens through the menu's guarded navigation
  const onOpenConversation = useCallback(
    conversation => {
      navigateToPage(`${RouteDefinitions.Chat}/${conversation.id}`, CHAT_BREADCRUMB)();
    },
    [navigateToPage],
  );

  const styles = sidebarChatsAreaStyles();

  const canSeeChats = checkPermission(PERMISSIONS.chat.folders.get);

  return (
    <Box
      component="section"
      aria-label="Chats"
      data-tour={SIDEBAR_TOUR_TARGET_IDS.chats}
      data-testid="sidebar-chats-area"
      sx={styles.root}
    >
      {canSeeChats && <ChatHistory onOpenConversation={onOpenConversation} />}
    </Box>
  );
});

SidebarChatsArea.displayName = 'SidebarChatsArea';

/** @type {MuiSx} */
const sidebarChatsAreaStyles = () => ({
  root: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '0.75rem',
    paddingInline: '1rem',
  },
});

export default SidebarChatsArea;
