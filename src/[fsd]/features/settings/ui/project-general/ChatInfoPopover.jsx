import { memo, useCallback, useId, useRef, useState } from 'react';

import { Box, ClickAwayListener, Paper, Popper, Tooltip, Typography, useTheme } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseIcon from '@/components/Icons/CloseIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

const ChatInfoPopover = memo(props => {
  const { type, projectType } = props;

  const theme = useTheme();
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const styles = chatInfoPopoverStyles();

  const handleToggle = useCallback(() => setOpen(prev => !prev), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Escape') handleClose();
    },
    [handleClose],
  );

  const isTeam = projectType === 'team';
  const isTemplates = type === 'templates';

  const content = isTemplates ? (
    <>
      A chat template is a saved starting setup for new chats. You can create up to{' '}
      <Typography
        component="strong"
        variant="bodySmall"
        sx={styles.bold}
      >
        5
      </Typography>{' '}
      and mark one as the{' '}
      <Typography
        component="strong"
        variant="bodySmall"
        sx={styles.bold}
      >
        default
      </Typography>
      . Every new chat in this project starts from the default template, with its participants already added.
    </>
  ) : isTeam ? (
    <>
      These participants join every new chat created from this template. You can add{' '}
      <Typography
        component="strong"
        variant="bodySmall"
        sx={styles.bold}
      >
        agents, pipelines, toolkits, MCPs, and teammates
      </Typography>
      . If you add exactly one, it becomes the{' '}
      <Typography
        component="strong"
        variant="bodySmall"
        sx={styles.bold}
      >
        active participant
      </Typography>
      , so your messages go to it directly.
    </>
  ) : (
    <>
      These participants join every new chat created from this template. You can add{' '}
      <Typography
        component="strong"
        variant="bodySmall"
        sx={styles.bold}
      >
        agents, pipelines, toolkits, and MCPs
      </Typography>
      . If you add exactly one, it becomes the{' '}
      <Typography
        component="strong"
        variant="bodySmall"
        sx={styles.bold}
      >
        active participant
      </Typography>
      , so your messages go to it directly.
    </>
  );

  const label = isTemplates ? 'About chat templates' : 'About pre-configured participants';

  return (
    <Box
      sx={styles.wrapper}
      onKeyDown={handleKeyDown}
    >
      <Tooltip
        title={label}
        placement="top"
      >
        <Button.BaseBtn
          ref={anchorRef}
          variant={BUTTON_VARIANTS.tertiary}
          onClick={handleToggle}
          aria-label={label}
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          sx={styles.iconButton}
        >
          <InfoIcon fill={theme.palette.icon.secondary} />
        </Button.BaseBtn>
      </Tooltip>

      <Popper
        id={popoverId}
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={styles.popper}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            role="dialog"
            aria-label={label}
            elevation={4}
            sx={styles.paper}
          >
            <Box sx={styles.paperHeader}>
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                onClick={handleClose}
                aria-label="Close"
                sx={styles.closeBtn}
              >
                <CloseIcon
                  width={16}
                  height={16}
                  fill={theme.palette.icon.default}
                />
              </Button.BaseBtn>
            </Box>
            <Typography
              variant="bodySmall"
              color="text.secondary"
              sx={styles.text}
            >
              {content}
            </Typography>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
});

ChatInfoPopover.displayName = 'ChatInfoPopover';

/** @type {MuiSx} */
const chatInfoPopoverStyles = () => ({
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  iconButton: {
    minWidth: 'unset',
    padding: '0.125rem',
    borderRadius: '50%',
  },
  popper: {
    zIndex: 1400,
    mt: '0.25rem',
  },
  paper: ({ palette }) => ({
    width: '18rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    background: palette.background.default.secondary,
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  }),
  paperHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    minWidth: 'unset',
    padding: '0.125rem',
  },
  text: {
    lineHeight: '1.5',
  },
  bold: {
    fontWeight: 600,
  },
});

export default ChatInfoPopover;
