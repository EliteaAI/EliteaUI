import { memo, useCallback, useState } from 'react';

import { Box, IconButton, Tooltip } from '@mui/material';

import { PERSONAL_TOKENS_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants/personalTokensTourTargets.constants';
import VsCodeIcon from '@/assets/vscode.svg?react';
import DeleteEntityButton from '@/components/DeleteEntityButton';
import JetBrainsIcon from '@/components/Icons/JetBrainsIcon';
import OpenEyeIcon from '@/components/Icons/OpenEyeIcon';
import useToast from '@/hooks/useToast';

const TokenActionsCell = memo(props => {
  const { token, deleteToken, refetch, onDownload, onVsCodeDownload, onPreview, showDownload } = props;
  const styles = tokenActionsCellStyles();
  const [isDeleting, setIsDeleting] = useState(false);
  const { toastSuccess } = useToast();

  const onClickDelete = useCallback(async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      const { error } = await deleteToken({ uuid: token.uuid });
      if (!error) {
        toastSuccess(`The ${token.name || 'personal token'} personal token has been successfully deleted.`);
        await refetch();
      }
      setIsDeleting(false);
    }
  }, [deleteToken, isDeleting, refetch, token.uuid, token.name, toastSuccess]);

  return (
    <Box
      data-tour={PERSONAL_TOKENS_TOUR_TARGET_IDS.ideSettings}
      sx={styles.container}
    >
      {showDownload && (
        <Tooltip
          title="Preview settings"
          placement="top"
        >
          <IconButton
            data-testid="token-action-preview-button"
            variant="elitea"
            size="small"
            color="tertiary"
            onClick={onPreview}
          >
            <OpenEyeIcon sx={styles.icon} />
          </IconButton>
        </Tooltip>
      )}
      {showDownload && (
        <Tooltip
          title="Download VScode settings"
          placement="top"
        >
          <Box
            data-testid="token-action-vscode-button"
            sx={styles.downloadBox}
            onClick={onVsCodeDownload}
          >
            <VsCodeIcon
              width={14}
              height={14}
            />
          </Box>
        </Tooltip>
      )}
      {showDownload && (
        <Tooltip
          title="Download Jetbrains settings"
          placement="top"
        >
          <Box
            data-testid="token-action-jetbrains-button"
            sx={styles.downloadBox}
            onClick={onDownload}
          >
            <JetBrainsIcon sx={styles.icon} />
          </Box>
        </Tooltip>
      )}
      <DeleteEntityButton
        name={token.name}
        onDelete={onClickDelete}
        title={`Delete token`}
        isLoading={isDeleting}
        validatePermission={false}
        buttonColor="tertiary"
        testId="token-action-delete-button"
      />
    </Box>
  );
});

TokenActionsCell.displayName = 'TokenActionsCell';

/** @type {MuiSx} */
const tokenActionsCellStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: { xs: '0.25rem', sm: '0.5rem' },
    minWidth: 0,
    overflow: 'hidden',
  },
  iconButton: {
    padding: 0,
    minWidth: '1.5rem',
    width: '1.5rem',
    height: '1.5rem',
  },
  downloadBox: {
    padding: '0.125rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '1.25rem',
    height: '1.25rem',
  },
  deleteButton: {
    marginRight: 0,
    minWidth: '1.5rem',
    width: '1.5rem',
    height: '1.5rem',
    padding: 0,
  },
  icon: ({ palette }) => ({
    color: palette.icon.fill.default,
    fontSize: '0.875rem',
  }),
});

export default TokenActionsCell;
