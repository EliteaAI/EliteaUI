import { memo, useCallback, useEffect, useRef, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, ClickAwayListener, Paper, Popper, Tooltip, Typography } from '@mui/material';

import { UsageConstants } from '@/[fsd]/features/settings/lib/constants';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';

const UsageInfoPopover = memo(props => {
  const { isPersonalProject } = props;

  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(UsageConstants.LS_USAGE_INFO_DISMISSED) === 'true';

      if (!dismissed) {
        setOpen(true);
      }
    } catch {
      // storage blocked — leave closed
    }
  }, []);

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
      localStorage.setItem(UsageConstants.LS_USAGE_INFO_DISMISSED, 'true');
    } catch {
      // storage blocked — still close visually
    }
    setOpen(false);
  }, []);

  const styles = usageInfoPopoverStyles();

  return (
    <>
      <Tooltip
        title="About Usage"
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
            aria-label="About Usage"
            aria-haspopup="true"
            aria-expanded={open}
            data-testid="usage-info-button"
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
          <Paper sx={styles.paper}>
            <Box sx={styles.inner}>
              <Box sx={styles.header}>
                <InfoOutlinedIcon sx={styles.headerIcon} />
                <Typography
                  variant="labelMedium"
                  sx={styles.headerTitle}
                >
                  Note
                </Typography>
                <Box sx={styles.headerSpacer} />
                <BaseBtn
                  variant={BUTTON_VARIANTS.icon}
                  color="secondary"
                  onClick={handleClose}
                  aria-label="Close"
                  data-testid="usage-info-close-button"
                >
                  <CloseIcon fontSize="small" />
                </BaseBtn>
              </Box>

              <Box sx={styles.body}>
                {isPersonalProject && (
                  <Typography
                    variant="bodyMedium"
                    sx={styles.text}
                  >
                    This is your Private project. Requests made without selecting a &quot;Team&quot; project
                    are charged here, including requests made with personal access tokens from external tools
                    such as Claude Code, IDE extensions, and scripts.
                  </Typography>
                )}
                <Typography
                  variant="bodyMedium"
                  sx={styles.text}
                >
                  Only requests to platform-managed shared models count toward this budget. Usage of models
                  configured with your own provider credentials is billed by that provider and is not included
                  here.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
});

UsageInfoPopover.displayName = 'UsageInfoPopover';

/** @type {MuiSx} */
const usageInfoPopoverStyles = () => ({
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
  text: ({ palette }) => ({
    color: palette.alert.info.text,
  }),
});

export default UsageInfoPopover;
