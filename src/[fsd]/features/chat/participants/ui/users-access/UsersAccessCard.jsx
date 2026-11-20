import { memo, useCallback, useRef, useState } from 'react';

import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { ShareChatModal } from '@/[fsd]/features/chat/conversation-list/ui/share';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ShareIcon from '@/assets/share-icon.svg?react';

import { useUsersAccessActions } from '../../lib/hooks';
import ParticipantsAccordion from '../expanded-participants/ParticipantsAccordion';
import UsersAccessSummary from './UsersAccessSummary';
import UsersMentionDropdown from './UsersMentionDropdown';

const UsersAccessCard = memo(props => {
  const { conversation, onSelectParticipant, onAccessSaved } = props;

  const cardRef = useRef(null);
  const [isMentionOpen, setIsMentionOpen] = useState(false);

  const handleCloseMention = useCallback(() => setIsMentionOpen(false), []);
  const { access, userId, isShareOpen, handleShare, handleMention, handleCloseShare } = useUsersAccessActions(
    {
      conversation,
      onSelectParticipant,
      onBeforeAction: handleCloseMention,
    },
  );

  const styles = usersAccessCardStyles();

  const handleOpenMention = useCallback(() => setIsMentionOpen(true), []);

  return (
    <ParticipantsAccordion title="Users">
      <Box
        ref={cardRef}
        sx={styles.card}
        data-testid="chat-users-access-card"
      >
        <UsersAccessSummary
          kind={access.kind}
          label={access.label}
          linksCount={access.linksCount}
          expiredLinksCount={access.expiredLinksCount}
          onLabelClick={handleOpenMention}
        />
        <Tooltip
          title="Share"
          placement="top"
        >
          <Box
            className="users-access-share"
            sx={styles.shareSlot}
          >
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              aria-label="Share"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              data-testid="chat-users-access-share"
            />
          </Box>
        </Tooltip>
      </Box>
      <UsersMentionDropdown
        open={isMentionOpen}
        anchorEl={cardRef.current}
        users={access.users}
        search={access.search}
        total={access.count}
        currentUserId={userId}
        ownerId={access.ownerId}
        onMention={handleMention}
        onClose={handleCloseMention}
      />
      {isShareOpen && (
        <ShareChatModal
          conversation={conversation}
          onClose={handleCloseShare}
          onAccessSaved={onAccessSaved}
        />
      )}
    </ParticipantsAccordion>
  );
});

UsersAccessCard.displayName = 'UsersAccessCard';

/** @type {MuiSx} */
const usersAccessCardStyles = () => ({
  card: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '2.5rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    '&:hover': { backgroundColor: palette.background.interactiveItem.hover },
    // Collapsed at rest, not removed, so a long label is not cut and Tab still reaches Share in Only You
    '&:hover .users-access-share, &:focus-within .users-access-share': {
      width: 'auto',
      marginLeft: '0.75rem',
      overflow: 'visible',
    },
  }),
  shareSlot: ({ palette }) => ({
    display: 'flex',
    flexShrink: 0,
    width: 0,
    overflow: 'hidden',
    '& svg': { width: '1rem', height: '1rem' },
    '& svg path': { fill: palette.icon.default },
  }),
});

export default UsersAccessCard;
