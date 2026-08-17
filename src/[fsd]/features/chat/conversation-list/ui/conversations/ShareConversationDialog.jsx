import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  Typography,
} from '@mui/material';

import { useLazyMessageListQuery } from '@/[fsd]/features/chat/api';
import { Input, Select } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { getBasename } from '@/routes';

import { useCreateShareLinkMutation, useRevokeShareLinkMutation } from '../../api/sharedLinksApi';
import { EXPIRY_OPTIONS, SCOPE_OPTIONS } from '../../lib/constants';

const ShareConversationDialog = memo(props => {
  const { open, conversation = {}, onClose } = props;

  const projectId = useSelectedProjectId();
  const { toastInfo, toastError } = useToast();

  const [expiry, setExpiry] = useState('7d');
  const [scope, setScope] = useState('all');
  const [password, setPassword] = useState('');
  const [createdLink, setCreatedLink] = useState(null);
  const [createdToken, setCreatedToken] = useState(null);
  const [createError, setCreateError] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const conversationId = conversation?.id;

  const [createShareLink, { isLoading: isCreating }] = useCreateShareLinkMutation();
  const [revokeShareLink, { isLoading: isRevoking }] = useRevokeShareLinkMutation();

  const [fetchMessages, { data: messagesData, isFetching: isLoadingMessages }] = useLazyMessageListQuery();

  useEffect(() => {
    if (scope === 'partial' && open && conversationId) {
      fetchMessages({ projectId, conversationId, page: 0, pageSize: 200 });
    }
  }, [scope, open, conversationId, fetchMessages, projectId]);

  const messageGroups = useMemo(() => {
    const rows = messagesData?.rows ?? [];
    return rows.map((group, index) => {
      const textItem = (group.message_items ?? []).find(item => item.item_type === 'text_message');
      const preview = textItem?.item_details?.content
        ? String(textItem.item_details.content).slice(0, 80)
        : '';
      const authorName = group.sent_to_id ? 'Assistant' : 'User';
      return {
        id: group.id,
        preview,
        authorName: `${authorName} · message ${index + 1}`,
      };
    });
  }, [messagesData]);

  const styles = shareConversationDialogStyles();

  const handleScopeChange = useCallback(newScope => {
    setScope(newScope);
    setSelectedGroupIds([]);
  }, []);

  const handleToggleGroup = useCallback(id => {
    setSelectedGroupIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }, []);

  const isPasswordValid = useMemo(() => !password.trim() || password.trim().length >= 4, [password]);

  const canGenerate = useMemo(() => {
    if (!isPasswordValid || isCreating) return false;
    if (scope === 'partial' && selectedGroupIds.length === 0) return false;
    if (createdLink) return false;
    return true;
  }, [isCreating, isPasswordValid, scope, selectedGroupIds.length, createdLink]);

  const handleCreate = useCallback(async () => {
    if (!canGenerate) return;
    setCreateError('');
    const body = { expiry, scope };
    if (password.trim()) body.password = password.trim();
    if (scope === 'partial') body.message_group_ids = selectedGroupIds;
    const basename = getBasename();

    try {
      const result = await createShareLink({ projectId, conversationId, ...body }).unwrap();
      const shareUrl = `${window.location.protocol}//${window.location.host}${basename}/shared/${result.token}`;
      setCreatedLink(shareUrl);
      setCreatedToken(result.token);
      await navigator.clipboard.writeText(shareUrl);
      toastInfo('Share link created and copied to clipboard.');
      setPassword('');
      setSelectedGroupIds([]);
    } catch {
      setCreateError('Failed to create share link. Please try again.');
      toastError('Failed to create share link. Please try again.');
    }
  }, [
    canGenerate,
    conversationId,
    createShareLink,
    expiry,
    password,
    projectId,
    scope,
    selectedGroupIds,
    toastError,
    toastInfo,
  ]);

  const handleClose = useCallback(() => {
    setCreatedLink(null);
    setCreatedToken(null);
    setCreateError('');
    setPassword('');
    setExpiry('7d');
    setScope('all');
    setSelectedGroupIds([]);
    onClose();
  }, [onClose]);

  const handleCopyCreated = useCallback(async () => {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    toastInfo('Link copied to clipboard.');
    handleClose();
  }, [createdLink, handleClose, toastInfo]);

  const handleRevoke = useCallback(async () => {
    if (!createdToken) return;
    try {
      await revokeShareLink({ projectId, token: createdToken, conversationId }).unwrap();
      setCreatedLink(null);
      setCreatedToken(null);
      toastInfo('Share link revoked.');
    } catch {
      toastError('Failed to revoke link. Please try again.');
    }
  }, [conversationId, createdToken, projectId, revokeShareLink, toastError, toastInfo]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      sx={styles.dialog}
    >
      <DialogTitle sx={styles.dialogTitle}>
        <Box sx={styles.titleContent}>
          <Typography variant="headingMedium">Share conversation</Typography>
          <Typography
            variant="bodySmall"
            color="text.disabled"
            noWrap
            sx={styles.conversationName}
          >
            {conversation?.name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={styles.dialogContent}>
        <Select.SingleSelect
          label="What to share"
          value={scope}
          options={SCOPE_OPTIONS}
          onValueChange={handleScopeChange}
          showBorder
        />

        {scope === 'partial' && (
          <Box sx={styles.groupChecklist}>
            {isLoadingMessages ? (
              <Typography
                variant="bodySmall2"
                color="text.disabled"
                sx={styles.checklistFeedback}
              >
                Loading messages…
              </Typography>
            ) : messageGroups.length === 0 ? (
              <Typography
                variant="bodySmall2"
                color="text.disabled"
                sx={styles.checklistFeedback}
              >
                No messages found.
              </Typography>
            ) : (
              <List
                dense
                disablePadding
              >
                {messageGroups.map(group => (
                  <ListItem
                    key={group.id}
                    disablePadding
                    sx={styles.checklistItem}
                  >
                    <FormControlLabel
                      sx={styles.checklistLabel}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedGroupIds.includes(group.id)}
                          onChange={() => handleToggleGroup(group.id)}
                          sx={styles.checkbox}
                        />
                      }
                      label={
                        <Box sx={styles.checklistLabelContent}>
                          <Typography
                            variant="bodySmall"
                            color="text.secondary"
                            sx={styles.checklistAuthor}
                          >
                            {group.authorName}
                          </Typography>
                          {group.preview && (
                            <Typography
                              variant="bodySmall2"
                              color="text.disabled"
                              noWrap
                              sx={styles.checklistPreview}
                            >
                              {group.preview}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
            {scope === 'partial' &&
              selectedGroupIds.length === 0 &&
              !isLoadingMessages &&
              messageGroups.length > 0 && (
                <Typography
                  variant="bodySmall2"
                  color="error.main"
                  sx={styles.partialError}
                >
                  Select at least one message to share.
                </Typography>
              )}
          </Box>
        )}

        <Select.SingleSelect
          label="Link expires after"
          value={expiry}
          options={EXPIRY_OPTIONS}
          onValueChange={setExpiry}
          showBorder
        />
        <Input.StyledInputEnhancer
          label="Password protection (optional)"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={!isPasswordValid}
          helperText={!isPasswordValid ? 'Minimum 4 characters.' : ''}
          variant="standard"
          fullWidth
          sx={{ marginTop: '-1rem' }}
        />

        {createError && (
          <Typography
            variant="bodySmall2"
            color="error.main"
          >
            {createError}
          </Typography>
        )}

        {createdLink && (
          <>
            <Box sx={styles.createdLinkRow}>
              <Typography
                variant="bodySmall2"
                color="text.secondary"
                sx={styles.createdLinkText}
                noWrap
                title={createdLink}
              >
                {createdLink}
              </Typography>
            </Box>
            <Typography
              variant="bodySmall2"
              color="text.disabled"
              sx={styles.guidelinesText}
            >
              This link provides read-only access to the selected conversation content. Anyone with the link
              can view it — avoid sharing links that contain sensitive information. You can revoke access at
              any time from Manage links.
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions sx={styles.dialogActions}>
        {createdLink ? (
          <BaseBtn
            variant={BUTTON_VARIANTS.alarm}
            loading={isRevoking}
            onClick={handleRevoke}
          >
            Revoke
          </BaseBtn>
        ) : (
          <BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={handleClose}
          >
            Cancel
          </BaseBtn>
        )}
        {createdLink ? (
          <BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            onClick={handleCopyCreated}
          >
            Copy
          </BaseBtn>
        ) : (
          <BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            disabled={!canGenerate}
            loading={isCreating}
            onClick={handleCreate}
          >
            Generate link
          </BaseBtn>
        )}
      </DialogActions>
    </Dialog>
  );
});

ShareConversationDialog.displayName = 'ShareConversationDialog';

/** @type {MuiSx} */
const shareConversationDialogStyles = () => ({
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
    minHeight: '3.75rem',
    padding: '0.875rem 1.5rem',
    backgroundColor: palette.background.tabPanel,
  }),
  titleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    overflow: 'hidden',
  },
  conversationName: {
    maxWidth: '100%',
  },
  dialogContent: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem !important',
    borderTop: `.0625rem solid ${palette.border.lines}`,
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    background: palette.background.secondary,
    gap: '1rem',
    minHeight: '12rem',
  }),
  groupChecklist: ({ palette }) => ({
    maxHeight: '12rem',
    overflowY: 'auto',
    border: `.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    padding: '0.25rem 0',
    background: palette.background.tabPanel,
  }),
  checklistFeedback: {
    padding: '0.75rem 1rem',
  },
  checklistItem: {
    padding: '0 0.5rem',
  },
  checklistLabel: {
    width: '100%',
    margin: 0,
    gap: '0.25rem',
    alignItems: 'flex-start',
    padding: '0.25rem 0',
  },
  checkbox: {
    padding: '0.125rem',
    marginTop: '0.125rem',
  },
  checklistLabelContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    overflow: 'hidden',
  },
  checklistAuthor: {
    fontWeight: 600,
  },
  checklistPreview: {
    maxWidth: '28rem',
  },
  partialError: {
    padding: '0.25rem 1rem 0.5rem',
  },
  createdLinkRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    border: `.0625rem solid ${palette.border.lines}`,
    background: palette.background.tabPanel,
  }),
  createdLinkText: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  guidelinesText: {
    marginTop: '-0.5rem',
  },
  dialogActions: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '1rem 1.5rem',
    backgroundColor: palette.background.tabPanel,
  }),
});

export default ShareConversationDialog;
