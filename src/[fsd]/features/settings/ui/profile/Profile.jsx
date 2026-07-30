import { memo, useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { dateFormatter } from '@/[fsd]/features/settings/lib/helpers/dateFormatter.helpers';
import FieldWithCopy from '@/[fsd]/features/settings/ui/ai-providers/FieldWithCopy';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import LogoutIcon from '@/assets/logout-icon.svg?react';
import UserAvatar from '@/components/UserAvatar';
import { logout } from '@/slices/user.js';

const Profile = memo(() => {
  const dispatch = useDispatch();
  const { name, avatar, email, id, last_login } = useSelector(state => state.user);

  const styles = profileStyles();

  const onLogout = useCallback(() => {
    dispatch(logout());
    window.location.href = window.location.origin.toString() + '/forward-auth/logout';
  }, [dispatch]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
          fontWeight={600}
        >
          Profile
        </Typography>
      </Box>

      <Box sx={styles.content}>
        <Box sx={styles.inner}>
          <Box sx={styles.avatarSection}>
            <UserAvatar
              avatar={avatar}
              name={name}
              size={64}
            />
            <Typography
              variant="labelMedium"
              color="text.secondary"
              fontWeight={600}
            >
              {name}
            </Typography>
          </Box>

          <Box sx={styles.fieldsSection}>
            <FieldWithCopy
              label="Full name:"
              value={name || ''}
            />
            <FieldWithCopy
              label="Email:"
              value={email || ''}
            />
            <FieldWithCopy
              label="User ID:"
              value={id != null ? String(id) : ''}
            />
            <FieldWithCopy
              label="Last login:"
              value={dateFormatter(last_login) || ''}
            />
          </Box>

          <BaseBtn
            variant="secondary"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
            sx={styles.logoutButton}
          >
            Log out
          </BaseBtn>
        </Box>
      </Box>
    </Box>
  );
});

Profile.displayName = 'Profile';

/** @type {MuiSx} */
const profileStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  header: ({ palette }) => ({
    height: '3.75rem',
    minHeight: '3.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  content: ({ palette }) => ({
    backgroundColor: palette.background.tabPanel,
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
  }),
  inner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '1.5rem',
    maxWidth: '50rem',
    width: '100%',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  fieldsSection: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      padding: '0.75rem 0',
      borderBottom: `0.0625rem solid ${palette.border.table}`,
    },
  }),
  logoutButton: {
    width: '7rem',
  },
});

export default Profile;
