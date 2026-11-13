import { memo, useCallback, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { SHARE_MESSAGES } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import { useCopyChatLink } from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import { ShareChatModal } from '@/[fsd]/features/chat/conversation-list/ui/share';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ShareIcon from '@/assets/share-icon.svg?react';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

import { useChatUsersAccess } from '../../lib/hooks';
import ParticipantsAccordion from '../expanded-participants/ParticipantsAccordion';
import UsersAccessSummary from './UsersAccessSummary';
import UsersMentionDropdown from './UsersMentionDropdown';

const UsersAccessCard = memo(props => {
  const { conversation, onSelectParticipant, onAccessSaved } = props;

  const projectId = useSelectedProjectId();
  const userId = useSelector(state => state.user?.id);
  const access = useChatUsersAccess({ conversation, projectId });
  const copyChatLink = useCopyChatLink();

  const cardRef = useRef(null);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const styles = usersAccessCardStyles();

  const handleOpenMention = useCallback(() => setIsMentionOpen(true), []);
  const handleCloseMention = useCallback(() => setIsMentionOpen(false), []);
  const handleCloseShare = useCallback(() => setIsShareOpen(false), []);

  // The rule of Share in the chat menu: only the owner changes access, and the Public project has none to change
  const handleShare = useCallback(() => {
    if (access.isOwner && projectId != PUBLIC_PROJECT_ID) setIsShareOpen(true);
    else copyChatLink(conversation, SHARE_MESSAGES.saved);
  }, [access.isOwner, conversation, copyChatLink, projectId]);

  const handleMention = useCallback(
    participant => {
      setIsMentionOpen(false);
      onSelectParticipant?.(participant);
    },
    [onSelectParticipant],
  );

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
    gap: '0.75rem',
    width: '100%',
    height: '2.5rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    '&:hover': { backgroundColor: palette.background.interactiveItem.hover },
    // The button takes room only on hover, so a long label is not cut at rest
    '&:hover .users-access-share, &:focus-within .users-access-share': { display: 'flex' },
  }),
  shareSlot: ({ palette }) => ({
    display: 'none',
    '& svg': { width: '1rem', height: '1rem' },
    '& svg path': { fill: palette.icon.default },
  }),
});

export default UsersAccessCard;
