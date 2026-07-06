import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { CodeMirrorEditorHelpers } from '@/[fsd]/shared/lib/helpers';
import { useLanguageLinter } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { handleCopy } from '@/common/utils';
import CopyIcon from '@/components/Icons/CopyIcon';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

const ExpandedViewerModal = memo(props => {
  const {
    open,
    onClose,
    title,
    value,
    specifiedLanguage,
    children,
    content,
    language: externalLanguage,
    onLanguageChange,
    contentBackgroundSx,
    disableSelectLanguage,
    customButtons,
    'data-testid': dataTestId,
    closeButtonDataTestId,
    footer,
  } = props;

  const theme = useTheme();
  const { toastInfo } = useToast();
  const { language: internalLanguage, onChangeLanguage: internalOnChangeLanguage } =
    useLanguageLinter(specifiedLanguage);

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

    const timeoutId = setTimeout(checkTruncation, 100);

    window.addEventListener('resize', checkTruncation);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [open, title]);

  const styles = styledInputModalBaseStyles();

  const titleNode = (
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
  );

  const headerActionsNode = (
    <>
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
          options={CodeMirrorEditorHelpers.languageOptions}
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
    </>
  );

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.complex}
      fullscreen
      title={titleNode}
      headerActions={headerActionsNode}
      content={content ?? children}
      onClose={onClose}
      sx={styles.dialogPaper}
      dialogSx={[styles.dialogContent, contentBackgroundSx]}
      data-testid={dataTestId}
      closeButtonDataTestId={closeButtonDataTestId}
      footer={footer}
    />
  );
});

ExpandedViewerModal.displayName = 'ExpandedViewerModal';

export default ExpandedViewerModal;

/** @type {MuiSx} */
const styledInputModalBaseStyles = () => ({
  dialogPaper: {
    margin: 0,
  },
  titleText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 'calc(80vw - 21rem)',
  },
  labelBox: {
    width: '6.25rem',
  },
  languageSelect: ({ spacing }) => ({
    margin: `${spacing(0.625)} 0 0 0 !important`,
  }),
  actionButton: ({ spacing, palette }) => ({
    marginLeft: spacing(2),
    '&:hover svg path': {
      fill: `${palette.text.secondary} !important`,
    },
  }),
  icon: {
    fontSize: '1rem',
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
