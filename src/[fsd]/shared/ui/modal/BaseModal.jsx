import { memo, useCallback } from 'react';

import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useTheme } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { ModalHelpers } from '@/[fsd]/shared/lib/helpers';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseIcon from '@/components/Icons/CloseIcon';

const BaseModal = memo(props => {
  const {
    open,
    title,
    titleIcon,
    onClose,
    onConfirm,
    content,
    actions,
    hideSections = false,
    titleVariant = 'headingSmall',
    sx = {},
    onKeyDown,
    dialogSx = {},
    variant = ModalConstants.MODAL_VARIANT.complex,
    fullscreen = false,
    headerActions,
  } = props;

  const theme = useTheme();

  const isSimple = variant === ModalConstants.MODAL_VARIANT.simple;
  const isFullscreen = variant === ModalConstants.MODAL_VARIANT.complex && fullscreen;

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
      onKeyDown?.(event);
    },
    [onClose, onKeyDown],
  );

  const hasActions = !!(actions || onConfirm);
  const styles = modalStyles({ isSimple, isFullscreen, hideSections, hasActions });

  const renderIconType = typeIcon => {
    const Icon = ModalConstants.MODAL_ICONS[typeIcon];
    if (!Icon) return null;

    return (
      <Icon
        style={{
          width: ModalConstants.MODAL_ICON_SIZE.width,
          height: ModalConstants.MODAL_ICON_SIZE.height,
          color: theme.palette.icon.fill[ModalConstants.MODAL_ICON_COLOR_KEYS[typeIcon]],
        }}
      />
    );
  };

  const renderTitle = () => {
    if (typeof title === 'string') {
      return (
        <Typography
          variant={titleVariant}
          color="text.secondary"
        >
          {title}
        </Typography>
      );
    }
    return title;
  };

  const renderActions = () => {
    if (actions) return actions;
    if (!onConfirm) return null;

    return (
      <>
        <Button.BaseBtn
          variant="elitea"
          color="secondary"
          onClick={onClose}
        >
          Discard
        </Button.BaseBtn>
        <Button.BaseBtn
          variant="elitea"
          onClick={onConfirm}
        >
          Confirm
        </Button.BaseBtn>
      </>
    );
  };

  return (
    <Dialog
      open={!!open}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth={false}
      slotProps={{
        paper: {
          sx: [styles.dialogPaper, sx],
        },
      }}
      onClose={onClose}
      onKeyDown={handleKeyDown}
    >
      <DialogTitle
        id="variables-dialog-title"
        sx={styles.dialogTitle}
      >
        <Box sx={styles.titleWrapper}>
          {isSimple && titleIcon && renderIconType(titleIcon)}
          {renderTitle()}
        </Box>
        <Box sx={styles.headerRight}>
          {!isSimple && headerActions}
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            aria-label="Close"
            startIcon={<CloseIcon />}
            onClick={onClose}
            sx={styles.closeButton}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={[styles.dialogContent, dialogSx]}>{content}</DialogContent>
      {(actions || onConfirm) && !isFullscreen && (
        <DialogActions sx={styles.dialogActions}>{renderActions()}</DialogActions>
      )}
    </Dialog>
  );
});

BaseModal.displayName = 'BaseModal';

/** @type {MuiSx} */
const modalStyles = ({ isSimple, isFullscreen, hideSections, hasActions }) => ({
  dialogPaper: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: isFullscreen ? '80vw' : isSimple ? '31.25rem' : '37.5rem',
    maxWidth: isFullscreen ? '80vw' : '60%',
    borderRadius: '1rem',
    border: `1px solid ${palette.border.lines}`,
    background: isSimple ? palette.background.modal.simple : palette.background.tabPanel,
    ...(isFullscreen && {
      height: 'calc(100vh - 10rem)',
    }),
  }),
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  closeButton: {
    '& .MuiButton-startIcon': {
      width: '1.35rem',
      height: '1.35rem',
    },
    '& .MuiButton-startIcon > svg': {
      width: '1.35rem',
      height: '1.35rem',
    },
  },
  dialogTitle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3.75rem',
    gap: '0.5rem',
  },
  dialogContent: ({ palette }) => ({
    width: '100%',
    overflow: 'auto',
    maxHeight: isFullscreen ? 'none' : 'calc(100vh - 23.75rem)',
    boxSizing: 'border-box',
    padding: ModalHelpers.getContentPadding(isFullscreen, isSimple),
    overflowY: 'scroll',
    gap: '1rem',
    color: palette.text.secondary,

    ...(isSimple || hideSections
      ? { background: 'transparent' }
      : {
          background: palette.background.secondary,
          borderTop: `.0625rem solid ${palette.border.lines}`,
          ...(hasActions && { borderBottom: `.0625rem solid ${palette.border.lines}` }),
        }),
  }),
  dialogActions: ({ palette }) => ({
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    alignItems: 'center',
    flexDirection: 'row',
    padding: '.75rem 1.5rem !important',
    '& > :not(style) ~ :not(style)': {
      marginLeft: 0,
    },
    gap: '.75rem',
    height: '3.75rem',
    ...(isSimple && {
      background: palette.background.modal.simple,
    }),
  }),
});

export default BaseModal;
