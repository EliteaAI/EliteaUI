import { useCallback, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Checkbox, Modal } from '@/[fsd]/shared/ui';
import TypographyWithConditionalTooltip from '@/[fsd]/shared/ui/tooltip/TypographyWithConditionalTooltip';
import AttachedFileIcon from '@/assets/attached-file-icon.svg?react';
import ImportIcon from '@/assets/import-icon.svg?react';
import { downloadAttachmentFile, downloadAttachmentImage, getAttachmentName } from '@/common/attachmentUtils';
import { downloadFileFromArtifact, parseFilepath } from '@/common/utils';
import OpenEyeIcon from '@/components/Icons/OpenEyeIcon';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import DeleteIcon from '../Icons/DeleteIcon';

const NormalAttachment = ({
  attachment = {},
  onRemoveAttachment,
  sx = {},
  preview = false,
  onOpenArtifactPreview,
}) => {
  const theme = useTheme();

  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { isSmallWindow } = useIsSmallWindow();

  // For old custom bucket attachments, use filepath (/{bucket}/{filename})
  // For new attachments, use name
  const fileName = attachment.item_details?.filepath || attachment.item_details?.name || attachment.name;

  const [isHovering, setIsHovering] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [needToRemoveFromStorage, setNeedToRemoveFromStorage] = useState(false);

  const styles = normalAttachmentStyles({ isSmallWindow });

  const onMouseEnter = () => {
    setIsHovering(true);
  };

  const onMouseLeave = () => {
    setIsHovering(false);
  };

  const onClickRemove = event => {
    event.stopPropagation();
    setOpenAlert(true);
  };

  const onClickDown = event => {
    event.stopPropagation();

    const filepath = attachment.item_details?.filepath;
    const bucket = attachment.item_details?.bucket;

    if (filepath && bucket !== '__undefined__') {
      // Download original file from artifact storage.
      // For image attachments, do NOT fall back to base64 — it may be a thumbnail, not the original.
      downloadFileFromArtifact({
        projectId,
        filepath,
        handleError: () => {
          if (attachment.item_details?.attachment_type !== 'image') {
            // Non-image legacy fallback: base64 content is the original
            downloadAttachmentFile(attachment, toastError);
          } else {
            toastError('Failed to download image from storage');
          }
        },
      });
    } else {
      // Legacy attachments: original was stored as base64 in content (pre-OOM-fix format)
      if (attachment.item_details?.attachment_type === 'image') {
        downloadAttachmentImage(attachment, toastError);
      } else {
        downloadAttachmentFile(attachment, toastError);
      }
    }
  };

  const onClose = event => {
    event?.stopPropagation();
    setOpenAlert(false);
  };

  const onConfirm = event => {
    event?.stopPropagation();
    onRemoveAttachment?.(fileName, needToRemoveFromStorage);
    setOpenAlert(false);
  };

  const attachmentName = getAttachmentName(attachment);

  const onPreviewFile = useCallback(() => {
    const filepath = attachment.item_details?.filepath;
    let bucket, filename;

    // Parse filepath if available
    if (filepath) {
      try {
        const parsed = parseFilepath(filepath);
        bucket = parsed.bucket;
        filename = parsed.filename;
      } catch {
        bucket = attachment.item_details?.bucket;
        filename = attachment.item_details?.name;
      }
    } else {
      bucket = attachment.item_details?.bucket;
      filename = attachment.item_details?.name;
    }

    const artifactData = {
      filepath: filepath || `/${bucket}/${filename}`,
      id: filename,
      isUploading: false,
      modified: '2026-01-23T10:46:34.963075',
      name: filename,
      size: attachment.item_details?.file_size,
      type: attachment.item_details?.attachment_type,
      bucket,
    };
    onOpenArtifactPreview?.(artifactData);
  }, [attachment, onOpenArtifactPreview]);

  // Don't render if no valid attachment
  if (!attachmentName) {
    return null;
  }

  return (
    <>
      <Box
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={[styles.mainContainer, sx]}
      >
        <Box
          width="1rem"
          height="1rem"
        >
          <AttachedFileIcon color={theme.palette.icon.fill.default} />
        </Box>

        <Box sx={styles.contentContainer}>
          <TypographyWithConditionalTooltip
            title={attachmentName}
            placement="top"
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.fileName}
          >
            {attachmentName}
          </TypographyWithConditionalTooltip>
        </Box>

        <Box
          className="attachActionButtons"
          display={isHovering ? 'flex' : 'none'}
          alignItems="center"
          justifyContent="flex-end"
          gap=".15rem"
        >
          {preview && (
            <Tooltip
              title="View/Edit file"
              placement="top"
            >
              <IconButton
                variant="alita"
                color="tertiary"
                onClick={onPreviewFile}
                sx={styles.iconButton}
                aria-label="Preview attachment"
              >
                <OpenEyeIcon
                  sx={styles.icon}
                  fill={theme.palette.icon.fill.default}
                />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            variant="alita"
            color="tertiary"
            onClick={onClickDown}
            sx={styles.iconButton}
            aria-label="Download attachment"
          >
            <ImportIcon
              sx={styles.icon}
              fill={theme.palette.icon.fill.default}
            />
          </IconButton>
          <IconButton
            variant="alita"
            color="tertiary"
            onClick={onClickRemove}
            sx={styles.iconButton}
            aria-label="Remove attachment"
          >
            <DeleteIcon
              sx={styles.icon}
              fill={theme.palette.icon.fill.default}
            />
          </IconButton>
        </Box>
      </Box>
      <Modal.DeleteEntityModal
        name={fileName}
        open={openAlert}
        onClose={onClose}
        onCancel={onClose}
        onConfirm={onConfirm}
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

/** @type {MuiSx} */
const normalAttachmentStyles = () => ({
  mainContainer: ({ palette }) => ({
    display: 'flex',
    width: '12.125rem',
    height: '2.25rem',
    borderRadius: '.5rem',
    overflow: 'hidden',
    position: 'relative',
    gap: '.75rem',
    padding: '.375rem .75rem',
    alignItems: 'center',
    background: palette.background.button.default,
  }),
  contentContainer: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  fileName: {
    width: '100%',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 'normal',
  },
  iconButton: {
    marginLeft: '0rem',
  },
  icon: {
    fontSize: '1rem',
  },
  checkbox: {
    padding: '0rem',
    marginTop: '.3125rem',
  },
  extraContentBox: {
    marginTop: '-0.5rem',
    boxSizing: 'border-box',
    width: '34.5rem',
    flexDirection: 'row',
    display: 'flex',
    gap: '.5rem',
    alignItems: 'flex-start',
  },
});

export default NormalAttachment;
