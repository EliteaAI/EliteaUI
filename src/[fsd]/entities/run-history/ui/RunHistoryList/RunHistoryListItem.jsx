import { memo, useCallback, useMemo, useState } from 'react';

import { format } from 'date-fns';

import { Box, Button, Skeleton, Typography, useTheme } from '@mui/material';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import { RunHistoryTooltipCell } from '@/[fsd]/entities/run-history/ui';
import { SharedHelpers } from '@/[fsd]/shared/lib/helpers';
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

const RunHistoryListItem = memo(props => {
  const {
    item,
    versions = [],
    onItemSelect,
    selectedItem,
    useMock,
    tooltipTrigger,
    handleRestoreConversation,
    source,
  } = props;

  const noVersions = useMemo(() => versions === null, [versions]);

  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [confirmRemoveModal, setConfirmRemoveModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [actionsMenuOpened, setActionMenuOpened] = useState(false);

  const theme = useTheme();
  const styles = runHistoryListItemStyles(noVersions, actionsMenuOpened);

  const [deleteHistoryItem, { isLoading: isDeleting }] = RunHistoryApi.useDeleteRunHistoryItemMutation();

  const getCurrentVersion = useCallback(
    id => {
      if (noVersions) return '-';

      return versions.find(v => v.id === id)?.name ?? '-';
    },
    [versions, noVersions],
  );

  const closeConfirmationModal = () => setConfirmRemoveModal(false);

  const handleDeleteHistoryItem = useCallback(() => {
    setConfirmRemoveModal(true);
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    searchParams.set(SearchParams.HistoryRunId, item.id);
    searchParams.set(SearchParams.DestTab, 'History');

    const entityURL = url.toString();

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename();

    const destinationUrl = `${baseUrl}${basename}/${projectId}${entityURL.replace(baseUrl, '').replace(basename, '')}`;

    await navigator.clipboard.writeText(destinationUrl);

    setLinkCopied(true);
    toastInfo('The link has been copied to the clipboard');

    setTimeout(() => {
      setLinkCopied(false);
    }, 2500);
  }, [item?.id, projectId, toastInfo]);

  const confirmHistoryItemRemoval = useCallback(async () => {
    if (isDeleting) return;

    try {
      await deleteHistoryItem({
        projectId,
        historyId: item.id,
      }).unwrap();

      toastSuccess('Conversation deleted successfully');
      setConfirmRemoveModal(false);
      onItemSelect(null);
    } catch {
      toastError('Failed to delete conversation');
    }
  }, [deleteHistoryItem, isDeleting, item, onItemSelect, projectId, toastError, toastSuccess]);

  const { date, version, duration } = useMemo(
    () =>
      useMock
        ? { date: '-', version: '-', duration: '-' }
        : {
            date: format(new Date(item.created_at.replace('Z', '')), 'dd-MM-yyyy, hh:mm a'),
            version: getCurrentVersion(item.version_id),
            duration: SharedHelpers.secondsInHumanFormat(item.duration),
          },
    [getCurrentVersion, item, useMock],
  );

  if (useMock)
    return (
      <Box sx={styles.listItem}>
        <Skeleton
          variant="text"
          width={noVersions ? '50%' : '70%'}
          height={20}
        />
        {!noVersions && (
          <Skeleton
            variant="text"
            width="50%"
            height={20}
          />
        )}
        <Skeleton
          variant="text"
          width={noVersions ? '50%' : '30%'}
          height={20}
        />
      </Box>
    );

  return (
    <>
      <Box
        sx={[styles.listItem, selectedItem === item.id && styles.selected]}
        onClick={() => onItemSelect(item.id)}
      >
        <RunHistoryTooltipCell
          text={date}
          trigger={tooltipTrigger}
        />
        {!noVersions && (
          <RunHistoryTooltipCell
            text={version}
            trigger={tooltipTrigger}
          />
        )}
        <RunHistoryTooltipCell
          text={duration}
          trigger={tooltipTrigger}
        />
        <Box
          id="actions-block"
          sx={styles.actions}
        >
          <DotMenu
            id="run-history-menu"
            slotProps={{
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
            }}
            onClose={() => setActionMenuOpened(false)}
            onShowMenuList={() => setActionMenuOpened(true)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {[
              {
                label: 'Share link',
                icon: linkCopied ? <CheckIcon /> : <CopyLinkIcon />,
                onClick: handleCopyLink,
              },
              {
                label: 'Delete',
                icon: <DeleteIcon sx={styles.deleteIcon(isDeleting)} />,
                onClick: handleDeleteHistoryItem,
              },
              ...(handleRestoreConversation
                ? [
                    {
                      label: 'Restore conversation',
                      icon: <RestoreIcon />,
                      onClick: () => handleRestoreConversation(item.id),
                      tooltip: `Restores chat history only. ${source?.charAt(0)?.toUpperCase() + source?.slice(1)} configuration, behavior, or settings are not restored and may have changed since then.`,
                    },
                  ]
                : []),
            ]}
          </DotMenu>
        </Box>
      </Box>

      <Modal.BaseModal
        hideSections
        open={confirmRemoveModal}
        title="Remove run"
        onClose={closeConfirmationModal}
        content={<Typography>Are you sure you want to remove this run?</Typography>}
        actions={
          <Box sx={{ display: 'flex', gap: '1rem' }}>
            <Button
              variant="elitea"
              color="secondary"
              onClick={closeConfirmationModal}
              disableRipple
            >
              Cancel
            </Button>
            <Button
              variant="elitea"
              color="alarm"
              onClick={confirmHistoryItemRemoval}
              disableRipple
              disabled={isDeleting}
            >
              Remove
            </Button>
          </Box>
        }
      />
    </>
  );
});

RunHistoryListItem.displayName = 'RunHistoryListItem';

/** @type {MuiSx} */
const runHistoryListItemStyles = (noVersions, actionsMenuOpened) => ({
  listItem: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: noVersions ? '1.5fr 1.5fr' : '1.5fr 1.5fr 1fr',
    alignItems: 'center',
    padding: '.5rem 1rem',
    width: '100%',
    color: palette.text.secondary,
    position: 'relative',
    borderRadius: '0.5rem',

    span: {
      padding: '0rem 1rem',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',

      '&:first-of-type': {
        padding: 0,
      },
    },

    '&:after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '1px',
      backgroundColor: palette.divider,
    },

    '&:nth-of-type(1)': {
      '&:after': { display: 'none' },
    },

    ...(actionsMenuOpened
      ? {
          '#actions-block': {
            display: 'flex',
          },
        }
      : {}),

    '&:hover': {
      cursor: 'pointer',
      backgroundColor: palette.background.userInputBackground,

      '&:after': {
        display: 'none',
      },

      '#actions-block': {
        display: 'flex',
      },
    },

    '&:hover + &:after': {
      display: 'none',
    },
  }),
  selected: ({ palette }) => ({
    background: palette.split.pressed,

    '&:after': {
      display: 'none',
    },

    '&:hover': {
      cursor: 'pointer',
      background: palette.split.pressed,
    },

    '+ *:after': {
      display: 'none',
    },
  }),
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
  deleteIcon: isDeleting => ({
    fontSize: '.875rem',
    opacity: isDeleting ? 0.5 : 1,
    pointerEvents: isDeleting ? 'none' : 'auto',
  }),
});

export default RunHistoryListItem;
