import { memo, useCallback } from 'react';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';

import BaseBtn, { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseIcon from '@/components/Icons/CloseIcon';
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={styles.dialog}
    >
      <DialogTitle sx={styles.dialogTitle}>
        <Box sx={styles.titleContent}>
          <Typography variant="headingMedium">Manage Links</Typography>
          <Typography
            variant="bodySmall"
            color="text.disabled"
            noWrap
            sx={styles.conversationName}
          >
            {conversation?.name}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={styles.closeButton}
        >
          <CloseIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={styles.dialogContent}>
        {isLoadingLinks ? (
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
        )}
      </DialogContent>

      <DialogActions sx={styles.dialogActions}>
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.secondary}
          onClick={onClose}
        >
          Close
        </BaseBtn>
      </DialogActions>
    </Dialog>
  );
});

ManageLinksDialog.displayName = 'ManageLinksDialog';

/** @type {MuiSx} */
const manageLinksDialogStyles = () => ({
  dialog: {
    '& .MuiDialog-paper': ({ palette }) => ({
      width: '37.5rem',
      maxWidth: '37.5rem',
      borderRadius: '1rem',
      backgroundColor: palette.background.tabPanel,
      backgroundImage: 'none',
      border: `.0625rem solid ${palette.border.lines}`,
      boxShadow: '0 0 1.475rem 0 rgba(255, 255, 255, 0.05)',
    }),
  },
  dialogTitle: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: '3.75rem',
    padding: '0.875rem 1.5rem',
    backgroundColor: palette.background.tabPanel,
  }),
  titleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    overflow: 'hidden',
    paddingRight: '1rem',
  },
  conversationName: {
    maxWidth: '100%',
  },
  closeButton: ({ palette }) => ({
    padding: 0,
    margin: 0,
    flexShrink: 0,
    color: palette.icon.fill.default,
    '&:hover': { backgroundColor: 'transparent' },
  }),
  dialogContent: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem !important',
    borderTop: `.0625rem solid ${palette.border.lines}`,
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    background: palette.background.secondary,
    gap: '0.5rem',
    minHeight: '8rem',
  }),
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
  dialogActions: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '1rem 1.5rem',
    backgroundColor: palette.background.tabPanel,
  }),
});

export default ManageLinksDialog;
