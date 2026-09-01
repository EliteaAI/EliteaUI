import { memo } from 'react';

import { Box } from '@mui/material';

import OfflineIcon from '@/assets/offline-icon.svg?react';
import OnlineIcon from '@/assets/online-icon.svg?react';

const ParticipantConnectionIcons = memo(props => {
  const { mcpOnline, showMcp, spLoggedIn, showSp, openApiLoggedIn, showOpenApi } = props;

  const styles = participantConnectionIconsStyles();

  return (
    <>
      {showMcp &&
        (mcpOnline ? (
          <Box
            component={OnlineIcon}
            sx={styles.onlineIcon}
          />
        ) : (
          <Box
            component={OfflineIcon}
            sx={styles.offlineIcon}
          />
        ))}
      {showSp &&
        (spLoggedIn ? (
          <Box
            component={OnlineIcon}
            sx={styles.onlineIcon}
          />
        ) : (
          <Box
            component={OfflineIcon}
            sx={styles.offlineIcon}
          />
        ))}
      {showOpenApi &&
        (openApiLoggedIn ? (
          <Box
            component={OnlineIcon}
            sx={styles.onlineIcon}
          />
        ) : (
          <Box
            component={OfflineIcon}
            sx={styles.offlineIcon}
          />
        ))}
    </>
  );
});

ParticipantConnectionIcons.displayName = 'ParticipantConnectionIcons';

/** @type {MuiSx} */
const participantConnectionIconsStyles = () => ({
  onlineIcon: ({ palette }) => ({
    marginLeft: '.5rem',
    width: '1rem',
    height: '1rem',
    color: palette.icon.fill.default,
  }),
  offlineIcon: ({ palette }) => ({
    marginLeft: '.5rem',
    width: '.875rem',
    height: '.875rem',
    color: palette.icon.fill.attention,
  }),
});

export default ParticipantConnectionIcons;
