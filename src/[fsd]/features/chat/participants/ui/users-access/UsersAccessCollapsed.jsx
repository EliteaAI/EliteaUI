import { memo, useCallback, useRef, useState } from 'react';

import { Box, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { ShareChatModal } from '@/[fsd]/features/chat/conversation-list/ui/share';
import LockSimple from '@/components/Icons/LockSimple';
import UsersIcon from '@/components/Icons/UsersIcon';

import { USERS_ACCESS_KIND } from '../../lib/constants';
import { useUsersAccessActions } from '../../lib/hooks';
import UsersMentionDropdown from './UsersMentionDropdown';

const UsersAccessCollapsed = memo(props => {
  const { conversation, onSelectParticipant, onAccessSaved, buttonSx, iconSx } = props;

  const anchorRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCloseMenu = useCallback(() => setIsMenuOpen(false), []);
  const { access, userId, isShareOpen, handleShare, handleMention, handleCloseShare } = useUsersAccessActions(
    {
      conversation,
      onSelectParticipant,
      onBeforeAction: handleCloseMenu,
    },
  );

  const isOnlyYou = access.kind === USERS_ACCESS_KIND.onlyYou;
  const styles = usersAccessCollapsedStyles();

  const handleToggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);

  return (
    <Box
      sx={styles.root}
      data-testid="chat-participants-badge-users"
    >
      <Tooltip
        title={isMenuOpen ? '' : 'Users in this chat'}
        placement="left"
        disableInteractive
      >
        <Box sx={styles.anchor}>
          <IconButton
            ref={anchorRef}
            variant="elitea"
            color="secondary"
            onClick={handleToggleMenu}
            sx={buttonSx}
            aria-label="Users in this chat"
            aria-haspopup="true"
            aria-expanded={isMenuOpen ? 'true' : undefined}
            data-testid="chat-users-access-collapsed-button"
          >
            <UsersIcon sx={iconSx} />
          </IconButton>
          <Box
            sx={styles.badge}
            data-testid="chat-users-access-collapsed-badge"
          >
            {isOnlyYou ? <LockSimple sx={styles.lock} /> : access.count}
          </Box>
        </Box>
      </Tooltip>
      <UsersMentionDropdown
        open={isMenuOpen}
        anchorEl={anchorRef.current}
        placement="left-start"
        users={access.users}
        search={access.search}
        total={access.count}
        currentUserId={userId}
        ownerId={access.ownerId}
        access={access}
        showShare
        onMention={handleMention}
        onShare={handleShare}
        onClose={handleCloseMenu}
      />
      {isShareOpen && (
        <ShareChatModal
          conversation={conversation}
          onClose={handleCloseShare}
          onAccessSaved={onAccessSaved}
        />
      )}
    </Box>
  );
});

UsersAccessCollapsed.displayName = 'UsersAccessCollapsed';

// The badge copies the count badge of the other collapsed sections; it is an element, not ::after, to hold the lock
/** @type {MuiSx} */
const usersAccessCollapsedStyles = () => ({
  root: {
    width: '2.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  anchor: {
    position: 'relative',
    display: 'flex',
  },
  badge: ({ palette }) => ({
    position: 'absolute',
    top: '-0.5625rem',
    right: '-0.3125rem',
    minWidth: '1.25rem',
    height: '1.25rem',
    padding: '0 0.25rem',
    boxSizing: 'border-box',
    borderRadius: '0.625rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.components.participant.background.countBadge,
    color: palette.text.secondary,
    fontSize: '0.625rem',
    fontWeight: 600,
    lineHeight: 1,
    zIndex: 1,
    pointerEvents: 'none',
  }),
  lock: ({ palette }) => ({
    fontSize: '0.625rem',
    '& path': { fill: palette.icon.secondary },
  }),
});

export default UsersAccessCollapsed;
