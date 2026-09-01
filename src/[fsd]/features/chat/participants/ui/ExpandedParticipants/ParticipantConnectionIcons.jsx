import { memo } from 'react';

import { useTheme } from '@mui/material';

import OfflineIcon from '@/assets/offline-icon.svg?react';
import OnlineIcon from '@/assets/online-icon.svg?react';

const ONLINE_STYLE = { marginLeft: '.5rem', width: '1rem', height: '1rem' };
const OFFLINE_STYLE = { marginLeft: '.5rem', width: '.875rem', height: '.875rem' };

const ParticipantConnectionIcons = memo(props => {
  const { mcpOnline, showMcp, spLoggedIn, showSp, openApiLoggedIn, showOpenApi } = props;

  const { palette } = useTheme();

  return (
    <>
      {showMcp &&
        (mcpOnline ? (
          <OnlineIcon style={{ ...ONLINE_STYLE, color: palette.icon.fill.default }} />
        ) : (
          <OfflineIcon style={{ ...OFFLINE_STYLE, color: palette.icon.fill.attention }} />
        ))}
      {showSp &&
        (spLoggedIn ? (
          <OnlineIcon style={{ ...ONLINE_STYLE, color: palette.icon.fill.default }} />
        ) : (
          <OfflineIcon style={{ ...OFFLINE_STYLE, color: palette.icon.fill.attention }} />
        ))}
      {showOpenApi &&
        (openApiLoggedIn ? (
          <OnlineIcon style={{ ...ONLINE_STYLE, color: palette.icon.fill.default }} />
        ) : (
          <OfflineIcon style={{ ...OFFLINE_STYLE, color: palette.icon.fill.attention }} />
        ))}
    </>
  );
});

ParticipantConnectionIcons.displayName = 'ParticipantConnectionIcons';

export default ParticipantConnectionIcons;
