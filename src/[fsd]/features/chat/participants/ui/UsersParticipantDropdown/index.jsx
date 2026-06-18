import { memo, useCallback, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, ClickAwayListener, Grow, IconButton, Paper, Popper, Typography, useTheme } from '@mui/material';

import { SPACING } from '@/common/designTokens';
import UsersIcon from '@/components/Icons/UsersIcon';
import { DROPDOWN_CONSTANTS } from '@/components/UnifiedDropdown';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import DropdownFooter from './DropdownFooter';
import UserMenu from './UserMenu';

const UsersParticipantDropdown = memo(props => {
  const {
    users,
    onSelectUser,
    onDeleteUser,
    disabledAdd = false,
    currentUserId = '',
    placement = 'bottom-start',
    onOpenChange,
    showTrigger = true,
    width = '16.9375rem',
    slotProps = {
      IconButton: {},
      Paper: {
        sx: {},
      },
    },
  } = props;

  const theme = useTheme();

  const selectedProjectId = useSelectedProjectId();

  const { personal_project_id: privateProjectId } = useSelector(state => state.user);

  const anchorRef = useRef(null);

  const [open, setOpen] = useState(false);

  const isTriggerVisible = showTrigger || open;

  const styles = usersParticipantDropdownStyles(isTriggerVisible);

  const handleToggle = useCallback(() => {
    setOpen(prevOpen => {
      const next = !prevOpen;
      onOpenChange?.(next);
      return next;
    });
  }, [onOpenChange]);

  const handleClose = useCallback(
    event => {
      if (anchorRef.current && anchorRef.current.contains(event.target)) return;

      setOpen(false);
      onOpenChange?.(false);
    },
    [onOpenChange],
  );

  const handleSelectUser = useCallback(
    user => {
      setOpen(false);
      onOpenChange?.(false);
      onSelectUser?.(user);
    },
    [onSelectUser, onOpenChange],
  );

  return (
    <Box>
      <Box sx={styles.root}>
        <IconButton
          disableRipple
          ref={anchorRef}
          variant={slotProps?.IconButton?.variant || 'elitea'}
          color={slotProps?.IconButton?.color || 'tertiary'}
          onClick={handleToggle}
          sx={[styles.iconButton, slotProps?.IconButton?.sx]}
          aria-controls={open ? 'users-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
        >
          <UsersIcon
            fontSize="1.5rem"
            sx={[styles.usersIcon, slotProps?.Icon?.sx]}
            fill={theme.palette.secondary.main}
          />
        </IconButton>
      </Box>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement={placement}
        strategy="fixed"
        modifiers={[
          { name: 'offset', options: { offset: placement?.startsWith('left') ? [0, 16] : [0, 8] } },
          { name: 'flip', enabled: !placement?.startsWith('left') },
          { name: 'preventOverflow', options: { boundary: 'viewport', altBoundary: true, tether: true } },
        ]}
        transition
        style={{ zIndex: theme.zIndex.modal ? theme.zIndex.modal + 10 : 2200 }}
      >
        {({ TransitionProps, placement: popperPlacement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: popperPlacement?.startsWith('left')
                ? 'right center'
                : popperPlacement?.startsWith('right')
                  ? 'left center'
                  : popperPlacement === 'bottom'
                    ? 'center top'
                    : 'center bottom',
            }}
          >
            <Paper sx={[styles.paper, slotProps?.Paper?.sx || {}]}>
              <ClickAwayListener onClickAway={handleClose}>
                <Box>
                  <Box sx={styles.titleWrapper}>
                    <Box sx={styles.titleContent}>
                      <Typography sx={styles.title}>Users</Typography>
                    </Box>
                  </Box>
                  <UserMenu
                    options={users}
                    onClickEvent={handleClose}
                    onSelectOption={handleSelectUser}
                    onRemoveOption={onDeleteUser}
                    width={width}
                    currentUserId={currentUserId}
                    selectable={!disabledAdd}
                    sx={{
                      padding: '0rem 0rem 0rem 0rem',
                    }}
                  />

                  {selectedProjectId !== privateProjectId && !disabledAdd && (
                    <>
                      <Box sx={styles.footerDivider} />
                      <DropdownFooter
                        onSelectOption={handleSelectUser}
                        onClickEvent={handleClose}
                        usersCount={users.length}
                        width={width}
                      />
                    </>
                  )}
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
});

UsersParticipantDropdown.displayName = 'UsersParticipantDropdown';

/**
 * @type MuiSx
 */
const usersParticipantDropdownStyles = isTriggerVisible => ({
  root: {
    visibility: isTriggerVisible ? 'visible' : 'hidden',
    display: 'inline-flex',
  },
  iconButton: ({ palette }) => ({
    '&:hover': {
      color: palette.text.secondary,
    },

    '& .MuiSvgIcon-root path': {
      fill: `${palette.icon.fill.default} !important`,
    },
    marginLeft: '0rem',
  }),
  usersIcons: { width: '1.5rem', height: '1.5rem' },
  paper: ({ palette }) => ({
    borderRadius: DROPDOWN_CONSTANTS.BORDER_RADIUS.MENU,
    border: `.0625rem solid ${palette.border.lines}`,
    background: palette.background.secondary,
    boxShadow: '0rem .5rem .75rem 0rem rgba(0, 0, 0, 0.3)',
    width: '16.9375rem',
    maxHeight: DROPDOWN_CONSTANTS.DIMENSIONS.MENU_MAX_HEIGHT,
    padding: '.5rem 0',
  }),
  titleWrapper: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: `${SPACING.SM} ${SPACING.XL}`,
    height: DROPDOWN_CONSTANTS.DIMENSIONS.ITEM_HEIGHT,
    gap: DROPDOWN_CONSTANTS.SPACING.ITEM_ICON_TEXT_GAP,
    color: palette.border.lines,
    textTransform: 'uppercase',
  }),
  titleContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '.25rem',
    width: '10rem',
  },
  title: ({ palette }) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'Montserrat',
    fontWeight: 500,
    fontStyle: 'Medium',
    fontSize: '.75rem',
    lineHeight: '1rem',
    letterSpacing: '6%',
    textTransform: 'uppercase',
    color: palette.border.hover,
  }),
  footerDivider: { borderTop: '.0625rem solid', borderColor: 'divider', margin: '.5rem 0rem' },
});

export default UsersParticipantDropdown;
