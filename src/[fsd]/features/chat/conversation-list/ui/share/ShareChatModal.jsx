import { memo, useCallback, useState } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { useCopyChatLink, useShareChat } from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { useDebounceValue, useToast } from '@/[fsd]/shared/lib/hooks';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import LinkIconSvg from '@/assets/copy-link-icon.svg?react';

import { SHARE_MESSAGES } from '../../lib/constants/shareChat.constants';
import { getCopyLinkMessage, isSameAccessList } from '../../lib/helpers/shareChat.helpers';
import ShareTeamTab from './ShareTeamTab';

const SEARCH_DEBOUNCE_MS = 300;

const ShareChatModal = memo(props => {
  const { conversation, onClose, onAccessSaved } = props;

  const { toastSuccess, toastError } = useToast();
  const copyChatLink = useCopyChatLink();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounceValue(query, SEARCH_DEBOUNCE_MS);
  const share = useShareChat({ conversation, query: debouncedQuery.trim() });
  const { savedAccess, membersTotal } = share;

  const [access, setAccess] = useState(savedAccess);
  const [isSaving, setIsSaving] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  // The list is filled once the details fetched after opening arrive; later refetches keep the edits
  const [isAccessLoaded, setIsAccessLoaded] = useState(false);
  if (share.isReady && !isAccessLoaded) {
    setIsAccessLoaded(true);
    setAccess(savedAccess);
  }

  const isTeamDirty = isAccessLoaded && !isSameAccessList(access, savedAccess);

  const handleClose = useCallback(() => {
    if (isSaving) return;
    if (isTeamDirty) setIsWarningOpen(true);
    else onClose?.();
  }, [isSaving, isTeamDirty, onClose]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const { failed, ...changes } = await share.saveAccess(access);
    onAccessSaved?.(conversation.id, changes);
    if (failed) toastError(SHARE_MESSAGES.accessFailed);
    else toastSuccess(SHARE_MESSAGES.accessUpdated);
    setIsSaving(false);
  }, [access, conversation?.id, onAccessSaved, share, toastError, toastSuccess]);

  const handleCopyChatLink = useCallback(
    () => copyChatLink(conversation, getCopyLinkMessage({ saved: savedAccess, isDirty: isTeamDirty })),
    [conversation, copyChatLink, isTeamDirty, savedAccess],
  );

  const handleStay = useCallback(() => setIsWarningOpen(false), []);
  const handleLeave = useCallback(() => {
    setIsWarningOpen(false);
    onClose?.();
  }, [onClose]);

  const styles = shareChatModalStyles();

  const title = (
    <Box sx={styles.titleBlock}>
      <Typography
        variant="headingSmall"
        color="text.secondary"
      >
        Share Chat
      </Typography>
      <Typography
        data-testid="share-chat-name"
        variant="bodySmall"
        color="text.primary"
        noWrap
        sx={styles.chatName}
      >
        {share.chatName}
      </Typography>
    </Box>
  );

  const content = (
    <Box sx={styles.content}>
      <Box sx={styles.body}>
        <ShareTeamTab
          owner={share.owner}
          list={access}
          members={share.members}
          membersTotal={membersTotal}
          query={query}
          membersFetched={share.membersFetched}
          membersQueryTotal={share.membersQueryTotal}
          isMembersFetching={share.isMembersFetching}
          onLoadMoreMembers={share.onLoadMoreMembers}
          onQueryChange={setQuery}
          onChangeList={setAccess}
        />
      </Box>
    </Box>
  );

  const left = (
    <Tooltip title="Copy link">
      <Button.BaseBtn
        data-testid="share-copy-link"
        aria-label="Copy link"
        variant={BUTTON_VARIANTS.secondary}
        size="small"
        startIcon={<LinkIconSvg />}
        onClick={handleCopyChatLink}
        sx={styles.copyButton}
      />
    </Tooltip>
  );
  const right = (
    <>
      <Button.BaseBtn
        data-testid="share-cancel"
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        disabled={isSaving}
        onClick={handleClose}
      >
        Cancel
      </Button.BaseBtn>
      <Button.BaseBtn
        data-testid="share-save"
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        loading={isSaving}
        disabled={!isTeamDirty || isSaving}
        onClick={handleSave}
      >
        Save
      </Button.BaseBtn>
    </>
  );

  const actions = (
    <Box sx={styles.footer}>
      <Box>{left}</Box>
      <Box sx={styles.footerRight}>{right}</Box>
    </Box>
  );

  return (
    <>
      <Modal.BaseModal
        open
        data-testid="share-modal"
        closeButtonTestId="share-close"
        title={title}
        content={content}
        actions={actions}
        onClose={handleClose}
        sx={styles.modal}
        dialogSx={styles.dialogContent}
      />
      <Modal.BaseModal
        open={isWarningOpen}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        title="Warning"
        content={
          <Typography variant="bodyMedium">{ModalConstants.WARNING_MESSAGES.UNSAVED_CHANGES}</Typography>
        }
        confirmButtonText={ModalConstants.WARNING_BUTTONS.LEAVE}
        onConfirm={handleLeave}
        onClose={handleStay}
      />
    </>
  );
});

ShareChatModal.displayName = 'ShareChatModal';

/** @type {MuiSx} */
const shareChatModalStyles = () => ({
  modal: {
    '& .MuiDialogTitle-root': {
      height: 'auto',
      minHeight: '3.75rem',
      padding: '1rem 1.5rem 0.875rem 2rem',
    },
    width: '37.5rem',
    maxWidth: 'calc(100vw - 2rem)',
    height: 'min(40rem, calc(100vh - 4rem))',
    '& .MuiDialogActions-root': { alignSelf: 'stretch' },
  },
  // BaseModal pads the body with !important; the inner body sets its own side padding
  dialogContent: {
    padding: '0 !important',
    overflowY: 'hidden',
    flex: 1,
    minHeight: 0,
    maxHeight: 'none',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    '& .MuiTypography-root, & .MuiAvatar-root, & .MuiFormControlLabel-label': { fontWeight: 500 },
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
  },
  chatName: {
    display: 'block',
    fontSize: '0.75rem',
    lineHeight: '1rem',
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    marginTop: '1rem',
    padding: '0 2rem 1.5rem',
  },
  footer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  copyButton: ({ palette }) => ({
    '& svg path': { fill: palette.icon.secondary },
  }),
});

export default ShareChatModal;
