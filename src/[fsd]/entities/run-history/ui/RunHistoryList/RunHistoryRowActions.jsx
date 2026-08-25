import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { Modal } from '@/[fsd]/shared/ui';
import CopyLinkIcon from '@/assets/copy-link-icon.svg?react';
import { SearchParams } from '@/common/constants';
import DotMenu from '@/components/DotMenu';
import CheckIcon from '@/components/Icons/CheckIcon.jsx';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import RestoreIcon from '@/components/Icons/RestoreIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { getBasename } from '@/routes';
import { copyToClipboard } from '@/utils/browserUtils';

const ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'right' };
const TRANSFORM_ORIGIN = { vertical: 'top', horizontal: 'right' };
const COPIED_FEEDBACK_MS = 2500;

const RunHistoryRowActions = memo(props => {
  const { item, source, onItemSelect, handleRestoreConversation, shareOpensHistoryTab = false } = props;

  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError, toastInfo } = useToast();
  const theme = useTheme();

  const [confirmRemoveModal, setConfirmRemoveModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);

  const [deleteHistoryItem, { isLoading: isDeleting }] = RunHistoryApi.useDeleteRunHistoryItemMutation();

  const hasConversation = item?.hasConversation ?? true;
  const canShare = item?.canShare ?? hasConversation;

  const styles = runHistoryRowActionsStyles(isDeleting);

  const closeConfirmationModal = useCallback(() => setConfirmRemoveModal(false), []);
  const openConfirmationModal = useCallback(() => setConfirmRemoveModal(true), []);
  const openMenu = useCallback(() => setMenuOpened(true), []);
  const closeMenu = useCallback(() => setMenuOpened(false), []);

  const handleCopyLink = useCallback(async () => {
    const url = new URL(window.location.href);

    url.searchParams.set(SearchParams.HistoryRunId, item.id);
    if (shareOpensHistoryTab) url.searchParams.set(SearchParams.DestTab, 'History');

    const appPath = `${url.pathname.replace(getBasename(), '')}${url.search}`;

    try {
      await copyToClipboard(NavigationHelpers.buildAbsoluteAppUrl(projectId, appPath));
    } catch {
      toastError('Failed to copy the link to the clipboard.');
      return;
    }

    setLinkCopied(true);
    toastInfo('The link has been copied to the clipboard.');

    setTimeout(() => {
      setLinkCopied(false);
    }, COPIED_FEEDBACK_MS);
  }, [item?.id, projectId, shareOpensHistoryTab, toastError, toastInfo]);

  const confirmHistoryItemRemoval = useCallback(async () => {
    if (isDeleting) return;

    try {
      await deleteHistoryItem({
        projectId,
        historyId: item.id,
      }).unwrap();

      toastSuccess('The run has been successfully deleted.');
      setConfirmRemoveModal(false);
      onItemSelect(null);
    } catch {
      toastError('Failed to delete chat');
    }
  }, [deleteHistoryItem, isDeleting, item, onItemSelect, projectId, toastError, toastSuccess]);

  const slotProps = useMemo(
    () => ({
      ListItemText: {
        sx: { color: theme.palette.text.secondary },
        primaryTypographyProps: { variant: 'bodyMedium' },
      },
      ListItemIcon: {
        sx: {
          minWidth: '1rem !important',
          marginRight: '.75rem',
        },
      },
    }),
    [theme],
  );

  const menuItems = useMemo(
    () => [
      ...(canShare
        ? [
            {
              label: 'Share link',
              icon: linkCopied ? <CheckIcon /> : <CopyLinkIcon />,
              onClick: handleCopyLink,
            },
          ]
        : []),
      ...(hasConversation
        ? [
            {
              label: 'Delete',
              icon: <DeleteIcon sx={styles.deleteIcon} />,
              onClick: openConfirmationModal,
            },
          ]
        : []),
      ...(hasConversation && handleRestoreConversation
        ? [
            {
              label: 'Restore chat',
              icon: <RestoreIcon />,
              onClick: () => handleRestoreConversation(item.id),
              tooltip: `Restores chat history only. ${source?.charAt(0)?.toUpperCase() + source?.slice(1)} configuration, behavior, or settings are not restored and may have changed since then.`,
            },
          ]
        : []),
    ],
    [
      canShare,
      hasConversation,
      linkCopied,
      handleCopyLink,
      openConfirmationModal,
      handleRestoreConversation,
      item?.id,
      source,
      styles.deleteIcon,
    ],
  );

  if (!menuItems.length) return null;

  return (
    <>
      <Box
        id="actions-block"
        sx={[styles.actions, menuOpened && styles.actionsRevealed]}
      >
        <DotMenu
          id="run-history-menu"
          slotProps={slotProps}
          onClose={closeMenu}
          onShowMenuList={openMenu}
          anchorOrigin={ANCHOR_ORIGIN}
          transformOrigin={TRANSFORM_ORIGIN}
        >
          {menuItems}
        </DotMenu>
      </Box>

      <Modal.DeleteEntityModal
        open={confirmRemoveModal}
        onClose={closeConfirmationModal}
        onConfirm={confirmHistoryItemRemoval}
        title="Remove run?"
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        customContent={
          <Typography variant="bodyMedium">Are you sure you want to remove this run?</Typography>
        }
        confirmButtonText="Remove"
      />
    </>
  );
});

RunHistoryRowActions.displayName = 'RunHistoryRowActions';

/** @type {MuiSx} */
const runHistoryRowActionsStyles = isDeleting => ({
  actions: ({ palette }) => ({
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: '0rem',
    top: '50%',
    transform: 'translateY(-50%)',
    gap: '0.25rem',
    padding: '0.5rem',
    borderRadius: '0.25rem',

    svg: {
      fontSize: '.9rem',

      path: {
        fill: palette.secondary.main,
      },
    },
  }),
  actionsRevealed: {
    display: 'flex',
  },
  deleteIcon: {
    fontSize: '.875rem',
    opacity: isDeleting ? 0.5 : 1,
    pointerEvents: isDeleting ? 'none' : 'auto',
  },
});

export default RunHistoryRowActions;
