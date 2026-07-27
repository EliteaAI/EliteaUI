import { memo } from 'react';

import { Box } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';

import BucketAccessTable from './BucketAccessTable';
import DefaultPermissionsBanner from './DefaultPermissionsBanner';

const ManagePermissionsModal = memo(props => {
  const { open, onClose, bucket, projectId } = props;

  const styles = managePermissionsModalStyles();

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
          <DefaultPermissionsBanner />
          <BucketAccessTable
            bucket={bucket}
            projectId={projectId}
            hidePagination
          />
        </Box>
      }
    />
  );
});

ManagePermissionsModal.displayName = 'ManagePermissionsModal';

export default ManagePermissionsModal;

const managePermissionsModalStyles = () => ({
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
    backgroundColor: palette.background.secondary,
  }),
  content: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: palette.background.secondary,
  }),
});
