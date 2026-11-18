import { memo } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { Button } from '@/[fsd]/shared/ui';
import { useNewChat } from '@/[fsd]/widgets/sidebar-root/lib/hooks';
import PlusIcon from '@/assets/plus-icon.svg?react';

const NEW_CHAT_LABEL = 'New chat';

const NewChatButton = memo(() => {
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const { createNewChat, isDisabled } = useNewChat();

  const styles = newChatButtonStyles(sideBarCollapsed);

  return (
    <StyledTooltip
      placement="right"
      title={sideBarCollapsed ? NEW_CHAT_LABEL : ''}
      enterDelay={500}
      enterNextDelay={500}
    >
      <Box
        component="span"
        data-tour={SIDEBAR_TOUR_TARGET_IDS.newChat}
        sx={styles.wrapper}
      >
        <Button.BaseBtn
          variant="special"
          startIcon={<PlusIcon />}
          disabled={isDisabled}
          onClick={createNewChat}
          aria-label={NEW_CHAT_LABEL}
          sx={styles.button}
          data-testid="sidebar-new-chat-button"
        >
          {sideBarCollapsed ? null : NEW_CHAT_LABEL}
        </Button.BaseBtn>
      </Box>
    </StyledTooltip>
  );
});

NewChatButton.displayName = 'NewChatButton';

/** @type {MuiSx} */
const newChatButtonStyles = sideBarCollapsed => ({
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    width: '100%',
    ...(sideBarCollapsed && {
      width: '1.75rem !important',
      minWidth: '1.75rem !important',
    }),
  },
});

export default NewChatButton;
