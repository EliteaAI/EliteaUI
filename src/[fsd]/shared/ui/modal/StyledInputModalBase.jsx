import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { handleCopy } from '@/common/utils';
import CloseIcon from '@/components/Icons/CloseIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import { languageOptions, useLanguageLinter } from '@/hooks/useCodeMirrorLanguageExtensions';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

/**
 * StyledInputModalBase - Base dialog shell for input modals
 *
 * Provides the common structure with:
 * - Dialog container with styling
 * - DialogTitle with language selector and action buttons
 * - DialogContent wrapper
 *
 * Content is provided via children
 */
const StyledInputModalBase = memo(props => {
  const {
    open,
    onClose,
    title,
    value,
    specifiedLanguage,
    children,
    language: externalLanguage,
    onLanguageChange,
    contentBackgroundSx,
    disableSelectLanguage,
    customButtons,
  } = props;

  const theme = useTheme();
  const { toastInfo } = useToast();
  const { language: internalLanguage, onChangeLanguage: internalOnChangeLanguage } =
    useLanguageLinter(specifiedLanguage);

  // Use external language/handler if provided, otherwise use internal
  const language = externalLanguage ?? internalLanguage;
  const onChangeLanguage = onLanguageChange ?? internalOnChangeLanguage;

  const onClickCopy = useCallback(() => {
    handleCopy(value);
    toastInfo('The content has been copied to the clipboard');
  }, [value, toastInfo]);

  const titleRef = useRef(null);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);

  useEffect(() => {
    if (!open) return;

    const checkTruncation = () => {
      if (titleRef.current) {
        setIsTitleTruncated(titleRef.current.scrollWidth > titleRef.current.clientWidth);
      }
    };

    // Delay check to ensure dialog is fully rendered
    const timeoutId = setTimeout(checkTruncation, 100);

    window.addEventListener('resize', checkTruncation);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [open, title]);

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  const styles = styledInputModalBaseStyles();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      slotProps={{
        paper: {
          sx: styles.dialogPaper,
        },
      }}
    >
      <DialogTitle
        variant="headingMedium"
        color="text.secondary"
        sx={styles.dialogTitle}
      >
        <Box sx={styles.titleContainer}>
          <StyledTooltip
            title={isTitleTruncated ? title : ''}
            placement="top"
          >
            <Typography
              ref={titleRef}
              variant="headingMedium"
              color="text.secondary"
              sx={styles.titleText}
            >
              {title}
            </Typography>
          </StyledTooltip>
          <Box sx={styles.actionsContainer}>
            <Box sx={styles.labelBox}>
              <Typography
                variant="bodyMedium"
                color="text.default"
              >
                Content type:
              </Typography>
            </Box>
            <Box>
              <SingleSelect
                onValueChange={onChangeLanguage}
                value={language === 'cpp' ? 'c++' : language}
                options={languageOptions}
                customSelectedColor={`${theme.palette.text.primary} !important`}
                customSelectedFontSize="0.875rem"
                sx={styles.languageSelect}
                disabled={disableSelectLanguage}
              />
            </Box>
            {customButtons}
            <StyledTooltip
              title="Copy to clipboard"
              placement="top"
            >
              <IconButton
                sx={styles.actionButton}
                variant="icon"
                color="tertiary"
                onClick={onClickCopy}
              >
                <CopyIcon sx={styles.icon} />
              </IconButton>
            </StyledTooltip>
            <IconButton
              sx={styles.actionButton}
              variant="icon"
              color="tertiary"
              onClick={onClose}
            >
              <CloseIcon
                fill={theme.palette.icon.fill.default}
                sx={styles.closeIcon}
              />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={[styles.dialogContent, contentBackgroundSx]}>{children}</DialogContent>
    </Dialog>
  );
});

StyledInputModalBase.displayName = 'StyledInputModalBase';

export default StyledInputModalBase;

/** @type {MuiSx} */
const styledInputModalBaseStyles = () => ({
  dialogPaper: ({ palette, spacing }) => ({
    background: palette.background.tabPanel,
    borderRadius: spacing(2),
    border: `0.0625rem solid ${palette.border.lines}`,
    boxShadow: palette.boxShadow.default,
    marginTop: 0,
    maxWidth: '90vw',
    height: 'calc(100vh - 10rem)',
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
  }),
  dialogTitle: ({ spacing }) => ({
    height: spacing(7.5),
    padding: spacing(2, 2.5, 2, 3),
  }),
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    paddingLeft: '1rem',
  },
  titleText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 'calc(80vw - 21rem)',
  },
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  labelBox: ({ spacing }) => ({
    height: spacing(3),
    width: '6.25rem',
    marginRight: spacing(1),
  }),
  languageSelect: ({ spacing }) => ({
    margin: `${spacing(0.625)} 0 0 0 !important`,
  }),
  actionButton: ({ spacing }) => ({
    marginLeft: spacing(2),
  }),
  icon: {
    fontSize: '1rem',
  },
  closeIcon: {
    fontSize: '1rem',
    cursor: 'pointer',
  },
  dialogContent: ({ palette }) => ({
    padding: '0 !important',
    width: '80vw',
    height: 'calc(100vh - 13.75rem)',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.tabPanel,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }),
});
