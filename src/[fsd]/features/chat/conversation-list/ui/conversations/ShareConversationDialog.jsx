import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useLazyMessageListQuery } from '@/[fsd]/features/chat/api';
import { Input, Select } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { getBasename } from '@/routes';

import { useCreateShareLinkMutation, useRevokeShareLinkMutation } from '../../api/sharedLinksApi';
import { EXPIRY_OPTIONS, SCOPE_OPTIONS } from '../../lib/constants';
import MessageGroupChecklist from './MessageGroupChecklist';

const MESSAGE_PAGE_SIZE = 4;

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
  const [messagesPage, setMessagesPage] = useState(0);

  const conversationId = conversation?.id;

  const [createShareLink, { isLoading: isCreating }] = useCreateShareLinkMutation();
  const [revokeShareLink, { isLoading: isRevoking }] = useRevokeShareLinkMutation();

  const [fetchMessages, { isFetching: isLoadingMessages }] = useLazyMessageListQuery();
  const [accumulatedRows, setAccumulatedRows] = useState([]);
  const [messagesTotal, setMessagesTotal] = useState(0);

  useEffect(() => {
    if (scope === 'partial' && open && conversationId) {
      setAccumulatedRows([]);
      setMessagesTotal(0);
      setMessagesPage(0);
      fetchMessages({ projectId, conversationId, page: 0, pageSize: MESSAGE_PAGE_SIZE }).then(result => {
        if (result.data) {
          setAccumulatedRows(result.data.rows ?? []);
          setMessagesTotal(result.data.total ?? 0);
        }
      });
    }
  }, [scope, open, conversationId, fetchMessages, projectId]);

  useEffect(() => {
    if (messagesPage === 0) return;
    if (scope === 'partial' && open && conversationId) {
      fetchMessages({ projectId, conversationId, page: messagesPage, pageSize: MESSAGE_PAGE_SIZE }).then(
        result => {
          if (result.data) {
            const newRows = result.data.rows ?? [];
            setAccumulatedRows(prev => {
              const existingIds = new Set(prev.map(r => r.id));
              return [...prev, ...newRows.filter(r => !existingIds.has(r.id))];
            });
            setMessagesTotal(result.data.total ?? 0);
          }
        },
      );
    }
  }, [messagesPage, scope, open, conversationId, fetchMessages, projectId]);

  const handleLoadMoreMessages = useCallback(() => {
    setMessagesPage(prev => prev + 1);
  }, []);

  const messageGroups = useMemo(() => {
    const rows = accumulatedRows;
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
  }, [accumulatedRows]);

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
      setPassword('');
      setSelectedGroupIds([]);
      try {
        await navigator.clipboard.writeText(shareUrl);
        toastInfo('Share link created and copied to clipboard.');
      } catch {
        toastInfo('Share link created. Copy it from the field below.');
      }
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

  const content = (
    <Box sx={styles.contentWrapper}>
      <Select.SingleSelect
        label="What to share"
        value={scope}
        options={SCOPE_OPTIONS}
        onValueChange={handleScopeChange}
        showBorder
      />

      {scope === 'partial' && (
        <MessageGroupChecklist
          groups={messageGroups}
          selectedGroupIds={selectedGroupIds}
          onToggle={handleToggleGroup}
          isLoading={isLoadingMessages}
          loadedCount={accumulatedRows.length}
          totalCount={messagesTotal}
          onLoadMore={handleLoadMoreMessages}
          resetPageDependencies={conversationId}
        />
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
            This link provides read-only access to the selected conversation content. Anyone with the link can
            view it — avoid sharing links that contain sensitive information. You can revoke access at any
            time from Manage links.
          </Typography>
        </>
      )}
    </Box>
  );

  const actions = createdLink ? (
    <>
      <BaseBtn
        variant={BUTTON_VARIANTS.alarm}
        loading={isRevoking}
        onClick={handleRevoke}
      >
        Revoke
      </BaseBtn>
      <BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        onClick={handleCopyCreated}
      >
        Copy
      </BaseBtn>
    </>
  ) : (
    <>
      <BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={handleClose}
      >
        Cancel
      </BaseBtn>
      <BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        disabled={!canGenerate}
        loading={isCreating}
        onClick={handleCreate}
      >
        Generate link
      </BaseBtn>
    </>
  );

  const title = (
    <Box sx={styles.titleContent}>
      <Typography variant="headingMedium">Share conversation</Typography>
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
      onClose={handleClose}
      title={title}
      showCloseButton={false}
      content={content}
      actions={actions}
      sx={styles.modal}
    />
  );
});

ShareConversationDialog.displayName = 'ShareConversationDialog';

/** @type {MuiSx} */
const shareConversationDialogStyles = () => ({
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
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
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
});

export default ShareConversationDialog;
