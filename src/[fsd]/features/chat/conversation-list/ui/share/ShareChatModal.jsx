import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import {
  useCopyChatLink,
  useCopyToClipboard,
  useShareChat,
  useShareChatMessages,
} from '@/[fsd]/features/chat/conversation-list/lib/hooks';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { useDebounceValue, useToast } from '@/[fsd]/shared/lib/hooks';
import { Banner, Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { CountBadge } from '@/[fsd]/shared/ui/chip';
import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';
import LinkIconSvg from '@/assets/copy-link-icon.svg?react';
import { getBasename } from '@/routes';

import {
  DEFAULT_LINK_FORM,
  SHARE_MESSAGES,
  SHARE_MODES,
  SHARE_TABS,
} from '../../lib/constants/shareChat.constants';
import {
  buildShareLinkUrl,
  canGenerateLink,
  countShareLinks,
  getCopyLinkMessage,
  isSameAccessList,
  sortShareLinks,
} from '../../lib/helpers/shareChat.helpers';
import ShareLinkCard from './ShareLinkCard';
import ShareLinkForm from './ShareLinkForm';
import ShareTeamTab from './ShareTeamTab';

const SEARCH_DEBOUNCE_MS = 300;
const EXPIRY_CHECK_MS = 60 * 1000;

const isSameForm = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const ShareChatModal = memo(props => {
  const { conversation, onClose, onAccessSaved } = props;

  const { toastSuccess, toastError } = useToast();
  const copyChatLink = useCopyChatLink();
  const copyToClipboard = useCopyToClipboard();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounceValue(query, SEARCH_DEBOUNCE_MS);
  const [tab, setTab] = useState(null);
  const share = useShareChat({
    conversation,
    query: debouncedQuery.trim(),
    isExternallyShown: tab === SHARE_TABS.externally,
  });
  const { mode, savedAccess, links, membersTotal, createLink, revokeLink, saveAccess, refetchLinks } = share;
  const currentTab = tab ?? (mode === SHARE_MODES.personal ? SHARE_TABS.externally : SHARE_TABS.team);
  const [access, setAccess] = useState(savedAccess);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormRequested, setIsFormRequested] = useState(false);
  const [form, setForm] = useState(DEFAULT_LINK_FORM);
  const [warning, setWarning] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const [now, setNow] = useState(Date.now);
  const [awaitedToken, setAwaitedToken] = useState(null);
  const removingTokens = useRef(new Set());

  const hasExpiringLinks = links.some(link => link.expires_at);
  useEffect(() => {
    if (!hasExpiringLinks) return undefined;
    const timer = setInterval(() => setNow(Date.now()), EXPIRY_CHECK_MS);
    return () => clearInterval(timer);
  }, [hasExpiringLinks]);

  if (awaitedToken && (share.isLinksError || links.some(link => link.token === awaitedToken))) {
    setAwaitedToken(null);
    setIsFormRequested(false);
    setForm(DEFAULT_LINK_FORM);
  }

  // The list is filled once the details fetched after opening arrive; later refetches keep the edits
  const [isAccessLoaded, setIsAccessLoaded] = useState(false);
  if (share.isReady && !isAccessLoaded) {
    setIsAccessLoaded(true);
    setAccess(savedAccess);
  }

  const showsExternally = mode === SHARE_MODES.personal || currentTab === SHARE_TABS.externally;
  const {
    messages,
    total: messagesTotal,
    isFetching: isMessagesFetching,
    isLoaded: isMessagesLoaded,
    onLoadMore,
  } = useShareChatMessages({
    projectId: share.projectId,
    conversationId: conversation?.id,
    authorNames: share.authorNames,
    enabled: showsExternally,
  });

  // A chat with no links shows the form, but only once the list has really loaded
  const hasNoLinks = share.isLinksLoaded && !share.isLinksFetching && !links.length;
  const isFormOpen = isFormRequested || hasNoLinks || !!awaitedToken;
  const showsLinksError = share.isLinksError && !links.length && !isFormRequested;

  const isTeamDirty = isAccessLoaded && !isSameAccessList(access, savedAccess);
  const isFormDirty = isFormOpen && !isSameForm(form, DEFAULT_LINK_FORM);
  const sortedLinks = useMemo(() => sortShareLinks(links, now), [links, now]);
  const counts = useMemo(() => countShareLinks(links, now), [links, now]);
  const isTotalsLoaded = isMessagesLoaded && share.isFilesLoaded;
  const totals = useMemo(
    () => ({ messages: messagesTotal, files: share.filesTotal, isLoaded: isTotalsLoaded }),
    [isTotalsLoaded, messagesTotal, share.filesTotal],
  );
  const showTabs = mode === SHARE_MODES.owner;
  const canGenerate = canGenerateLink(form, totals) && !share.isCreatingLink && !awaitedToken;

  const askOrRun = useCallback(
    (isDirty, action) => (isDirty ? setWarning({ onLeave: action }) : action()),
    [],
  );

  const handleClose = useCallback(() => {
    if (isSaving) return;
    askOrRun(isTeamDirty || isFormDirty, () => onClose?.());
  }, [askOrRun, isSaving, isTeamDirty, isFormDirty, onClose]);

  const handleTab = useCallback((_, value) => setTab(value), []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const { failed, ...changes } = await saveAccess(access);
    onAccessSaved?.(conversation.id, changes);
    if (failed) toastError(SHARE_MESSAGES.accessFailed);
    else toastSuccess(SHARE_MESSAGES.accessUpdated);
    setIsSaving(false);
  }, [access, conversation?.id, onAccessSaved, saveAccess, toastError, toastSuccess]);

  const handleCopyChatLink = useCallback(
    () => copyChatLink(conversation, getCopyLinkMessage({ saved: savedAccess, isDirty: isTeamDirty })),
    [conversation, copyChatLink, isTeamDirty, savedAccess],
  );

  const handleCreateLink = useCallback(() => {
    setForm(DEFAULT_LINK_FORM);
    setIsFormRequested(true);
  }, []);

  const handleBackToList = useCallback(
    () => askOrRun(isFormDirty, () => setIsFormRequested(false)),
    [askOrRun, isFormDirty],
  );

  const handleGenerate = useCallback(async () => {
    try {
      const created = await createLink(form);
      setNow(Date.now());
      if (created?.token) setAwaitedToken(created.token);
      else {
        setIsFormRequested(false);
        setForm(DEFAULT_LINK_FORM);
      }
      toastSuccess(SHARE_MESSAGES.linkCreated);
    } catch {
      toastError(SHARE_MESSAGES.linkCreateFailed);
    }
  }, [createLink, form, toastError, toastSuccess]);

  const handleCopyLink = useCallback(
    link => copyToClipboard(buildShareLinkUrl(getBasename(), link.token), SHARE_MESSAGES.linkCopied),
    [copyToClipboard],
  );

  // A second click while the request runs would fail and report an error for a link already gone
  const removeLink = useCallback(
    async (link, successMessage) => {
      if (removingTokens.current.has(link.token)) return;
      removingTokens.current.add(link.token);
      try {
        await revokeLink(link.token);
        toastSuccess(successMessage);
      } catch {
        toastError(SHARE_MESSAGES.linkRevokeFailed);
      } finally {
        removingTokens.current.delete(link.token);
      }
    },
    [revokeLink, toastError, toastSuccess],
  );

  const handleConfirmRevoke = useCallback(() => {
    const link = revoking;
    setRevoking(null);
    removeLink(link, SHARE_MESSAGES.linkRevoked);
  }, [removeLink, revoking]);

  const handleDelete = useCallback(link => removeLink(link, SHARE_MESSAGES.linkDeleted), [removeLink]);

  const handleCancelRevoke = useCallback(() => setRevoking(null), []);
  const handleStay = useCallback(() => setWarning(null), []);
  const handleLeave = useCallback(() => {
    const action = warning?.onLeave;
    setWarning(null);
    action?.();
  }, [warning]);

  const styles = shareChatModalStyles();

  const headingText =
    counts.expired > 0
      ? `Active links – ${counts.active} · Expired – ${counts.expired}`
      : `Active links – ${counts.active}`;

  const linksError = (
    <Box sx={styles.section}>
      <Banner.BannerMessage
        variant="error"
        message={SHARE_MESSAGES.linksLoadFailed}
        containerSx={styles.banner}
      >
        <Typography
          variant="bodySmall"
          color="inherit"
        >
          {SHARE_MESSAGES.linksLoadFailed}
        </Typography>
      </Banner.BannerMessage>
      <Box>
        <Button.BaseBtn
          data-testid="share-links-retry"
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.secondary}
          onClick={refetchLinks}
        >
          Try again
        </Button.BaseBtn>
      </Box>
    </Box>
  );

  let externallyBody;
  if (showsLinksError) externallyBody = linksError;
  else if (isFormOpen)
    externallyBody = (
      <ShareLinkForm
        form={form}
        messages={messages}
        messagesTotal={messagesTotal}
        totalFiles={share.filesTotal}
        isFilesLoaded={share.isFilesLoaded}
        isMessagesFetching={isMessagesFetching}
        onLoadMoreMessages={onLoadMore}
        onChange={setForm}
      />
    );
  else
    externallyBody = (
      <Box sx={styles.section}>
        <Banner.BannerMessage
          variant="info"
          message={SHARE_MESSAGES.externalInfo}
          containerSx={styles.banner}
        >
          <Typography
            variant="bodySmall"
            color="inherit"
          >
            {SHARE_MESSAGES.externalInfo}
          </Typography>
        </Banner.BannerMessage>
        <Box sx={styles.linksHeader}>
          <Typography
            variant="labelMedium"
            color="text.secondary"
            sx={styles.linksHeading}
          >
            {headingText}
          </Typography>
          <Button.BaseBtn
            data-testid="share-create-link"
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            onClick={handleCreateLink}
          >
            Create Link
          </Button.BaseBtn>
        </Box>
        <Box sx={styles.linkList}>
          {sortedLinks.map(link => (
            <ShareLinkCard
              key={link.token}
              link={link}
              totals={totals}
              now={now}
              onRevoke={setRevoking}
              onDelete={handleDelete}
              onCopy={handleCopyLink}
            />
          ))}
        </Box>
      </Box>
    );

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
      {showTabs && (
        <BaseTabs
          value={currentTab}
          onChange={handleTab}
          sx={styles.tabs}
        >
          <BaseTab
            data-testid="share-tab-team"
            value={SHARE_TABS.team}
            label="Team"
          />
          <BaseTab
            data-testid="share-tab-externally"
            value={SHARE_TABS.externally}
            label={
              <Box sx={styles.tabLabel}>
                Externally
                {counts.active > 0 && (
                  <CountBadge
                    count={counts.active}
                    ariaLabel={`${counts.active} active links`}
                    testId="share-tab-externally-count"
                    sx={styles.tabCount}
                  />
                )}
              </Box>
            }
          />
        </BaseTabs>
      )}
      <Box sx={styles.body}>
        {showsExternally ? (
          externallyBody
        ) : (
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
        )}
      </Box>
    </Box>
  );

  let left = null;
  let right = null;
  if (!showsExternally) {
    left = (
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
    right = (
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
  } else if (isFormOpen && !showsLinksError) {
    left = links.length ? (
      <Button.BaseBtn
        data-testid="share-back-to-list"
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={handleBackToList}
      >
        Back to list
      </Button.BaseBtn>
    ) : null;
    right = (
      <>
        {!links.length && (
          <Button.BaseBtn
            data-testid="share-cancel"
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={handleClose}
          >
            Cancel
          </Button.BaseBtn>
        )}
        <Button.BaseBtn
          data-testid="share-generate-link"
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          loading={share.isCreatingLink}
          disabled={!canGenerate}
          onClick={handleGenerate}
        >
          Generate Link
        </Button.BaseBtn>
      </>
    );
  } else {
    right = (
      <Button.BaseBtn
        data-testid="share-close-button"
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={handleClose}
      >
        Close
      </Button.BaseBtn>
    );
  }

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
        open={!!warning}
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
      <Modal.BaseModal
        open={!!revoking}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.destructive}
        title={SHARE_MESSAGES.revokeTitle}
        content={<Typography variant="bodyMedium">{SHARE_MESSAGES.revokeText}</Typography>}
        confirmButtonText="Revoke"
        alarm
        onConfirm={handleConfirmRevoke}
        onClose={handleCancelRevoke}
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
  // BaseModal pads the body with !important; the tabs and sections set their own side padding
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
  tabs: ({ palette }) => ({
    flexShrink: 0,
    margin: '0.75rem 2rem 0',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    '& .MuiTab-root': { textTransform: 'none', minWidth: 0, padding: '0.5rem 1rem' },
  }),
  tabLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  tabCount: {
    padding: '0 0.375rem',
    minWidth: '1.25rem',
    height: '1.25rem',
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
  section: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  banner: {
    marginTop: 0,
  },
  linksHeading: {
    '&&&': { fontWeight: 600 },
  },
  linksHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '0.5rem',
  },
  linkList: {
    flex: '1 1 0',
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
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
