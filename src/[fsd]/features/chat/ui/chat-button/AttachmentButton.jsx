import React, { forwardRef, memo, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { Box, IconButton, Tooltip } from '@mui/material';

import AttachIcon from '@/assets/attach-icon.svg?react';
import {
  formatFileSize,
  getRemainingAttachmentCapacity,
  isAtMaxAttachmentCapacity,
  validateAttachmentFiles,
} from '@/common/attachmentValidationUtils';
import { ATTACHMENT_LIMITS } from '@/common/constants';
import { useAllowedExtensions, useAllowedFileTypes, useFileTypes } from '@/hooks/useFileTypes';
import useToast from '@/hooks/useToast';

/**
 * Supports dynamic file types from backend API.
 * Accepts limits prop from useChatConfig for configurable attachment constraints.
 */
const AttachmentButton = forwardRef((props, ref) => {
  const allowedExtensions = useAllowedExtensions();
  const allowedFileTypes = useAllowedFileTypes();
  const { isLoading } = useFileTypes();

  const {
    id = 'file-upload-input' + new Date().getTime(),
    multiple = true,
    accept = allowedExtensions.length > 0 ? allowedExtensions.join(',') : '', // Empty if no data
    onAttachFiles,
    disableAttachments = false,
    limits = ATTACHMENT_LIMITS,
    maxFileSize = limits.DEFAULT_MAX_FILE_SIZE,
    attachments = [],
  } = props;

  const buttonRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const { toastInfo, toastError, toastWarning } = useToast();

  /** Opens the native file explorer directly. */
  const handleClickAttach = () => {
    if (isAtMaxAttachmentCapacity(attachments, limits)) {
      toastWarning(
        `You've reached the ${limits.MAX_ATTACHMENTS}-file limit. Only the first ${limits.MAX_ATTACHMENTS} will be processed.`,
      );
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Helper function to display error messages based on validation results
  const displayErrorMessages = ({
    exceedsAttachmentLimit,
    exceedsTotalSizeLimit,
    exceedsImageLimit,
    hasInvalidTypes,
    hasOversizedImages,
    errors,
    invalidTypeFiles,
    oversizedImageFiles,
  }) => {
    if (exceedsAttachmentLimit) {
      toastWarning(
        `You've reached the ${limits.MAX_ATTACHMENTS}-file limit. Only the first ${limits.MAX_ATTACHMENTS} will be processed.`,
      );
      return;
    }

    if (exceedsTotalSizeLimit) {
      toastInfo(`Total size limit of ${formatFileSize(limits.MAX_TOTAL_SIZE)} would be exceeded`);
      return;
    }

    if (hasOversizedImages && oversizedImageFiles.length > 0) {
      toastWarning(
        `Image(s) exceed the ${formatFileSize(limits.MAX_IMAGE_FILE_SIZE)} limit: ${oversizedImageFiles.join(', ')}`,
      );
    }

    if (exceedsImageLimit) {
      toastWarning(`Maximum ${limits.MAX_IMAGE_ATTACHMENTS} image attachments allowed`);
    }

    if (hasInvalidTypes && invalidTypeFiles.length > 0) {
      const allowedExts =
        allowedExtensions.length > 0 ? allowedExtensions.join(', ') : 'supported file types';
      toastInfo(
        `Invalid file types detected: ${invalidTypeFiles.join(', ')}. Only ${allowedExts} files are allowed.`,
      );
      return;
    }

    // Show individual file errors if any (excluding duplicate messages since renaming is silent)
    const nonDuplicateErrors = errors.filter(err => !err.includes('already attached'));
    if (nonDuplicateErrors.length > 0) {
      toastInfo(nonDuplicateErrors.join('\n'));
    }
  };

  // Enhanced file change handler using validation utilities
  const handleFileChange = async (eventOrFiles, isForDragDrop) => {
    // Handle both event objects and direct file arrays
    const files = Array.isArray(eventOrFiles)
      ? eventOrFiles
      : !isForDragDrop
        ? eventOrFiles?.target?.files
        : eventOrFiles?.dataTransfer?.files;

    setIsProcessing(true);

    try {
      // Early return for no files
      if (!files || files.length === 0) {
        onAttachFiles?.([]);
        return;
      }

      // Validate files using utility function
      const validationResult = validateAttachmentFiles(
        files,
        attachments,
        maxFileSize,
        allowedFileTypes,
        allowedExtensions,
        limits,
      );
      const { validFiles, errors, exceedsAttachmentLimit } = validationResult;

      // Handle validation errors or attachment limit exceeded
      if (errors.length > 0 || exceedsAttachmentLimit || validationResult.exceedsImageLimit) {
        displayErrorMessages(validationResult);

        // Early return if no valid files to process
        if (validFiles.length === 0) {
          onAttachFiles?.([]);
          return;
        }
      }

      // Early return if no valid files after validation
      if (validFiles.length === 0) {
        onAttachFiles?.([]);
        return;
      }

      // Process only the valid files
      await onAttachFiles?.(multiple ? validFiles : validFiles[0]);
    } catch (error) {
      toastError(`Error processing files: ${error.message || 'Unknown error occurred'}`);
      onAttachFiles?.([]);
    } finally {
      setIsProcessing(false);

      const isFileInputEvent = !Array.isArray(eventOrFiles) && eventOrFiles && eventOrFiles.target;
      isFileInputEvent && (eventOrFiles.target.value = '');
    }
  };

  useImperativeHandle(ref, () => ({
    onDrop: event => {
      event.preventDefault();
      handleFileChange(event, true);
    },
  }));

  // Get capacity information using utility functions
  const { remainingAttachments, isAtMaxCapacity, isAtMaxSize } = getRemainingAttachmentCapacity(
    attachments,
    limits,
  );

  const noFileTypesAvailable = allowedExtensions.length === 0;
  const isDisabled =
    disableAttachments || isProcessing || isAtMaxCapacity || isAtMaxSize || isLoading || noFileTypesAvailable;

  const processStatus = useMemo(() => {
    if (isProcessing) return 'Processing...';
    if (isAtMaxCapacity) return `Max ${limits.MAX_ATTACHMENTS} attachments`;
    if (isAtMaxSize) return 'Size limit reached';

    return `Attach files (${remainingAttachments} left)`;
  }, [isProcessing, isAtMaxCapacity, isAtMaxSize, remainingAttachments, limits.MAX_ATTACHMENTS]);

  return (
    <Tooltip
      title={processStatus}
      placement="top"
    >
      <Box
        component="span"
        sx={styles.tooltipWrapper}
      >
        <IconButton
          ref={buttonRef}
          variant="alita"
          color="secondary"
          aria-label="attach files"
          onClick={handleClickAttach}
          disabled={isDisabled}
          sx={styles.iconButton}
        >
          <Box
            hidden
            component="input"
            ref={fileInputRef}
            type="file"
            id={id}
            multiple={multiple}
            onChange={event => handleFileChange(event, false)}
            accept={accept}
          />
          <Box
            component={AttachIcon}
            sx={styles.attachIcon}
          />
        </IconButton>
      </Box>
    </Tooltip>
  );
});

AttachmentButton.displayName = 'AttachmentButton';

/** @type {MuiSx} */
const styles = {
  tooltipWrapper: {
    display: 'inline-flex',
  },
  iconButton: {
    marginLeft: '0rem',
  },
  attachIcon: {
    fontSize: '1rem',
  },
};

export default memo(AttachmentButton);
