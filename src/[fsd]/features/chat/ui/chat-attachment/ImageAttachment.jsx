import { memo, useCallback, useEffect, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import ImportIcon from '@/assets/import-icon.svg?react';
import {
  downloadAttachmentImage,
  getAttachmentName,
  getImageSource,
  hasUnresolvedFilepath,
} from '@/common/attachmentUtils';
import { downloadFileFromArtifact } from '@/common/utils';
import ViewImageAttachmentModal from '@/components/Chat/ViewImageAttachmentModal';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const ImageAttachment = memo(props => {
  const { attachment = {}, id, onRemoveAttachment, showThumbnail = true } = props;
  const styles = imageAttachmentStyles();

  const { toastError } = useToast();
  const theme = useTheme();
  const projectId = useSelectedProjectId();
  const [openModal, setOpenModal] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [needToRemoveFromStorage, setNeedToRemoveFromStorage] = useState(false);

  // For old custom bucket attachments, use filepath (/{bucket}/{filename})
  // For new attachments, use name
  const fileName = attachment.item_details?.filepath || attachment.item_details?.name || attachment.name;
  const imageSource = getImageSource(attachment);
  const isPending = !imageSource && hasUnresolvedFilepath(attachment);
  const attachmentName = getAttachmentName(attachment);

  const toggleModal = useCallback(() => {
    setOpenModal(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape' && openModal) {
        toggleModal();
      }
    };

    if (openModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openModal, toggleModal]);

  const onClickRemove = useCallback(event => {
    event.stopPropagation();
    setOpenAlert(true);
  }, []);

  const onClickDown = useCallback(
    event => {
      event.stopPropagation();

      const filepath = attachment.item_details?.filepath;
      const bucket = attachment.item_details?.bucket;

      if (filepath && bucket !== '__undefined__') {
        // Download original file from artifact storage — this is the only source for the original.
        // Do NOT fall back to base64/thumbnail data on failure.
        downloadFileFromArtifact({
          projectId,
          filepath,
          handleError: () => toastError('Failed to download image from storage'),
        });
      } else {
        // Legacy attachments: original was stored as base64 in content (pre-OOM-fix format)
        downloadAttachmentImage(attachment, toastError);
      }
    },
    [attachment, projectId, toastError],
  );

  const onCloseAlert = useCallback(event => {
    event?.stopPropagation();
    setOpenAlert(false);
  }, []);

  const onConfirmDelete = useCallback(
    event => {
      event?.stopPropagation();
      onRemoveAttachment?.(fileName, needToRemoveFromStorage);
      setOpenAlert(false);
    },
    [fileName, needToRemoveFromStorage, onRemoveAttachment],
  );

  const handleCheckboxChange = useCallback((_, value) => {
    setNeedToRemoveFromStorage(value);
  }, []);

  const handleImageError = useCallback(() => {
    toastError('Failed to load image');
  }, [toastError]);

  if (!imageSource && !isPending) {
    return null;
  }

  return (
    <>
      <Box sx={styles.mainContainer}>
        {showThumbnail && imageSource ? (
          <Box
            component="img"
            src={imageSource}
            alt={attachmentName}
            sx={styles.image}
            onError={handleImageError}
          />
        ) : (
          !imageSource && (
            <Typography
              variant="bodySmall"
              sx={styles.pendingLabel}
            >
              {attachmentName}
            </Typography>
          )
        )}

        {/* Action buttons overlay */}
        <Box
          className="attachActionButtons"
          onClick={toggleModal}
        >
          <IconButton
            variant="elitea"
            color="tertiary"
            onClick={onClickDown}
            sx={styles.iconButton}
            aria-label="Download image"
          >
            <ImportIcon
              sx={styles.icon}
              fill={theme.palette.icon.fill.secondary}
            />
          </IconButton>
          <IconButton
            variant="elitea"
            color="tertiary"
            onClick={onClickRemove}
            sx={styles.iconButton}
            aria-label="Remove attachment"
          >
            <DeleteIcon
              sx={styles.icon}
              fill={theme.palette.icon.fill.secondary}
            />
          </IconButton>
        </Box>
      </Box>
      <ViewImageAttachmentModal
        open={openModal}
        id={id}
        attachment={attachment}
        onClose={toggleModal}
        onRemoveAttachment={onRemoveAttachment}
      />
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
                onChange={handleCheckboxChange}
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
});

/** @type {MuiSx} */
const imageAttachmentStyles = () => ({
  mainContainer: ({ palette }) => ({
    width: '100%',
    height: '9.125rem',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    position: 'relative',
    background: palette.background.button.default,
    '& .attachActionButtons': {
      visibility: 'hidden',
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '0.5rem',
      gap: '0.75rem',
      background: palette.background.imageAttachment,
    },
    '&:hover .attachActionButtons': {
      visibility: 'visible',
    },
  }),
  image: {
    width: '100%',
    height: 'auto',
    objectFit: 'scale-down',
    maxHeight: '100%',
  },
  iconButton: {
    marginLeft: '0px',
  },
  icon: {
    fontSize: '1rem',
  },
  pendingLabel: ({ palette }) => ({
    color: palette.text.secondary,
    textAlign: 'center',
    padding: '0.5rem',
    wordBreak: 'break-word',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    pointerEvents: 'none',
  }),
  checkbox: {
    padding: '0px',
    marginTop: '0.3125rem',
  },
  extraContentBox: {
    boxSizing: 'border-box',
    marginTop: '-0.5rem',
    width: '34.5rem',
    flexDirection: 'row',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
});

ImageAttachment.displayName = 'ImageAttachment';

export default ImageAttachment;
