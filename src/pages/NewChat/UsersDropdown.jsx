import { useCallback, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import {
  Box,
  ClickAwayListener,
  Grow,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
  useTheme,
} from '@mui/material';

import AddUsersIcon from '@/assets/add-user-icon.svg?react';
import DeleteParticipantButton from '@/components/DeleteParticipantButton';
import UsersIcon from '@/components/Icons/UsersIcon';
import UserAvatar from '@/components/UserAvatar';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

// Tooltip not needed inside the dropdown items here

const UserItem = ({
  width = '228px',
  participant = {},
  selectable = true,
  clickable = true,
  onClick,
  onDelete,
}) => {
  const { meta: { user_name, user_avatar } = { user_name: '', user_avatar: '' } } = participant;
  const theme = useTheme();
  const [isHovering, setIsHovering] = useState(false);

  const onClickHandler = useCallback(
    event => {
      if (selectable) {
        onClick?.(event, participant);
      }
    },
    [onClick, participant, selectable],
  );

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <Box
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{
        cursor: selectable ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        padding: '8px 16px',
        width,
        maxWidth: width,
        height: '40px',
        boxSizing: 'border-box',
        '&:hover #cover': {
          visibility: selectable ? 'visible' : 'hidden',
        },
        '&:hover #DeleteButton': {
          visibility: selectable ? 'visible' : 'hidden',
        },
      }}
    >
      <Box
        display={'flex'}
        flexDirection={'row'}
        alignItems={'center'}
        justifyContent={'flex-start'}
        flex={1}
        height={'20px'}
        boxSizing={'border-box'}
        borderRadius={'20px'}
        position={'relative'}
        gap={'13px'}
        onClick={clickable ? onClickHandler : undefined}
      >
        <UserAvatar
          name={user_name}
          avatar={user_avatar}
          size={20}
        />
        <Box
          id={'cover'}
          visibility={'hidden'}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '20px',
            height: '100%',
            backgroundColor: theme.palette.background.participant.cover,
            borderRadius: '28px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="labelSmall"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            @
          </Typography>
        </Box>
        <Typography
          color="text.secondary"
          variant="bodyMedium"
          sx={{
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            wordWrap: 'break-word',
            maxWidth: isHovering ? `calc(${width} - 104px)` : `calc(${width} - 66px)`,
          }}
        >
          {user_name}
        </Typography>
      </Box>
      <DeleteParticipantButton
        id={'DeleteButton'}
        sx={{
          visibility: 'hidden', // Initially hidden
        }}
        participant={participant}
        onDelete={onDelete}
      />
    </Box>
  );
};

const AllUsersItem = ({ width = '228px', clickable = true, onClick }) => {
  const theme = useTheme();
  const [isHovering, setIsHovering] = useState(false);

  const onClickHandler = useCallback(
    event => {
      onClick?.(event, 'All users');
    },
    [onClick],
  );

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <Box
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={clickable ? onClickHandler : undefined}
      sx={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        padding: '8px 16px',
        width: '100%',
        maxWidth: width,
        height: '40px',
        boxSizing: 'border-box',
        '&:hover #cover': {
          visibility: 'visible',
        },
      }}
    >
      <Box
        display={'flex'}
        flexDirection={'row'}
        alignItems={'center'}
        justifyContent={'flex-start'}
        flex={1}
        height={'20px'}
        boxSizing={'border-box'}
        borderRadius={'20px'}
        position={'relative'}
        gap={'13px'}
        color={theme.palette.icon.fill.inactive}
      >
        <UsersIcon
          sx={{ fontSize: '16px' }}
          fill={theme.palette.icon.fill.default}
        />
        <Box
          id={'cover'}
          visibility={'hidden'}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '20px',
            height: '100%',
            backgroundColor: theme.palette.background.participant.cover,
            borderRadius: '28px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="labelSmall"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            @
          </Typography>
        </Box>
        <Typography
          color="text.secondary"
          variant="bodyMedium"
          sx={{
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            wordWrap: 'break-word',
            maxWidth: isHovering ? `calc(${width} - 104px)` : `calc(${width} - 66px)`,
          }}
        >
          All users
        </Typography>
      </Box>
    </Box>
  );
};

const AddUsersItem = ({ onClick, width, disabled }) => {
  const theme = useTheme();

  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '4px 16px',
        width,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        '&:hover': {
          backgroundColor: disabled ? 'transparent' : theme.palette.background.select.hover,
        },
      }}
    >
      <AddUsersIcon
        style={{ width: '16px', height: '16px' }}
        fill={theme.palette.icon.fill.secondary}
      />
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        Add users
      </Typography>
    </Box>
  );
};

const UserMenu = ({
  options,
  onClickEvent,
  onSelectOption,
  width,
  onRemoveOption,
  currentUserId,
  selectable,
  sx,
}) => {
  const sortedUsers = useMemo(() => {
    return options.sort((a, b) =>
      a.meta?.user_name?.toLowerCase().localeCompare(b.meta?.user_name?.toLowerCase()),
    );
  }, [options]);

  const onClick = useCallback(
    (event, participant) => {
      onSelectOption?.(participant);
      onClickEvent(event, true);
    },
    [onClickEvent, onSelectOption],
  );

  return (
    <MenuList
      sx={{
        padding: '0px 0px 8px 0px',
        ...(sx || {}),
      }}
    >
      {sortedUsers.map(user => (
        <MenuItem
          sx={{ justifyContent: 'space-between', padding: '0px 0px !important' }}
          disableRipple
          key={user.id}
        >
          <UserItem
            participant={user}
            width={width}
            onClick={onClick}
            onDelete={onRemoveOption}
            selectable={selectable && user.entity_meta?.id !== currentUserId}
          />
        </MenuItem>
      ))}
    </MenuList>
  );
};

const Footer = ({ onClickEvent, width, onSelectOption, usersCount }) => {
  const onClick = useCallback(
    (event, participant) => {
      onClickEvent?.(event, true);
      onSelectOption?.(participant);
    },
    [onClickEvent, onSelectOption],
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0px 0px 0px 0px',
        width,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
      }}
    >
      {usersCount > 1 && (
        <MenuItem
          sx={{
            justifyContent: 'space-between',
            padding: '0px 0px !important',
            maxWidth: '228px',
            width: '100%',
          }}
        >
          <AllUsersItem onClick={onClick} />
        </MenuItem>
      )}
    </Box>
  );
};

export default function UsersDropdown({
  users,
  width = '228px',
  onSelectUser,
  onDeleteUser,
  onAddUsers,
  disabledAdd = false,
  currentUserId = '',
  placement = 'bottom-start',
  onOpenChange,
  showTrigger = true,
  slotProps = {
    IconButton: {},
    Paper: {
      sx: {},
    },
  },
}) {
  const theme = useTheme();
  const { personal_project_id: privateProjectId } = useSelector(state => state.user);
  const selectedProjectId = useSelectedProjectId();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleToggle = useCallback(() => {
    setOpen(prevOpen => {
      const next = !prevOpen;
      onOpenChange?.(next);
      return next;
    });
  }, [onOpenChange]);

  const handleClose = useCallback(
    event => {
      if (anchorRef.current && anchorRef.current.contains(event.target)) {
        return;
      }
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

  const onClickAddUser = useCallback(
    event => {
      handleClose(event);
      onAddUsers?.(event, 'Add users');
    },
    [onAddUsers, handleClose],
  );

  const isTriggerVisible = showTrigger || open;

  return (
    <Box>
      <Box
        sx={{
          visibility: isTriggerVisible ? 'visible' : 'hidden',
          display: 'inline-flex',
        }}
      >
        <IconButton
          ref={anchorRef}
          variant={slotProps?.IconButton?.variant || 'elitea'}
          color={slotProps?.IconButton?.color || 'tertiary'}
          disableRipple
          onClick={handleToggle}
          sx={{
            '&:hover': {
              color: theme.palette.text.secondary,
            },
            '& .MuiSvgIcon-root path': {
              fill: `${theme.palette.icon.fill.default} !important`,
            },
            marginLeft: '0px',
            ...(slotProps?.IconButton?.sx || {}),
          }}
          aria-controls={open ? 'users-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
        >
          <UsersIcon
            fontSize="16px"
            sx={{ width: '16px !important', height: '16px !important' }}
            fill={theme.palette.icon.fill.default}
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
            <Paper
              sx={{
                width,
                borderRadius: '8px',
                border: `1px solid ${theme.palette.border.lines}`,
                boxShadow: theme.palette.boxShadow.default,
                marginTop: '8px',
                background: theme.palette.background.secondary,
                padding: '8px 0px',
                boxSizing: 'border-box',
                ...(slotProps?.Paper?.sx || {}),
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <Box>
                  {/* Add Users item at the top (only when not in private project) */}
                  {selectedProjectId !== privateProjectId && (
                    <>
                      <MenuItem
                        sx={{ justifyContent: 'space-between', padding: '0px 0px !important' }}
                        disabled={disabledAdd}
                      >
                        <AddUsersItem
                          onClick={onClickAddUser}
                          width={width}
                          disabled={disabledAdd}
                        />
                      </MenuItem>
                      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', margin: '8px 0px' }} />
                    </>
                  )}

                  {/* User List */}
                  <UserMenu
                    options={users}
                    onClickEvent={handleClose}
                    onSelectOption={handleSelectUser}
                    onRemoveOption={onDeleteUser}
                    width={width}
                    currentUserId={currentUserId}
                    selectable={!disabledAdd}
                    sx={{
                      padding: '0px 0px 0px 0px',
                    }}
                  />

                  {/* Footer with All Users only (at the bottom) */}
                  {selectedProjectId !== privateProjectId && !disabledAdd && (
                    <>
                      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', margin: '8px 0px' }} />
                      <Footer
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
}
