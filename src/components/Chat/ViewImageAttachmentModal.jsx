import { useEffect, useMemo, useRef, useState } from 'react';

import { Box, Dialog, DialogContent, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import ImportIcon from '@/assets/import-icon.svg?react';
import { downloadAttachmentImage, getAttachmentName, getImageSource } from '@/common/attachmentUtils';
import { downloadFileFromArtifact, fetchArtifactBlobUrl } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import CloseIcon from '../Icons/CloseIcon';
import DeleteIcon from '../Icons/DeleteIcon';

const ViewImageAttachmentModal = ({ open, onRemoveAttachment, onClose, attachment }) => {
  const { toastError } = useToast();
  const theme = useTheme();
  const projectId = useSelectedProjectId();
  const styles = useMemo(() => componentStyles(theme), [theme]);
  // For old custom bucket attachments, use filepath (/{bucket}/{filename})
  // For new attachments, use name
  const fileName = attachment.item_details?.filepath || attachment.item_details?.name || attachment.name;
  const [openAlert, setOpenAlert] = useState(false);
  const [needToRemoveFromStorage, setNeedToRemoveFromStorage] = useState(false);

  const onClickRemove = () => {
    setOpenAlert(true);
  };

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

  const imageSource = getImageSource(attachment);
  const attachmentName = getAttachmentName(attachment);
  const [fullResSource, setFullResSource] = useState(null);
  const blobUrlRef = useRef(null);
  const attachmentFilepath = attachment?.item_details?.filepath;
  const attachmentBucket = attachment?.item_details?.bucket;

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

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  // Don't render if no valid image source
  if (!imageSource) {
    return null;
  }

  return (
    <>
      <Dialog
        fullWidth
        open={open}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        PaperProps={{
          sx: styles.dialogPaper,
        }}
      >
        <Box sx={styles.headerContainer}>
          <Typography
            color="text.secondary"
            variant="headingMedium"
          >
            {attachmentName}
          </Typography>
          <IconButton
            variant="alita"
            color="tertiary"
            onClick={onClose}
            aria-label="Close modal"
            sx={styles.closeButton}
          >
            <CloseIcon
              fill={theme.palette.icon.fill.default}
              sx={styles.closeIcon}
            />
          </IconButton>
        </Box>

        <DialogContent sx={styles.dialogContent}>
          <img
            src={fullResSource ?? imageSource}
            width="100%"
            height="100%"
            alt={attachmentName}
            style={{ objectFit: 'contain' }}
            onError={() => {
              toastError('Failed to load image');
            }}
          />
        </DialogContent>

        <Box sx={styles.actionsContainer}>
          <IconButton
            variant="alita"
            color="secondary"
            onClick={onClickDown}
            aria-label="Download image"
            sx={styles.iconButton}
          >
            <ImportIcon
              sx={styles.icon}
              fill={theme.palette.icon.fill.secondary}
            />
          </IconButton>
          <IconButton
            variant="alita"
            color="secondary"
            onClick={onClickRemove}
            aria-label="Remove attachment"
            sx={styles.iconButton}
          >
            <DeleteIcon
              sx={styles.icon}
              fill={theme.palette.icon.fill.secondary}
            />
          </IconButton>
        </Box>
      </Dialog>
      <Modal.DeleteEntityModal
        name={fileName}
        open={openAlert}
        onClose={onCloseAlert}
        onCancel={onCloseAlert}
        onConfirm={onConfirmDelete}
        shouldRequestInputName={false}
        extraContent={
          <>
            <Box sx={styles.extraContentBox}>
              <Checkbox.BaseCheckbox
                checked={needToRemoveFromStorage}
                sx={styles.checkbox}
                onChange={(_, value) => {
                  setNeedToRemoveFromStorage(value);
                }}
              />
              <Typography
                variant="bodyMedium"
                color="text.secondary"
              >
                Also delete from attachment storage
              </Typography>
            </Box>
          </>
        }
      />
    </>
  );
};

// Component styles
const componentStyles = theme => ({
  dialogPaper: {
    background: theme.palette.background.tabPanel,
    borderRadius: '16px',
    border: `1px solid ${theme.palette.border.lines}`,
    boxShadow: theme.palette.boxShadow.default,
    marginTop: 0,
    position: 'absolute',
    top: 64,
    maxWidth: '89.5%',
    [theme.breakpoints.up('prompt_list_xxl')]: {
      maxWidth: '2112px',
    },
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box',
    padding: '32px 40px 16px 40px',
  },
  closeButton: {
    minWidth: '28px !important',
    padding: '0px 0px !important',
    height: '28px',
    display: 'flex',
    borderRadius: '16px',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  closeIcon: {
    cursor: 'pointer',
    fontSize: '16.5px',
  },
  dialogContent: {
    background: theme.palette.background.alitaDefault,
    borderBottom: `1px solid ${theme.palette.border.table}`,
    borderTop: `1px solid ${theme.palette.border.table}`,
    width: '100%',
    padding: '15px 40px',
    boxSizing: 'border-box',
    height: 'calc(100vh - 370px)',
  },
  actionsContainer: {
    height: '80px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0px 40px',
    gap: '16px',
  },
  iconButton: {
    marginLeft: '0px',
  },
  icon: {
    fontSize: '16px',
  },
  checkbox: {
    padding: '0px',
    marginTop: '5px',
  },
  extraContentBox: {
    marginTop: '-8px',
    boxSizing: 'border-box',
    width: '552px',
    flexDirection: 'row',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
});

export default ViewImageAttachmentModal;
