import { memo, useCallback, useEffect, useRef, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, ClickAwayListener, Paper, Popper, Tooltip, Typography } from '@mui/material';

import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';

const InfoPopover = memo(props => {
  const { label, storageKey, testIdPrefix, title = 'Note', autoOpen = true, onAutoOpen, children } = props;

  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  // First visit: open automatically until the user dismisses it with the X button.
  useEffect(() => {
    if (!autoOpen) return;
    try {
      const dismissed = localStorage.getItem(storageKey) === 'true';

      if (!dismissed) {
        setOpen(true);
        onAutoOpen?.();
      }
    } catch {
      // storage blocked — leave closed
    }
  }, [autoOpen, onAutoOpen, storageKey]);

  // Escape closes without persisting and returns focus to the trigger.
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = event => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      anchorRef.current?.querySelector('button')?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleToggle = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  // Click-away only closes — does not write the dismissed flag, so auto-open
  // can still appear on the next visit if the user never clicked the X button.
  const handleClickAway = useCallback(event => {
    if (anchorRef.current?.contains(event.target)) return;
    setOpen(false);
  }, []);

  // Explicit close via X button permanently dismisses the auto-open.
  const handleClose = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // storage blocked — still close visually
    }
    setOpen(false);
  }, [storageKey]);

  const styles = infoPopoverStyles();

  return (
    <>
      <Tooltip
        title={label}
        placement="top"
      >
        <Box
          component="span"
          ref={anchorRef}
        >
          <BaseBtn
            variant={BUTTON_VARIANTS.icon}
            color="secondary"
            onClick={handleToggle}
            aria-label={label}
            aria-haspopup="true"
            aria-expanded={open}
            data-testid={`${testIdPrefix}-button`}
          >
            <InfoOutlinedIcon fontSize="small" />
          </BaseBtn>
        </Box>
      </Tooltip>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        modifiers={[
          { name: 'offset', options: { offset: [0, 8] } },
          { name: 'preventOverflow', options: { padding: 16 } },
        ]}
        sx={styles.popper}
      >
        <ClickAwayListener onClickAway={handleClickAway}>
          <Paper
            sx={styles.paper}
            role="dialog"
            aria-label={label}
          >
            <Box sx={styles.inner}>
              <Box sx={styles.header}>
                <InfoOutlinedIcon sx={styles.headerIcon} />
                <Typography
                  variant="labelMedium"
                  sx={styles.headerTitle}
                >
                  {title}
                </Typography>
                <Box sx={styles.headerSpacer} />
                <BaseBtn
                  variant={BUTTON_VARIANTS.icon}
                  color="secondary"
                  onClick={handleClose}
                  aria-label="Close"
                  data-testid={`${testIdPrefix}-close-button`}
                >
                  <CloseIcon fontSize="small" />
                </BaseBtn>
              </Box>

              <Box sx={styles.body}>{children}</Box>
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
});

InfoPopover.displayName = 'InfoPopover';

/** Text style for paragraphs rendered inside the popover body. */
export const infoPopoverTextSx = ({ palette }) => ({
  color: palette.alert.info.text,
});

/** @type {MuiSx} */
const infoPopoverStyles = () => ({
  popper: ({ zIndex }) => ({
    zIndex: zIndex.modal,
  }),
  paper: ({ palette, shadows }) => ({
    width: '22rem',
    maxWidth: 'calc(100vw - 2rem)',
    backgroundColor: palette.background.surface.default,
    border: `0.0625rem solid ${palette.alert.info.border}`,
    borderRadius: '0.75rem',
    boxShadow: shadows[8],
    overflow: 'hidden',
  }),
  inner: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: palette.alert.info.background,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  headerIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.indexResult.info,
  }),
  headerTitle: ({ palette }) => ({
    color: palette.alert.info.text,
  }),
  headerSpacer: {
    flex: 1,
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
});

export default InfoPopover;
