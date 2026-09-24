import React, { memo, useCallback, useMemo } from 'react';

import { Box, Divider, ToggleButton, ToggleButtonGroup, Tooltip, Typography, useTheme } from '@mui/material';

import { useTrackEvent } from '@/GA';
import { FilePreviewCanvasConstants } from '@/[fsd]/features/artifacts/lib/constants';
import { AnalyticConstants } from '@/[fsd]/shared/lib/constants';
import { CodeMirrorEditorHelpers } from '@/[fsd]/shared/lib/helpers';
import { Button, Select } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import DotMenu from '@/components/DotMenu';
import CloseIcon from '@/components/Icons/CloseIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import EditPenIcon from '@/components/Icons/EditPenIcon';
import useToast from '@/hooks/useToast';

const { GA_EVENT_NAMES, GA_EVENT_PARAMS } = AnalyticConstants;

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
    isHtmlFile,
    isMdxFile,
    handleSaveChanges,
    hasUnsavedChanges,
    fileContent,
    isSaving,
    isImageFileType,
    isDocxFile,
    onClose,
    onDownload,
    onDelete,
    onRename,
    onDiscard,
    contentToDisplay,
    isChatPage = false,
    canPreview = false,
  } = props;

  const trackEvent = useTrackEvent();
  const theme = useTheme();

  const handleDownload = useCallback(() => {
    onDownload?.();
  }, [onDownload]);

  const handleDelete = useCallback(() => {
    onDelete?.();
  }, [onDelete]);

  const handleRename = useCallback(() => {
    onRename?.();
  }, [onRename]);

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

  const availableLanguages = useMemo(
    () => [plainTextLanguage, ...CodeMirrorEditorHelpers.languageOptions],
    [],
  );

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
    () =>
      (isMarkdownFile || isDataFile || isMermaidFile || isHtmlFile || isMdxFile) &&
      !isImageFileType &&
      fileContent,
    [fileContent, isDataFile, isImageFileType, isMarkdownFile, isMermaidFile, isHtmlFile, isMdxFile],
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
          toastInfo('The file content has been copied to the clipboard.');
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
          key: 'artifacts-preview-copy-content',
          label: 'Copy Content',
          icon: <CopyIcon sx={styles.iconAction} />,
          onClick: handleCopyContent,
          disabled: false,
          show: canPreview && fileContent && !isImageFileType,
        },
        {
          key: 'artifacts-preview-download',
          label: 'Download',
          icon: <DownloadIcon sx={styles.iconAction} />,
          onClick: handleDownload,
          disabled: false,
          show: true,
        },
        {
          key: 'artifacts-preview-rename',
          label: 'Rename',
          icon: <EditPenIcon sx={styles.iconAction} />,
          onClick: handleRename,
          disabled: false,
          show: !isChatPage && !!onRename,
        },
        {
          key: 'artifacts-preview-delete',
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
      handleRename,
      isChatPage,
      handleDelete,
      onRename,
      styles.iconAction,
    ],
  );

  return (
    <Box sx={styles.canvasHeader}>
      <Box sx={styles.row}>
        <Tooltip title="Close">
          <Button.BaseBtn
            variant="secondary"
            startIcon={<CloseIcon fill="currentColor" />}
            onClick={onClose}
            aria-label="Close preview"
            data-testid="artifacts-preview-close-button"
          />
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
              data-testid="artifacts-preview-file-path"
            >
              {canvasTitle}
            </Typography>
          </Tooltip>
        </Box>

        <Box sx={styles.canvasControlsWrapper}>
          {canPreview && !isImageFileType && (
            <>
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                color={BUTTON_COLORS.primary}
                onClick={handleSaveChanges}
                disabled={isSaving || !hasUnsavedChanges}
                data-testid="artifacts-preview-save-button"
              >
                Save
              </Button.BaseBtn>
              <Button.DiscardButton
                onDiscard={onDiscard}
                disabled={isSaving || !hasUnsavedChanges}
                discarding={false}
                dataTestId="artifacts-preview-discard-button"
              />

              <Divider
                orientation="vertical"
                sx={styles.divider}
              />
            </>
          )}

          <Box
            sx={{
              button: ({ palette }) => ({
                background: palette.background.surface.interactive.active,

                ':hover': {
                  background: palette.components.button.background.secondary.hover,
                },
              }),
            }}
          >
            <DotMenu
              id="file-preview-overflow-menu"
              slotProps={styles.dotMenuSlotProps(theme)}
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
              data-testid="artifacts-preview-mode-toggle-group"
            >
              <ToggleButton
                value="rendered"
                variant="elitea"
                sx={styles.toggleLeftButton}
                data-testid="artifacts-preview-mode-toggle-rendered"
              >
                {isMarkdownFile || isHtmlFile || isMdxFile ? 'Preview' : isDataFile ? 'Table' : 'Diagram'}
              </ToggleButton>
              <ToggleButton
                variant="elitea"
                value="code"
                sx={styles.toggleRightButton}
                data-testid="artifacts-preview-mode-toggle-code"
              >
                Raw
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          {shouldDetectLanguage && (
            <Box sx={styles.languageSelectWrapper}>
              <Select.SingleSelect
                value={currentLanguage}
                onValueChange={handleLanguageSelect}
                options={availableLanguages.map(lang => ({
                  ...lang,
                  label: `${lang.label}${lang.value === detectedLanguage ? ' (detected)' : ''}`,
                }))}
                displayEmpty
                showBorder={false}
                customMenuProps={{ sx: styles.languageSelectMenuSx }}
                data-testid="artifacts-preview-language-select"
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
    backgroundColor: palette.background.default.tertiary,
    borderBottom: `0.0625rem solid ${palette.border.default}`,
  }),

  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '.75rem 1.25rem',
    minHeight: isChatPage ? '3.25rem' : '3.65rem',
    height: isChatPage ? '3.25rem' : '3.65rem',
    gap: '1rem',

    ':last-of-type': ({ palette }) => ({
      borderTop: `0.0625rem solid ${palette.border.default}`,
      minHeight: isChatPage ? '3rem' : '3.4rem',
      height: isChatPage ? '3rem' : '3.4rem',
      justifyContent: 'flex-start',
    }),

    // override when it's the only row AND not chat page
    '&:only-child': {
      minHeight: !isChatPage ? '3.65rem' : '3rem',
      height: !isChatPage ? '3.65rem' : '3rem',
      borderTop: 'none',
      justifyContent: 'space-between',
    },
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

  languageSelectWrapper: {
    paddingTop: '0.25rem',
  },

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
      slotProps: {
        primary: {
          variant: 'bodyMedium',
          sx: { color: palette.text.secondary },
        },
      },
    },
    ListItemIcon: {
      sx: {
        minWidth: '1rem !important',
        marginRight: '.75rem',
      },
    },
  }),

  divider: ({ palette }) => ({
    borderColor: palette.border.default,
    height: '1.25rem',
    alignSelf: 'center',
  }),

  iconAction: ({ palette }) => ({
    fontSize: '0.875rem',
    fill: palette.icon.default,
  }),

  iconButtonAction: {
    padding: '.25rem',
  },
});

export default PreviewHeader;
