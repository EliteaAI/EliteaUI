import { useCallback } from 'react';

import FullscreenExitOutlinedIcon from '@mui/icons-material/FullscreenExitOutlined';
import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import { IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useTheme } from '@emotion/react';

export default function FullScreenToggle({ isFullScreenChat, setIsFullScreenChat }) {
  const theme = useTheme();
  const handleToggle = useCallback(
    value => () => {
      setIsFullScreenChat(value);
    },
    [setIsFullScreenChat],
  );

  return isFullScreenChat ? (
    <Tooltip
      title="Exit fullscreen mode"
      placement="top"
    >
      <IconButton
        variant="elitea"
        color="secondary"
        onClick={handleToggle(false)}
        sx={{ marginLeft: '0px' }}
      >
        <FullscreenExitOutlinedIcon
          sx={{ fontSize: 16 }}
          fill={theme.palette.icon.fill.secondary}
        />
      </IconButton>
    </Tooltip>
  ) : (
    <Tooltip
      title="Fullscreen mode"
      placement="top"
    >
      <IconButton
        variant="elitea"
        color="secondary"
        onClick={handleToggle(true)}
        sx={{ marginLeft: '0px' }}
      >
        <FullscreenOutlinedIcon
          sx={{ fontSize: 16 }}
          fill={theme.palette.icon.fill.secondary}
        />
      </IconButton>
    </Tooltip>
  );
}
