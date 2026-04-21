import { memo, useEffect, useRef, useState } from 'react';

import { Box, Button, Dialog, DialogContent, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import { downloadAttachmentImage, getAttachmentName, getImageSource } from '@/common/attachmentUtils';
import { downloadFileFromArtifact, fetchArtifactBlobUrl } from '@/common/utils';
import CloseIcon from '@/components/Icons/CloseIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const ViewImageAttachmentModal = memo(props => {
  const { open, onRemoveAttachment, onClose, attachment } = props;
  const { toastError } = useToast();
  const theme = useTheme();
  const projectId = useSelectedProjectId();

  // For old custom bucket attachments, use filepath (/{bucket}/{filename})
  // For new attachments, use name
  const fileName = attachment.item_details?.filepath || attachment.item_details?.name || attachment.name;
  const imageSource = getImageSource(attachment);
  const attachmentName = getAttachmentName(attachment);
  const attachmentFilepath = attachment?.item_details?.filepath;
  const attachmentBucket = attachment?.item_details?.bucket;

  const [openAlert, setOpenAlert] = useState(false);
  const [needToRemoveFromStorage, setNeedToRemoveFromStorage] = useState(false);
  const [fullResSource, setFullResSource] = useState(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setFullResSource(null);
      return;
    }
    if (!attachmentFilepath || attachmentBucket === '__undefined__') return;

    let cancelled = false;
    (async () => {
      const objectUrl = await fetchArtifactBlobUrl({ projectId, filepath: attachmentFilepath });
      if (cancelled || !objectUrl) return;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = objectUrl;
      setFullResSource(objectUrl);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, attachmentFilepath, attachmentBucket, projectId]);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const onClickRemove = () => setOpenAlert(true);

  const onCloseAlert = event => {
    event?.stopPropagation();
    setOpenAlert(false);
  };

  const onConfirmDelete = event => {
    event?.stopPropagation();
    onRemoveAttachment?.(fileName, needToRemoveFromStorage);
    setOpenAlert(false);
    onClose?.();
  };

  const onClickDown = event => {
    event.stopPropagation();
    const filepath = attachment.item_details?.filepath;
    const bucket = attachment.item_details?.bucket;
    if (filepath && bucket !== '__undefined__') {
      downloadFileFromArtifact({
        projectId,
        filepath,
        handleError: () => toastError('Failed to download image from storage'),
      });
    } else {
      downloadAttachmentImage(attachment, toastError);
    }
  };

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  if (!imageSource) return null;

  return (
    <>
      <Dialog
        fullWidth
        open={open}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        slotProps={{ paper: { sx: styles.dialogPaper } }}
      >
        <Box sx={styles.headerContainer}>
          <Typography
            color="text.secondary"
            variant="headingMedium"
          >
            {attachmentName}
          </Typography>
          <Box sx={styles.actionsContainer}>
            <Button
              variant="icon"
              color="secondary"
              onClick={onClickDown}
              aria-label="Download image"
              sx={styles.iconButton}
            >
              <DownloadIcon
                sx={styles.icon}
                fill={theme.palette.icon.fill.secondary}
              />
            </Button>
            <Button
              variant="icon"
              color="secondary"
              onClick={onClickRemove}
              aria-label="Remove attachment"
              sx={styles.iconButton}
            >
              <DeleteIcon
                sx={styles.icon}
                fill={theme.palette.icon.fill.secondary}
              />
            </Button>
            <Button
              variant="tertiary"
              onClick={onClose}
              aria-label="Close modal"
              sx={styles.closeButton}
            >
              <CloseIcon
                fill={theme.palette.icon.fill.default}
                sx={styles.closeIcon}
              />
            </Button>
          </Box>
        </Box>

        <DialogContent sx={styles.dialogContent}>
          <img
            src={fullResSource ?? imageSource}
            width="100%"
            height="100%"
            alt={attachmentName}
            style={{ objectFit: 'contain' }}
            onError={() => toastError('Failed to load image')}
          />
        </DialogContent>
      </Dialog>
      <Modal.DeleteEntityModal
        name={fileName}
        open={openAlert}
        onClose={onCloseAlert}
        onCancel={onCloseAlert}
        onConfirm={onConfirmDelete}
        shouldRequestInputName={false}
        extraContent={
          <Box sx={styles.extraContentBox}>
            <Checkbox.BaseCheckbox
              checked={needToRemoveFromStorage}
              sx={styles.checkbox}
              onChange={(_, value) => setNeedToRemoveFromStorage(value)}
            />
            <Typography
              variant="bodyMedium"
              color="text.secondary"
            >
              Also delete from attachment storage
            </Typography>
          </Box>
        }
      />
    </>
  );
});

ViewImageAttachmentModal.displayName = 'ViewImageAttachmentModal';

/** @type {MuiSx} */
const styles = {
  dialogPaper: ({ palette }) => ({
    background: palette.background.tabPanel,
    borderRadius: '1rem',
    border: `1px solid ${palette.border.lines}`,
    boxShadow: palette.boxShadow.default,
    marginTop: 0,
    position: 'absolute',
    top: '4rem',
    maxWidth: '47.5625rem',
  }),
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    width: '100%',
    boxSizing: 'border-box',
    padding: '1rem 1.5rem',
    height: '3.75rem',
  },
  closeButton: {
    minWidth: '1.75rem !important',
    padding: '0 !important',
    height: '1.75rem',
    display: 'flex',
    borderRadius: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  closeIcon: {
    cursor: 'pointer',
    fontSize: '1.031rem',
  },
  dialogContent: ({ palette }) => ({
    background: palette.background.tabPanel,
    borderBottom: `1px solid ${palette.border.table}`,
    borderTop: `1px solid ${palette.border.table}`,
    width: '100%',
    padding: '0.9375rem 2.5rem',
    boxSizing: 'border-box',
    height: '25.5625rem',
  }),
  actionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '.75rem',
  },
  iconButton: {
    marginLeft: 0,
  },
  icon: {
    fontSize: '1rem',
  },
  checkbox: {
    padding: 0,
    marginTop: '0.3125rem',
  },
  extraContentBox: {
    marginTop: '-0.5rem',
    boxSizing: 'border-box',
    width: '34.5rem',
    flexDirection: 'row',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
};

export default ViewImageAttachmentModal;
