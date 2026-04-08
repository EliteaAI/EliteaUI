import React, { memo, useCallback, useMemo } from 'react';

import { Box, Button, IconButton, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';

import { useTrackEvent } from '@/GA';
import { FilePreviewCanvasConstants } from '@/[fsd]/features/artifacts/lib/constants';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { DiscardButton } from '@/[fsd]/shared/ui/button';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import DotMenu from '@/components/DotMenu';
import CloseIcon from '@/components/Icons/CloseIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import { languageOptions } from '@/hooks/useCodeMirrorLanguageExtensions';
import useToast from '@/hooks/useToast';

const { AvailableLanguagesEnum } = FilePreviewCanvasConstants;

const plainTextLanguage = { value: AvailableLanguagesEnum.PLAIN_TEXT, label: 'Plain Text' };

const PreviewHeader = memo(props => {
  const {
    file,
    bucket,
    currentLanguage,
    handleLanguageChange,
    detectedLanguage,
    renderMode,
    handleRenderModeChange,
    isMarkdownFile,
    isDataFile,
    isMermaidFile,
    handleSaveChanges,
    hasUnsavedChanges,
    fileContent,
    isSaving,
    isImageFileType,
    isDocxFile,
    onClose,
    onDownload,
    onDelete,
    onDiscard,
    contentToDisplay,
    isChatPage = false,
    canPreview = false,
  } = props;

  const trackEvent = useTrackEvent();

  const handleDownload = useCallback(() => {
    onDownload?.();
  }, [onDownload]);

  const handleDelete = useCallback(() => {
    onDelete?.();
  }, [onDelete]);

  const handleLanguageSelect = useCallback(
    value => {
      handleLanguageChange({
        target: { value },
      });
    },
    [handleLanguageChange],
  );

  const styles = previewHeaderStyles(isChatPage);

  const { toastInfo, toastError } = useToast();

  const availableLanguages = useMemo(() => [plainTextLanguage, ...languageOptions], []);

  const shouldDetectLanguage = useMemo(
    () => fileContent && !isImageFileType && !isDocxFile,
    [fileContent, isDocxFile, isImageFileType],
  );

  const fullPath = useMemo(() => {
    const bucketName = bucket || '';
    const fileName = file?.name || 'File Preview';
    return bucketName ? `${bucketName}/${file.key ?? fileName}` : fileName;
  }, [file, bucket]);

  const canvasTitle = useMemo(() => {
    const parts = fullPath.split('/').filter(Boolean);

    if (parts.length <= 3) {
      return fullPath;
    }

    // Show bucketName/.../lastFolderName/fileName
    const bucketName = parts[0];
    const folderName = parts[parts.length - 2];
    const fileName = parts[parts.length - 1];

    return `${bucketName}/ ... /${folderName}/${fileName}`;
  }, [fullPath]);

  const modeTogglerAvailable = useMemo(
    () => (isMarkdownFile || isDataFile || isMermaidFile) && !isImageFileType && fileContent,
    [fileContent, isDataFile, isImageFileType, isMarkdownFile, isMermaidFile],
  );

  const handleCopyContent = useCallback(() => {
    if (contentToDisplay) {
      navigator.clipboard
        .writeText(contentToDisplay)
        .then(() => {
          trackEvent(GA_EVENT_NAMES.CANVAS_CONTENT_COPIED, {
            [GA_EVENT_PARAMS.CONTENT_TYPE]: isMermaidFile ? 'diagram' : isDataFile ? 'table' : 'file',
            [GA_EVENT_PARAMS.FILE_TYPE]: currentLanguage,
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
          toastInfo('File content copied to clipboard');
        })
        .catch(() => {
          toastError('Failed to copy file content');
        });
    }
  }, [contentToDisplay, trackEvent, isMermaidFile, isDataFile, currentLanguage, toastInfo, toastError]);

  const menuItems = useMemo(
    () =>
      [
        {
          label: 'Copy Content',
          icon: <CopyIcon sx={styles.iconAction} />,
          onClick: handleCopyContent,
          disabled: false,
          show: canPreview && fileContent && !isImageFileType,
        },
        {
          label: 'Download',
          icon: <DownloadIcon sx={styles.iconAction} />,
          onClick: handleDownload,
          disabled: false,
          show: true,
        },
        {
          label: 'Delete',
          icon: <DeleteIcon sx={styles.iconAction} />,
          onClick: handleDelete,
          disabled: isChatPage,
          show: true,
        },
      ].filter(item => item.show),
    [
      canPreview,
      fileContent,
      isImageFileType,
      handleCopyContent,
      handleDownload,
      isChatPage,
      handleDelete,
      styles.iconAction,
    ],
  );

  return (
    <Box sx={styles.canvasHeader}>
      <Box sx={styles.row}>
        <Tooltip title="Close">
          <IconButton
            onClick={onClose}
            sx={styles.actionButton}
            aria-label="Close preview"
          >
            <CloseIcon sx={styles.iconClose} />
          </IconButton>
        </Tooltip>

        <Box sx={styles.canvasTitle}>
          <Tooltip
            title={fullPath}
            enterDelay={500}
            arrow
          >
            <Typography
              variant="headingSmall"
              sx={styles.titleText}
            >
              {canvasTitle}
            </Typography>
          </Tooltip>
        </Box>

        <Box sx={styles.canvasControlsWrapper}>
          {canPreview && (
            <>
              <Button
                variant="elitea"
                color="primary"
                onClick={handleSaveChanges}
                disableRipple
                disabled={isSaving || !hasUnsavedChanges}
              >
                Save
              </Button>
              <DiscardButton
                onDiscard={onDiscard}
                disabled={isSaving || !hasUnsavedChanges}
                discarding={false}
              />
            </>
          )}

          <Box
            sx={{
              button: ({ palette }) => ({
                background: palette.background.userInputBackgroundActive,

                ':hover': {
                  background: palette.background.button.secondary.hover,
                },
              }),
            }}
          >
            <DotMenu
              id="file-preview-overflow-menu"
              slotProps={styles.dotMenuSlotProps}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {menuItems}
            </DotMenu>
          </Box>
        </Box>
      </Box>

      {(modeTogglerAvailable || shouldDetectLanguage) && (
        <Box sx={styles.row}>
          {modeTogglerAvailable && (
            <ToggleButtonGroup
              size="small"
              value={renderMode}
              onChange={handleRenderModeChange}
              exclusive={true}
              aria-label="Render Mode Toggle"
              sx={{ mr: 1 }}
            >
              <ToggleButton
                value="rendered"
                variant="elitea"
                sx={styles.toggleLeftButton}
              >
                {isMarkdownFile ? 'Preview' : isDataFile ? 'Table' : 'Diagram'}
              </ToggleButton>
              <ToggleButton
                variant="elitea"
                value="code"
                sx={styles.toggleRightButton}
              >
                Raw
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          {shouldDetectLanguage && (
            <Box>
              <SingleSelect
                value={currentLanguage}
                onValueChange={handleLanguageSelect}
                options={availableLanguages.map(lang => ({
                  ...lang,
                  label: `${lang.label}${lang.value === detectedLanguage ? ' (detected)' : ''}`,
                }))}
                displayEmpty
                sx={styles.languageSelect}
                showBorder={false}
                customMenuProps={{ sx: styles.languageSelectMenuSx }}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
});

PreviewHeader.displayName = 'PreviewHeader';

/** @type {MuiSx} */
const previewHeaderStyles = isChatPage => ({
  canvasHeader: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: palette.background.userInputBackground,
    borderBottom: `1px solid ${palette.border.lines}`,
  }),

  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '.75rem 1.25rem',
    minHeight: isChatPage ? '3.25rem' : '3.6rem',
    height: isChatPage ? '3.25rem' : '3.6rem',
    gap: '1rem',

    ':last-of-type': ({ palette }) => ({
      borderTop: `1px solid ${palette.border.lines}`,
      minHeight: isChatPage ? '3rem' : '2.6rem',
      height: isChatPage ? '3rem' : '2.6rem',
      justifyContent: 'flex-start',
    }),

    // override when it's the only row AND not chat page
    '&:only-child': {
      minHeight: !isChatPage ? '3.6rem' : '3rem',
      height: !isChatPage ? '3.6rem' : '3rem',
      borderTop: 'none',
      justifyContent: 'space-between',
    },
  },

  actionButton: ({ palette }) => ({
    padding: '0.25rem',
    marginRight: '0.5rem',
    color: palette.text.secondary,

    '&:hover': {
      backgroundColor: palette.action.hover,
      color: palette.text.primary,
    },
  }),
  iconClose: {
    fontSize: '1.25rem',
    width: '1.25rem',
    height: '1.25rem',
  },

  canvasTitle: { display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 },

  titleText: ({ palette }) => ({
    color: palette.text.secondary,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),

  canvasControlsWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mt: 0.35,
  },

  languageSelect: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '.6875rem',
    minWidth: '5rem',

    '& .MuiInput-underline:before': {
      borderBottom: 'none !important',
    },
    '& .MuiInput-underline:after': {
      borderBottom: 'none !important',
    },
    '& .MuiInput-underline:hover:before': {
      borderBottom: 'none !important',
    },
    '&.Mui-focused .MuiInput-underline:after': {
      borderBottom: 'none !important',
    },

    '.Mui-Paper-root': {
      backgroundColor: 'red',
    },
  }),

  languageSelectMenuSx: {
    marginTop: isChatPage ? '1rem' : '0.5rem',
  },

  toggleLeftButton: {
    borderRadius: '0.5rem 0 0 0.5rem',
  },

  toggleRightButton: {
    borderRadius: '0 0.5rem 0.5rem 0',
  },

  dotMenuSlotProps: ({ palette }) => ({
    ListItemText: {
      sx: { color: palette.text.secondary },
      primaryTypographyProps: { variant: 'bodyMedium' },
    },
    ListItemIcon: {
      sx: {
        minWidth: '1rem !important',
        marginRight: '.75rem',
      },
    },
  }),

  iconAction: ({ palette }) => ({
    fontSize: '0.875rem',
    fill: palette.icon.fill.default,
  }),

  iconButtonAction: {
    padding: '.25rem',
  },
});

export default PreviewHeader;
