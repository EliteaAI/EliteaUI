import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Modal, Text } from '@/[fsd]/shared/ui';

import FolderDefaultPermissionsBanner from './FolderDefaultPermissionsBanner';
import FolderPermissionsTable from './FolderPermissionsTable';

const FolderManagePermissionsModal = memo(props => {
  const { open, onClose, folderId, folderName } = props;

  const styles = folderManagePermissionsModalStyles();
  const title = folderName ? (
    <Box sx={styles.title}>
      <Typography
        component="span"
        variant="headingSmall"
        color="text.secondary"
        sx={styles.titleLabel}
      >
        Manage Permissions:
      </Typography>
      <Text.EllipsisTypography
        component="span"
        variant="headingSmall"
        color="text.secondary"
        sx={styles.folderName}
      >
        {folderName}
      </Text.EllipsisTypography>
    </Box>
  ) : (
    'Manage Permissions'
  );

  return (
    <Modal.BaseModal
      open={open}
      title={title}
      onClose={onClose}
      sx={styles.dialogPaper}
      dialogSx={styles.dialogContent}
      hideSections
      content={
        <Box sx={styles.content}>
          <FolderDefaultPermissionsBanner />
          <FolderPermissionsTable
            key={folderId}
            folderId={folderId}
          />
        </Box>
      }
    />
  );
});

FolderManagePermissionsModal.displayName = 'FolderManagePermissionsModal';

export default FolderManagePermissionsModal;

const folderManagePermissionsModalStyles = () => ({
  dialogPaper: ({ palette }) => ({
    width: '56.25rem',
    maxWidth: '90vw',
    backgroundColor: palette.background.tabPanel,
    '& .MuiDialogTitle-root': {
      borderBottom: `0.0625rem solid ${palette.border.lines}`,
    },
  }),
  dialogContent: ({ palette }) => ({
    maxHeight: '80dvh',
    overflowY: 'auto',
    padding: '0 !important',
    backgroundColor: palette.background.default.secondary,
  }),
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    width: '100%',
    minWidth: 0,
    maxWidth: '45rem',
  },
  titleLabel: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  folderName: {
    flex: 1,
    minWidth: 0,
    marginRight: 0,
  },
  content: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: palette.background.default.secondary,
  }),
});
