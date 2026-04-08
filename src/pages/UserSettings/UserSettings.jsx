import { Box, Typography } from '@mui/material';

import Profile from './Profile';

const UserSettings = () => {
  const styles = userSettingsStyles();

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Personalization
        </Typography>
      </Box>
      <Box sx={styles.content}>
        <Profile />
      </Box>
    </Box>
  );
};

UserSettings.displayName = 'UserSettings';

/** @type {MuiSx} */
const userSettingsStyles = () => ({
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
  }),
});

export default UserSettings;
