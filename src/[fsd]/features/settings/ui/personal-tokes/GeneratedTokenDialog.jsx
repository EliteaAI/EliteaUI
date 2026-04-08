import { memo, useCallback, useState } from 'react';

import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';

import { handleCopy } from '@/common/utils';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import CancelIcon from '@/components/Icons/CancelIcon';
import { StyledTipsContainer } from '@/pages/Common/Components/InputVersionDialog';

const COPY_DISABLED_DURATION = 5000;

const GeneratedTokenDialog = memo(props => {
  const { open, name = 'Nice token', token, onClose } = props;

  const [disabledCopy, setDisabledCopy] = useState(false);
  const [buttonTitle, setButtonTitle] = useState('Copy');
  const styles = generatedTokenDialogStyles();

  const onCopy = useCallback(() => {
    handleCopy(token);
    setButtonTitle('Copied!');
    setDisabledCopy(true);
    setTimeout(() => {
      setButtonTitle('Copy');
      setDisabledCopy(false);
    }, COPY_DISABLED_DURATION);
  }, [token]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && !disabledCopy) {
        event.preventDefault();
        onCopy();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    },
    [disabledCopy, onCopy, onClose],
  );

  return (
    <Dialog
      open={open}
      onKeyDown={handleKeyDown}
      sx={styles.dialog}
    >
      <DialogContent sx={styles.dialogContent}>
        <Box sx={styles.header}>
          <Typography sx={styles.title}>New token generated!</Typography>
          <Box
            component={CancelIcon}
            sx={styles.closeIcon}
            onClick={onClose}
          />
        </Box>
        <StyledTipsContainer sx={styles.tipsContainer}>
          <Box>
            <Box
              component={AttentionIcon}
              sx={styles.attentionIcon}
            />
          </Box>
          <Typography
            variant="bodySmall"
            color="text.attention"
          >
            This token will only be shown once, so make sure to copy and save it.
          </Typography>
        </StyledTipsContainer>
        <Box sx={styles.tokenContainer}>
          <Typography
            variant="bodySmall"
            color="text.default"
          >
            {name}
          </Typography>
          <Box sx={styles.tokenScrollBox}>
            <Typography
              sx={styles.tokenText}
              variant="bodyMedium"
              color="text.default"
            >
              {token}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button
          variant="elitea"
          color="primary"
          sx={styles.copyButton}
          disabled={disabledCopy}
          onClick={onCopy}
        >
          {buttonTitle}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

GeneratedTokenDialog.displayName = 'GeneratedTokenDialog';

/** @type {MuiSx} */
const generatedTokenDialogStyles = () => ({
  dialog: {
    display: 'flex',
    padding: '1rem 1.5rem',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  dialogContent: ({ palette }) => ({
    width: '31.25rem',
    borderTopLeftRadius: '0.5rem',
    borderTopRightRadius: '0.5rem',
    background: palette.background.secondary,
    padding: '1rem 1.5rem 0',
    overflowX: 'hidden',
  }),
  dialogActions: ({ palette }) => ({
    width: '31.25rem',
    borderBottomLeftRadius: '0.5rem',
    borderBottomRightRadius: '0.5rem',
    background: palette.background.secondary,
    padding: '0 1.5rem 1rem',
    justifyContent: 'flex-end',
  }),
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: ({ palette }) => ({
    fontFamily: 'Montserrat',
    fontSize: '0.875rem',
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
  closeIcon: ({ palette }) => ({
    cursor: 'pointer',
    fill: palette.icon.fill.default,
  }),
  tipsContainer: ({ palette }) => ({
    borderColor: palette.border.attention,
    backgroundColor: palette.background.attention,
  }),
  attentionIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    fill: palette.icon.fill.attention,
  }),
  tokenContainer: ({ palette }) => ({
    marginY: '1rem',
    padding: '0.5rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  tokenScrollBox: {
    maxHeight: '3rem',
    overflowY: 'scroll',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
      width: '0 !important',
      height: 0,
    },
  },
  tokenText: {
    wordWrap: 'break-word',
  },
  copyButton: {
    marginRight: 0,
  },
});

export default GeneratedTokenDialog;
