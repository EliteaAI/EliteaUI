import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import BaseBtn, { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { getBasename } from '@/routes';

import { useListShareLinksQuery, useRevokeShareLinkMutation } from '../../api/sharedLinksApi';
import { SCOPE_LABELS } from '../../lib/constants';

const ManageLinksDialog = memo(props => {
  const { open, conversation = {}, onClose } = props;

  const projectId = useSelectedProjectId();
  const { toastInfo, toastError } = useToast();

  const conversationId = conversation?.id;

  const { data: shareLinks = [], isFetching: isLoadingLinks } = useListShareLinksQuery(
    { projectId, conversationId },
    { skip: !open || !conversationId },
  );

  const [revokeShareLink] = useRevokeShareLinkMutation();

  const styles = manageLinksDialogStyles();

  const handleRevoke = useCallback(
    async token => {
      try {
        await revokeShareLink({ projectId, token, conversationId }).unwrap();
        toastInfo('Share link revoked.');
      } catch {
        toastError('Failed to revoke link. Please try again.');
      }
    },
    [conversationId, projectId, revokeShareLink, toastError, toastInfo],
  );

  const buildLinkUrl = useCallback(token => {
    const basename = getBasename();
    return `${window.location.protocol}//${window.location.host}${basename}/shared/${token}`;
  }, []);

  const handleCopyLink = useCallback(
    async token => {
      await navigator.clipboard.writeText(buildLinkUrl(token));
      toastInfo('Link copied to clipboard.');
    },
    [buildLinkUrl, toastInfo],
  );

  const content = isLoadingLinks ? (
    <Box sx={styles.feedbackRow}>
      <Typography
        variant="bodySmall2"
        color="text.disabled"
      >
        Loading…
      </Typography>
    </Box>
  ) : shareLinks.length === 0 ? (
    <Box sx={styles.feedbackRow}>
      <Typography
        variant="bodySmall2"
        color="text.disabled"
      >
        No active share links for this conversation.
      </Typography>
    </Box>
  ) : (
    <Box sx={styles.linkList}>
      {shareLinks.map(link => (
        <Box
          key={link.token}
          sx={styles.linkRow}
        >
          <Box sx={styles.linkMeta}>
            <Typography
              variant="bodySmall2"
              color="text.secondary"
              noWrap
              sx={styles.linkUrl}
              title={buildLinkUrl(link.token)}
            >
              {buildLinkUrl(link.token)}
            </Typography>
            <Typography
              variant="bodySmall2"
              color="text.secondary"
            >
              {SCOPE_LABELS[link.scope] ?? 'Full conversation'}
              {link.expires_at
                ? ` · Expires ${new Date(link.expires_at).toLocaleDateString()}`
                : ' · Never expires'}
              {link.has_password ? ' · Password protected' : ''}
            </Typography>
            <Typography
              variant="bodySmall"
              color="text.disabled"
            >
              {`Accessed ${link.access_count} time${link.access_count !== 1 ? 's' : ''} · Created ${new Date(link.created_at).toLocaleDateString()}`}
            </Typography>
          </Box>
          <Box sx={styles.linkActions}>
            <BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              onClick={() => handleCopyLink(link.token)}
            >
              Copy
            </BaseBtn>
            <BaseBtn
              variant={BUTTON_VARIANTS.alarm}
              onClick={() => handleRevoke(link.token)}
            >
              Revoke
            </BaseBtn>
          </Box>
        </Box>
      ))}
    </Box>
  );

  const actions = (
    <BaseBtn
      variant={BUTTON_VARIANTS.elitea}
      color={BUTTON_COLORS.secondary}
      onClick={onClose}
    >
      Close
    </BaseBtn>
  );

  const title = (
    <Box sx={styles.titleContent}>
      <Typography variant="headingMedium">Manage Links</Typography>
      {conversation?.name && (
        <Typography
          variant="bodySmall"
          color="text.disabled"
          noWrap
          sx={styles.conversationName}
        >
          {conversation.name}
        </Typography>
      )}
    </Box>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      content={content}
      actions={actions}
      sx={styles.modal}
    />
  );
});

ManageLinksDialog.displayName = 'ManageLinksDialog';

/** @type {MuiSx} */
const manageLinksDialogStyles = () => ({
  modal: {
    width: '37.5rem',
    maxWidth: '37.5rem',
  },
  titleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    overflow: 'hidden',
  },
  conversationName: {
    maxWidth: '100%',
  },
  feedbackRow: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '2rem',
  },
  linkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  linkRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    padding: '0.625rem 0.75rem',
    borderRadius: '0.5rem',
    border: `.0625rem solid ${palette.border.lines}`,
    background: palette.background.tabPanel,
  }),
  linkMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    overflow: 'hidden',
    flex: 1,
  },
  linkUrl: {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  linkActions: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0,
  },
});

export default ManageLinksDialog;
