import { memo, useCallback, useState } from 'react';

import { Box, MenuItem, Typography, useTheme } from '@mui/material';

import UsersIcon from '@/components/Icons/UsersIcon';

const DropdownFooter = memo(props => {
  const { onClickEvent, onSelectOption, usersCount } = props;

  const theme = useTheme();

  const [isHovering, setIsHovering] = useState(false);

  const styles = dropdownFooterStyles({ isHovering });

  const onClick = useCallback(
    (event, participant) => {
      onClickEvent?.(event, true);
      onSelectOption?.(participant);
    },
    [onClickEvent, onSelectOption],
  );

  const onAllUsersClick = useCallback(
    event => {
      onClick?.(event, 'All users');
    },
    [onClick],
  );

  if (usersCount <= 1) return null;

  return (
    <Box sx={styles.root}>
      <MenuItem sx={styles.menuItem}>
        <Box
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={onAllUsersClick}
          sx={styles.itemWrapper}
        >
          <Box
            sx={styles.contentRow}
            color={theme.palette.icon.fill.inactive}
          >
            <UsersIcon
              sx={styles.usersIcon}
              fill={theme.palette.secondary.main}
            />
            <Box
              id="cover"
              visibility="hidden"
              sx={styles.cover}
            >
              <Typography
                variant="labelSmall"
                color="text.secondary"
                sx={styles.coverText}
              >
                @
              </Typography>
            </Box>
            <Typography
              color="text.secondary"
              variant="bodyMedium"
              sx={styles.label}
            >
              All users
            </Typography>
          </Box>
        </Box>
      </MenuItem>
    </Box>
  );
});

DropdownFooter.displayName = 'DropdownFooter';

/** @type {MuiSx} */
const dropdownFooterStyles = ({ isHovering }) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    width: '16.9375rem',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuItem: {
    justifyContent: 'space-between',
    padding: '0 !important',
    maxWidth: '16.9375rem',
    width: '100%',
  },
  itemWrapper: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: '.5rem 1rem',
    width: '100%',
    maxWidth: '16.9375rem',
    height: '2.5rem',
    boxSizing: 'border-box',
    '&:hover #cover': {
      visibility: 'visible',
    },
  },
  contentRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    height: '1.25rem',
    boxSizing: 'border-box',
    borderRadius: '1.25rem',
    position: 'relative',
    gap: '.8125rem',
  },
  usersIcon: {
    fontSize: '1rem',
  },
  cover: ({ palette }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '1.25rem',
    height: '100%',
    backgroundColor: palette.background.participant.cover,
    borderRadius: '1.75rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  coverText: {
    textAlign: 'center',
  },
  label: {
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordWrap: 'break-word',
    maxWidth: isHovering ? 'calc(16.9375rem - 6.5rem)' : 'calc(16.9375rem - 4.125rem)',
  },
});

export default DropdownFooter;
