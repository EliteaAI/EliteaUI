import { memo } from 'react';

import { Box } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';

import FolderDefaultPermissionsBanner from './FolderDefaultPermissionsBanner';
import FolderPermissionsTable from './FolderPermissionsTable';

const FolderManagePermissionsModal = memo(props => {
  const { open, onClose, folderId } = props;

  const styles = folderManagePermissionsModalStyles();

  return (
    <Modal.BaseModal
      open={open}
      title="Manage Permissions"
      onClose={onClose}
      sx={styles.dialogPaper}
      dialogSx={styles.dialogContent}
      hideSections
      content={
        <Box sx={styles.content}>
          <FolderDefaultPermissionsBanner />
          <FolderPermissionsTable folderId={folderId} />
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
  content: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: palette.background.default.secondary,
  }),
});
